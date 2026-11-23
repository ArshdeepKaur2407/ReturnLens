"""ReturnLens — Model Training & Comparison Pipeline
Trains and evaluates candidate models (Baseline, Logistic Regression, XGBoost)
on a stratified 80/20 train/validation split from verified original raw events.
Exports full pipeline, booster, preprocessor parameters, and benchmark results.
"""

import json
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
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
    """Instantiates the primary candidate models: simple baseline, logistic regression, and XGBoost."""
    return {
        "Baseline (Prior)": DummyClassifier(
            strategy="prior",
        ),
        "Logistic Regression": LogisticRegression(
            max_iter=1000,
            C=1.0,
            random_state=config.RANDOM_STATE,
            n_jobs=-1,
        ),
        "XGBoost": XGBClassifier(
            n_estimators=150,
            learning_rate=0.08,
            max_depth=5,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=config.RANDOM_STATE,
            n_jobs=-1,
            eval_metric="logloss",
        ),
    }


def export_inference_artifacts(
    preprocessor: Pipeline,
    xgb_classifier: XGBClassifier,
    num_cols: List[str],
    cat_cols: List[str],
    transformed_feature_names: List[str],
) -> None:
    """Exports lightweight JSON artifacts for pure-Python inference and FastAPI runtime."""
    ct = preprocessor.named_steps["column_transformer"]
    num_trans = ct.transformers_[0][1]
    imputer = num_trans.named_steps["imputer"]
    scaler = num_trans.named_steps["scaler"]

    cat_trans = ct.transformers_[1][1]
    encoder = cat_trans.named_steps["encoder"]

    cat_categories_dict = {}
    for i, col in enumerate(cat_cols):
        cat_categories_dict[col] = [str(c) for c in encoder.categories_[i].tolist()]

    prep_data = {
        "current_year": 2026,
        "num_cols": num_cols,
        "num_medians": imputer.statistics_.tolist(),
        "num_means": scaler.mean_.tolist(),
        "num_scales": scaler.scale_.tolist(),
        "cat_cols": cat_cols,
        "cat_categories": cat_categories_dict,
        "cat_missing_token": "MISSING",
        "feature_names_out": transformed_feature_names,
    }

    prep_json_path = config.MODELS_DIR / "inference_preprocessor.json"
    with open(prep_json_path, "w", encoding="utf-8") as f:
        json.dump(prep_data, f, indent=2)
    logger.info(f"Saved inference preprocessor metadata to {prep_json_path}")

    # Export Booster JSON for NativeTreeModel
    booster_path = config.MODELS_DIR / "best_model_booster.json"
    xgb_classifier.get_booster().save_model(str(booster_path))
    logger.info(f"Saved native XGBoost booster to {booster_path}")


def train_and_compare_models(
    sample_size: int = 100000,
) -> Tuple[pd.DataFrame, str, Pipeline]:
    """Executes model training, validation, and comparative benchmarking.

    Args:
        sample_size: Number of raw training events to sample (default: 100,000).

    Returns:
        results_df: Comparison metrics DataFrame.
        best_model_name: Name of selected model.
        best_pipeline: Full fitted sklearn Pipeline.
    """
    logger.info(f"Loading raw training data (sample_size={sample_size}, seed={config.RANDOM_STATE})...")
    X_raw, y_raw = load_and_join_data(split="train", sample_size=sample_size, random_state=config.RANDOM_STATE)

    logger.info("Partitioning into 80% Train (80k) and 20% Validation (20k) splits (stratified)...")
    X_train_raw, X_val_raw, y_train, y_val = train_test_split(
        X_raw,
        y_raw,
        test_size=0.20,
        stratify=y_raw,
        random_state=config.RANDOM_STATE,
    )

    logger.info(f"Train split size: {len(X_train_raw):,}, Val split size: {len(X_val_raw):,}")

    # Extract feature columns from training partition
    num_cols, cat_cols = get_feature_columns(X_train_raw)
    logger.info(f"Numeric features ({len(num_cols)}): {num_cols}")
    logger.info(f"Categorical features ({len(cat_cols)}): {cat_cols}")

    # Build and fit preprocessing pipeline strictly on Train split
    with timer("Fitting Preprocessing Pipeline strictly on X_train"):
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
    fitted_classifiers: Dict[str, Any] = {}

    for name, model in candidate_models.items():
        logger.info(f"\n--- Training {name} ---")
        t0 = time.perf_counter()
        model.fit(X_train_trans, y_train)
        train_time = time.perf_counter() - t0
        fitted_classifiers[name] = model

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
            f"Accuracy: {metrics['accuracy']*100:.2f}% | "
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
    results_df.to_csv(config.COMPARISON_CSV_PATH, index=False)
    logger.info(f"\nModel Comparison Summary:\n{results_df.to_string(index=False)}")

    # Plot model comparison chart
    plot_model_comparison(results_df)

    # Select best model: XGBoost
    best_model_name = "XGBoost"
    best_pipeline = fitted_pipelines[best_model_name]
    save_artifact(best_pipeline, config.MODEL_PATH)
    logger.info(f"Selected best model: {best_model_name} (Saved to {config.MODEL_PATH})")

    # Export inference artifacts for NativeTreeModel and FastAPI
    export_inference_artifacts(
        preprocessor=preprocessor,
        xgb_classifier=fitted_classifiers["XGBoost"],
        num_cols=num_cols,
        cat_cols=cat_cols,
        transformed_feature_names=transformed_feature_names,
    )

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
        palette=["#2563eb", "#10b981"],
        ax=axes[0],
    )
    axes[0].set_title("PR-AUC & ROC-AUC Comparison on Validation Set (N=20,000)", fontsize=11, fontweight="bold")
    axes[0].set_ylim(0.4, 1.0)
    axes[0].set_xlabel("Model Architecture")
    axes[0].tick_params(axis="x", rotation=15)

    # Accuracy vs F1
    acc_f1_melted = results_df.melt(
        id_vars=["model_name"],
        value_vars=["accuracy", "f1"],
        var_name="Metric",
        value_name="Score",
    )
    sns.barplot(
        data=acc_f1_melted,
        x="model_name",
        y="Score",
        hue="Metric",
        palette=["#f59e0b", "#6366f1"],
        ax=axes[1],
    )
    axes[1].set_title("Accuracy & F1-Score on Validation Set (N=20,000)", fontsize=11, fontweight="bold")
    axes[1].set_ylim(0.4, 1.0)
    axes[1].set_xlabel("Model Architecture")
    axes[1].tick_params(axis="x", rotation=15)

    plt.tight_layout()
    plt.savefig(config.COMPARISON_CHART_PATH, dpi=200)
    plt.close()
    logger.info(f"Saved model comparison chart to {config.COMPARISON_CHART_PATH}")


if __name__ == "__main__":
    train_and_compare_models()
