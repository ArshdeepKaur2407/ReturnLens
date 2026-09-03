"""ReturnLens — Model Training & Comparison Pipeline
Trains and evaluates multiple ML algorithms (Logistic Regression, Random Forest,
HistGradientBoosting, LightGBM, XGBoost) on stratified train/val splits.
Packages and saves the best model pipeline and comparison reports.
"""

import json
import time
from typing import Any, Dict, List, Tuple

import lightgbm as lgb
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

import config
from src.data_loading import load_and_join_data
from src.feature_engineering import (
    build_preprocessor_pipeline,
    get_feature_columns,
    get_transformed_feature_names,
)
from src.utils import compute_metrics, get_logger, save_artifact, timer

logger = get_logger("ReturnLens.Train")


def get_candidate_models() -> Dict[str, Any]:
    """Instantiates candidate classification and regression models."""
    return {
        "Linear Regression": LinearRegression(
            n_jobs=-1,
        ),
        "Logistic Regression": LogisticRegression(
            max_iter=1000,
            C=1.0,
            random_state=config.RANDOM_STATE,
            n_jobs=-1,
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=100,
            max_depth=15,
            min_samples_split=20,
            min_samples_leaf=10,
            random_state=config.RANDOM_STATE,
            n_jobs=-1,
        ),
        "HistGradientBoosting": HistGradientBoostingClassifier(
            max_iter=150,
            max_depth=10,
            learning_rate=0.08,
            random_state=config.RANDOM_STATE,
        ),
        "LightGBM": lgb.LGBMClassifier(
            n_estimators=200,
            learning_rate=0.08,
            num_leaves=31,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=config.RANDOM_STATE,
            n_jobs=-1,
            verbose=-1,
        ),
        "XGBoost": XGBClassifier(
            n_estimators=250,
            learning_rate=0.07,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=config.RANDOM_STATE,
            n_jobs=-1,
            eval_metric="logloss",
        ),
    }


def train_and_compare_models(
    sample_size: int = 250000,
) -> Tuple[pd.DataFrame, str, Pipeline]:
    """Executes the model training, validation, and comparative benchmarking suite.

    Args:
        sample_size: Number of training events to use for training & validation.

    Returns:
        results_df: Comparison metrics DataFrame.
        best_model_name: Name of selected model.
        best_pipeline: Full fitted sklearn Pipeline.
    """
    logger.info(f"Loading training data (sample_size={sample_size})...")
    X_raw, y_raw = load_and_join_data(split="train", sample_size=sample_size)

    logger.info("Partitioning into 80% Train and 20% Validation splits (stratified)...")
    X_train_raw, X_val_raw, y_train, y_val = train_test_split(
        X_raw,
        y_raw,
        test_size=0.20,
        stratify=y_raw,
        random_state=config.RANDOM_STATE,
    )

    logger.info(f"Train split size: {len(X_train_raw)}, Val split size: {len(X_val_raw)}")

    # Extract feature columns
    num_cols, cat_cols = get_feature_columns(X_train_raw)
    logger.info(f"Numeric features ({len(num_cols)}): {num_cols}")
    logger.info(f"Categorical features ({len(cat_cols)}): {cat_cols}")

    # Build and fit preprocessing pipeline strictly on Train split
    with timer("Fitting Preprocessing Pipeline on X_train"):
        preprocessor = build_preprocessor_pipeline(num_cols, cat_cols)
        X_train_trans = preprocessor.fit_transform(X_train_raw)
        X_val_trans = preprocessor.transform(X_val_raw)
        transformed_feature_names = get_transformed_feature_names(preprocessor)

    # Save feature metadata
    metadata = {
        "raw_numeric_features": num_cols,
        "raw_categorical_features": cat_cols,
        "transformed_feature_names": transformed_feature_names,
        "total_transformed_features": len(transformed_feature_names),
        "train_samples": len(X_train_raw),
        "val_samples": len(X_val_raw),
    }
    save_artifact(metadata, config.METADATA_PATH)

    # Train and evaluate candidate models
    candidate_models = get_candidate_models()
    benchmark_results: List[Dict[str, Any]] = []
    fitted_pipelines: Dict[str, Pipeline] = {}

    for name, model in candidate_models.items():
        logger.info(f"\n--- Training {name} ---")
        t0 = time.perf_counter()
        model.fit(X_train_trans, y_train)
        train_time = time.perf_counter() - t0

        # Predict probabilities on validation partition
        if hasattr(model, "predict_proba"):
            y_val_proba = model.predict_proba(X_val_trans)[:, 1]
        else:
            y_val_proba = np.clip(model.predict(X_val_trans), 0.0, 1.0)

        metrics = compute_metrics(y_val, y_val_proba)
        metrics["model_name"] = name
        metrics["train_time_sec"] = round(train_time, 2)
        benchmark_results.append(metrics)

        # Assemble unified full pipeline
        full_pipeline = Pipeline(
            steps=[
                ("preprocessor", preprocessor),
                ("classifier", model),
            ]
        )
        fitted_pipelines[name] = full_pipeline

        logger.info(
            f"{name} Results -> ROC-AUC: {metrics['roc_auc']:.4f} | "
            f"PR-AUC: {metrics['pr_auc']:.4f} | "
            f"F1: {metrics['f1']:.4f} | "
            f"Train Time: {train_time:.2f}s"
        )

    # Compile results table
    results_df = pd.DataFrame(benchmark_results)
    col_order = [
        "model_name",
        "pr_auc",
        "roc_auc",
        "f1",
        "precision",
        "recall",
        "accuracy",
        "brier_score",
        "train_time_sec",
    ]
    results_df = results_df[col_order].sort_values(by="pr_auc", ascending=False)
    try:
        results_df.to_csv(config.COMPARISON_CSV_PATH, index=False)
    except Exception as e:
        logger.warning(f"Could not write {config.COMPARISON_CSV_PATH}: {e}")
        import shutil
        temp_csv = config.REPORTS_DIR / "model_comparison_updated.csv"
        results_df.to_csv(temp_csv, index=False)
        try:
            shutil.move(temp_csv, config.COMPARISON_CSV_PATH)
        except Exception:
            pass
    logger.info(f"\nModel Comparison Summary:\n{results_df.to_string(index=False)}")

    # Plot model comparison
    plot_model_comparison(results_df)

    # Best model selection by PR-AUC (preferring XGBoost if performance is tied/near top)
    xgb_row = results_df[results_df["model_name"] == "XGBoost"]
    top_row = results_df.iloc[0]
    if not xgb_row.empty and (top_row["pr_auc"] - xgb_row.iloc[0]["pr_auc"] < 0.002):
        best_model_name = "XGBoost"
    else:
        best_model_name = top_row["model_name"]
    best_pipeline = fitted_pipelines[best_model_name]
    save_artifact(best_pipeline, config.MODEL_PATH)
    logger.info(f"Selected best model: {best_model_name} (Saved to {config.MODEL_PATH})")

    return results_df, best_model_name, best_pipeline


def plot_model_comparison(results_df: pd.DataFrame) -> None:
    """Generates visual comparison charts for model benchmarking."""
    sns.set_theme(style="whitegrid")
    fig, axes = plt.subplots(1, 2, figsize=(14, 5))

    # PR-AUC vs ROC-AUC
    metrics_melted = results_df.melt(
        id_vars=["model_name"],
        value_vars=["pr_auc", "roc_auc"],
        var_name="Metric",
        value_name="Score",
    )
    sns.barplot(
        data=metrics_melted,
        x="model_name",
        y="Score",
        hue="Metric",
        palette=["#3b82f6", "#10b981"],
        ax=axes[0],
    )
    axes[0].set_title("PR-AUC & ROC-AUC Comparison on Validation Set", fontsize=12, fontweight="bold")
    axes[0].set_ylim(0.5, 1.0)
    axes[0].set_xlabel("Model Architecture")
    axes[0].tick_params(axis="x", rotation=25)

    # F1 vs Training Time
    sns.barplot(
        data=results_df,
        x="model_name",
        y="f1",
        palette="viridis",
        ax=axes[1],
    )
    axes[1].set_title("F1 Score Comparison on Validation Set", fontsize=12, fontweight="bold")
    axes[1].set_ylim(0.5, 1.0)
    axes[1].set_xlabel("Model Architecture")
    axes[1].tick_params(axis="x", rotation=25)

    plt.tight_layout()
    plt.savefig(config.COMPARISON_CHART_PATH, dpi=300)
    plt.close()
    logger.info(f"Saved model comparison chart to {config.COMPARISON_CHART_PATH}")


if __name__ == "__main__":
    train_and_compare_models()
