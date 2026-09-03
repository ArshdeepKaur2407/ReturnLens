"""ReturnLens — Feature Engineering and Preprocessing Pipeline
Constructs leakage-safe Scikit-Learn transformers for numeric imputation/scaling
and categorical encoding. Computes derived domain features without target leakage.
"""

from __future__ import annotations
import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union

import numpy as np

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from sklearn.base import BaseEstimator, TransformerMixin
    from sklearn.compose import ColumnTransformer
    from sklearn.impute import SimpleImputer
    from sklearn.pipeline import Pipeline
    from sklearn.preprocessing import OneHotEncoder, StandardScaler
except ImportError:
    class _Base: pass
    class _Mixin: pass
    BaseEstimator = _Base
    TransformerMixin = _Mixin
    ColumnTransformer = None
    SimpleImputer = None
    Pipeline = None
    OneHotEncoder = None
    StandardScaler = None

import config
from src.utils import get_logger, timer

logger = get_logger("ReturnLens.FeatureEngineering")


class FeatureDeriver(BaseEstimator, TransformerMixin):
    """Custom Scikit-Learn transformer to construct derived features cleanly.

    Derived features:
    - customer_age: 2026 - yearOfBirth
    - discount_ratio: avgDiscountValue / (avgGbpPrice + 1e-4)
    - net_price: max(0, avgGbpPrice - avgDiscountValue)
    """

    def __init__(self, current_year: int = 2026):
        self.current_year = current_year

    def fit(self, X: pd.DataFrame, y=None):
        return self

    def transform(self, X: pd.DataFrame) -> pd.DataFrame:
        X_out = X.copy()

        # Derived customer age
        if "yearOfBirth" in X_out.columns:
            X_out["customer_age"] = self.current_year - X_out["yearOfBirth"]
            # Clip unrealistic age values
            X_out["customer_age"] = X_out["customer_age"].clip(lower=10, upper=100)

        # Derived pricing dynamics
        if "avgGbpPrice" in X_out.columns and "avgDiscountValue" in X_out.columns:
            price = X_out["avgGbpPrice"].fillna(X_out["avgGbpPrice"].median() if len(X_out) > 0 else 25.0)
            discount = X_out["avgDiscountValue"].fillna(0.0)
            X_out["discount_ratio"] = (discount / (price + 1e-4)).clip(lower=0.0, upper=1.0)
            X_out["net_price"] = (price - discount).clip(lower=0.0)

        return X_out


def get_feature_columns(df: pd.DataFrame) -> Tuple[List[str], List[str]]:
    """Identifies numeric and categorical column subsets, excluding keys and redundant pre-encodings."""
    # Exclude entity keys and redundant raw pre-encoded columns
    exclude_patterns = [
        config.CUSTOMER_KEY,
        config.VARIANT_KEY,
        "hash(productID)",
        "hash(supplierRef)",
        config.TARGET_COL,
        "Country_",
        "Brand_",
        "productType_",
    ]

    candidate_cols = []
    for col in df.columns:
        if any(pat in col for pat in exclude_patterns):
            continue
        candidate_cols.append(col)

    # Derived columns to include in numeric list
    derived_cols = ["customer_age", "discount_ratio", "net_price"]

    # Explicit categorical columns
    cat_cols = ["shippingCountry", "productType", "brandDesc"]
    cat_cols = [c for c in cat_cols if c in df.columns]

    # Numeric columns
    num_cols = [c for c in candidate_cols if c not in cat_cols and c != "yearOfBirth"]
    num_cols.extend([c for c in derived_cols if c not in num_cols])

    # Ensure return code columns are captured
    return_code_cols = [c for c in df.columns if "return_code" in c and c not in num_cols]
    num_cols.extend(return_code_cols)

    # Deduplicate maintaining order
    num_cols = list(dict.fromkeys(num_cols))
    cat_cols = list(dict.fromkeys(cat_cols))

    return num_cols, cat_cols


def build_preprocessor_pipeline(
    num_cols: List[str],
    cat_cols: List[str],
) -> Pipeline:
    """Builds a leakage-safe Scikit-Learn ColumnTransformer pipeline.

    - Numeric pipeline: Median Imputation -> StandardScaler
    - Categorical pipeline: Constant 'MISSING' Imputation -> OneHotEncoder(ignore unseen)
    """
    num_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
            ("scaler", StandardScaler()),
        ]
    )

    cat_pipeline = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="constant", fill_value="MISSING")),
            (
                "encoder",
                OneHotEncoder(
                    handle_unknown="ignore",
                    sparse_output=False,
                ),
            ),
        ]
    )

    column_transformer = ColumnTransformer(
        transformers=[
            ("num", num_pipeline, num_cols),
            ("cat", cat_pipeline, cat_cols),
        ],
        remainder="drop",
    )

    full_preprocessor = Pipeline(
        steps=[
            ("deriver", FeatureDeriver()),
            ("column_transformer", column_transformer),
        ]
    )

    return full_preprocessor


def get_transformed_feature_names(preprocessor: Pipeline) -> List[str]:
    """Extracts output feature names from the fitted ColumnTransformer."""
    ct: ColumnTransformer = preprocessor.named_steps["column_transformer"]
    output_names = []

    for name, trans, cols in ct.transformers_:
        if name == "num":
            output_names.extend(cols)
        elif name == "cat":
            encoder: OneHotEncoder = trans.named_steps["encoder"]
            cat_names = encoder.get_feature_names_out(cols)
            output_names.extend(cat_names.tolist())

    return output_names


class LightweightInferencePreprocessor:
    """Pure Python / NumPy inference preprocessor reproducing the exact fitted
    Scikit-Learn ColumnTransformer pipeline without requiring scikit-learn,
    scipy, or pandas at runtime.
    """

    def __init__(self, metadata_path_or_dict: Union[str, Path, dict]):
        if isinstance(metadata_path_or_dict, (str, Path)):
            with open(metadata_path_or_dict, "r", encoding="utf-8") as f:
                data = json.load(f)
        else:
            data = metadata_path_or_dict

        self.current_year = data.get("current_year", 2026)
        self.num_cols = data["num_cols"]
        self.num_medians = np.array(data["num_medians"], dtype=np.float64)
        self.num_means = np.array(data["num_means"], dtype=np.float64)
        self.num_scales = np.array(data["num_scales"], dtype=np.float64)
        self.cat_cols = data["cat_cols"]
        self.cat_categories = data["cat_categories"]
        self.cat_missing_token = data.get("cat_missing_token", "MISSING")
        self.feature_names_out = data["feature_names_out"]

    def transform_dict(self, raw_dict: dict) -> np.ndarray:
        """Transforms a single transaction dictionary into the exact 73-dimensional
        feature array expected by the XGBoost booster.
        """
        d = dict(raw_dict)

        # 1. Derived features (identical formula to FeatureDeriver)
        yob = d.get("yearOfBirth", 1990)
        if yob is not None and not (isinstance(yob, float) and np.isnan(yob)):
            age = float(np.clip(self.current_year - float(yob), 10.0, 100.0))
        else:
            age = 36.0
        d["customer_age"] = age

        price = d.get("avgGbpPrice")
        discount = d.get("avgDiscountValue", 0.0)
        if discount is None or (isinstance(discount, float) and np.isnan(discount)):
            discount = 0.0
        if price is None or (isinstance(price, float) and np.isnan(price)):
            d["discount_ratio"] = 0.0
            d["net_price"] = 0.0
        else:
            price = float(price)
            discount = float(discount)
            d["discount_ratio"] = float(np.clip(discount / (price + 1e-4), 0.0, 1.0))
            d["net_price"] = float(max(0.0, price - discount))

        # 2. Impute and scale numeric features: (x - mean) / scale
        num_vals = []
        for i, col in enumerate(self.num_cols):
            v = d.get(col)
            if v is None or (isinstance(v, float) and np.isnan(v)):
                v = self.num_medians[i]
            scaled = (float(v) - self.num_means[i]) / self.num_scales[i]
            num_vals.append(scaled)

        # 3. Categorical one-hot encoding
        cat_vals = []
        for col in self.cat_cols:
            raw_cat = d.get(col)
            if raw_cat is None or raw_cat == "":
                raw_cat = self.cat_missing_token
            for c in self.cat_categories[col]:
                cat_vals.append(1.0 if str(raw_cat) == c else 0.0)

        return np.array(num_vals + cat_vals, dtype=np.float64).reshape(1, -1)

    def transform(self, raw_input: Any) -> np.ndarray:
        """Universal transform method supporting dicts, DataFrames, and lists."""
        if isinstance(raw_input, dict):
            return self.transform_dict(raw_input)
        elif hasattr(raw_input, "to_dict"):
            records = raw_input.to_dict(orient="records")
            return np.vstack([self.transform_dict(r) for r in records])
        elif isinstance(raw_input, list) and len(raw_input) > 0 and isinstance(raw_input[0], dict):
            return np.vstack([self.transform_dict(r) for r in raw_input])
        return np.asarray(raw_input, dtype=np.float64)

