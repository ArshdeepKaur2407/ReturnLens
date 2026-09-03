"""ReturnLens — Data Loading and Join Pipeline Module
Loads raw pickle tables, resolves duplicate column names, deduplicates entity snapshots,
and performs leakage-safe relational joins.
"""

import os
import pickle
from typing import Dict, Optional, Tuple

import numpy as np
import pandas as pd

import config
from src.utils import get_logger, timer

logger = get_logger("ReturnLens.DataLoading")


def fix_duplicate_column_names(df: pd.DataFrame) -> pd.DataFrame:
    """Detects and uniquely suffixes duplicate column names (e.g. return_code_D)."""
    cols = pd.Series(df.columns)
    for dup in cols[cols.duplicated()].unique():
        dup_indices = cols[cols == dup].index.tolist()
        for idx_num, col_idx in enumerate(dup_indices, start=1):
            cols.iloc[col_idx] = f"{dup}_{idx_num}"
    df = df.copy()
    df.columns = cols.values
    return df


def load_pickle_file(file_path: os.PathLike) -> pd.DataFrame:
    """Loads a single pickle DataFrame with logging."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Dataset file not found: {file_path}")
    with open(file_path, "rb") as f:
        df = pickle.load(f)
    logger.info(f"Loaded {os.path.basename(file_path)} — Shape: {df.shape}")
    return df


def clean_and_deduplicate_nodes(
    cust_df: pd.DataFrame,
    prod_df: pd.DataFrame,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """Cleans column headers and removes duplicate entity records, keeping the latest."""
    with timer("Cleaning and Deduplicating Node Tables"):
        # Fix duplicate column headers
        cust_clean = fix_duplicate_column_names(cust_df)
        prod_clean = fix_duplicate_column_names(prod_df)

        # Drop exact duplicates
        prod_clean = prod_clean.drop_duplicates()
        cust_clean = cust_clean.drop_duplicates()

        # Deduplicate on primary key, retaining last snapshot
        cust_dedup = cust_clean.drop_duplicates(subset=[config.CUSTOMER_KEY], keep="last")
        prod_dedup = prod_clean.drop_duplicates(subset=[config.VARIANT_KEY], keep="last")

        logger.info(
            f"Customer nodes deduplicated: {cust_df.shape[0]} -> {cust_dedup.shape[0]} unique customers"
        )
        logger.info(
            f"Product nodes deduplicated: {prod_df.shape[0]} -> {prod_dedup.shape[0]} unique variants"
        )
        return cust_dedup, prod_dedup


def load_raw_tables() -> Dict[str, pd.DataFrame]:
    """Loads all 6 raw dataset pickle files."""
    with timer("Loading Raw Dataset Files"):
        return {
            "cust_train": load_pickle_file(config.CUSTOMER_NODES_TRAIN),
            "cust_test": load_pickle_file(config.CUSTOMER_NODES_TEST),
            "prod_train": load_pickle_file(config.PRODUCT_NODES_TRAIN),
            "prod_test": load_pickle_file(config.PRODUCT_NODES_TEST),
            "ev_train": load_pickle_file(config.EVENT_TABLE_TRAIN),
            "ev_test": load_pickle_file(config.EVENT_TABLE_TEST),
        }


def load_and_join_data(
    split: str = "train",
    sample_size: Optional[int] = None,
    random_state: int = config.RANDOM_STATE,
) -> Tuple[pd.DataFrame, pd.Series]:
    """Loads events and performs leakage-safe left joins with customer and product nodes.

    Args:
        split: 'train' or 'test'.
        sample_size: Optional row cap for fast development/testing.
        random_state: Random seed for sampling.

    Returns:
        X (pd.DataFrame): Features dataframe.
        y (pd.Series): Target binary labels.
    """
    with timer(f"Loading and Joining Dataset for split='{split}'"):
        raw = load_raw_tables()

        if split == "train":
            events = raw["ev_train"]
            cust_node, prod_node = clean_and_deduplicate_nodes(
                raw["cust_train"], raw["prod_train"]
            )
        elif split == "test":
            events = raw["ev_test"]
            # For test evaluation, incorporate test profiles with train profiles as fallback
            cust_tr_dedup, prod_tr_dedup = clean_and_deduplicate_nodes(
                raw["cust_train"], raw["prod_train"]
            )
            cust_te_dedup, prod_te_dedup = clean_and_deduplicate_nodes(
                raw["cust_test"], raw["prod_test"]
            )

            # Combine node references (test profile overrides/updates train profile)
            cust_node = pd.concat([cust_tr_dedup, cust_te_dedup]).drop_duplicates(
                subset=[config.CUSTOMER_KEY], keep="last"
            )
            prod_node = pd.concat([prod_tr_dedup, prod_te_dedup]).drop_duplicates(
                subset=[config.VARIANT_KEY], keep="last"
            )
        else:
            raise ValueError(f"Unknown split: {split}. Must be 'train' or 'test'.")

        if sample_size is not None and sample_size < len(events):
            logger.info(f"Sampling {sample_size} events from {len(events)} total events...")
            events = events.sample(n=sample_size, random_state=random_state)

        initial_row_count = len(events)

        # Execute Left Joins
        merged = events.merge(
            cust_node,
            on=config.CUSTOMER_KEY,
            how="left",
        )
        merged = merged.merge(
            prod_node,
            on=config.VARIANT_KEY,
            how="left",
            suffixes=("_cust", "_prod"),
        )

        assert len(merged) == initial_row_count, (
            f"Join row count mismatch! Expected {initial_row_count}, got {len(merged)}"
        )

        # Separate target
        if config.TARGET_COL not in merged.columns:
            raise KeyError(f"Target column '{config.TARGET_COL}' missing from merged data!")

        y = merged[config.TARGET_COL].astype(int)
        X = merged.drop(columns=[config.TARGET_COL])

        logger.info(
            f"Join complete for split='{split}' — X Shape: {X.shape}, y Class Balance: "
            f"0: {(y == 0).sum()} ({(y == 0).mean()*100:.2f}%), "
            f"1: {(y == 1).sum()} ({(y == 1).mean()*100:.2f}%)"
        )
        return X, y
