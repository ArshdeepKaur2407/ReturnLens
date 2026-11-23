"""ReturnLens — Held-Out Test Evaluation & Master Metrics Compilation
Executes a single unbiased evaluation pass on the official held-out test set
(event_table_testing_raw.p), reporting performance at both 0.50 and the
validation-selected optimal threshold.
Saves unified reports/evaluation_results.json and confusion matrix charts.
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.pipeline import Pipeline

import config
from src.data_loading import load_and_join_data
from src.utils import get_logger, load_artifact, save_artifact, timer

logger = get_logger("ReturnLens.Evaluate")


def evaluate_held_out_test(
    sample_size: int = 50000,
) -> Dict[str, Any]:
    """Runs a single evaluation pass on the held-out raw test set.

    Args:
        sample_size: Number of test events to sample (default: 50,000).

    Returns:
        eval_master: Comprehensive dictionary of evaluated metrics.
    """
    logger.info("Loading persisted model pipeline...")
    pipeline: Pipeline = load_artifact(config.MODEL_PATH)

    # Read validation-selected threshold
    threshold_conf = load_artifact(config.THRESHOLD_PATH)
    opt_thresh = float(threshold_conf.get("optimal_threshold", 0.17))
    fp_cost = float(threshold_conf.get("fp_cost", config.FP_COST))
    fn_cost = float(threshold_conf.get("fn_cost", config.FN_COST))

    logger.info(f"Loading raw held-out test set (sample_size={sample_size}, seed={config.RANDOM_STATE})...")
    X_test_raw, y_test = load_and_join_data(split="test", sample_size=sample_size, random_state=config.RANDOM_STATE)

    with timer("Inference on Held-Out Test Set"):
        y_test_proba = pipeline.predict_proba(X_test_raw)[:, 1]

    y_test_arr = y_test.values
    n_test = len(y_test_arr)
    n_actual_pos = int(np.sum(y_test_arr == 1))
    n_actual_neg = int(np.sum(y_test_arr == 0))
    test_baseline_cost = n_actual_pos * fn_cost

    roc_auc = round(float(roc_auc_score(y_test_arr, y_test_proba)), 4)
    pr_auc = round(float(average_precision_score(y_test_arr, y_test_proba)), 4)
    brier = round(float(brier_score_loss(y_test_arr, y_test_proba)), 4)

    # 1. Metrics at standard 0.50 threshold
    pred_50 = (y_test_proba >= 0.50).astype(int)
    tn50, fp50, fn50, tp50 = confusion_matrix(y_test_arr, pred_50).ravel()
    cost50 = fp50 * fp_cost + fn50 * fn_cost
    savings50 = test_baseline_cost - cost50
    flag_rate50 = (tp50 + fp50) / n_test

    metrics_0_50 = {
        "threshold": 0.50,
        "accuracy": round(float(accuracy_score(y_test_arr, pred_50)), 4),
        "precision": round(float(precision_score(y_test_arr, pred_50, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test_arr, pred_50, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test_arr, pred_50, zero_division=0)), 4),
        "roc_auc": roc_auc,
        "pr_auc": pr_auc,
        "brier_score": brier,
        "confusion_matrix": {"TN": int(tn50), "FP": int(fp50), "FN": int(fn50), "TP": int(tp50)},
        "cost_analysis": {
            "baseline_cost": round(float(test_baseline_cost), 2),
            "incurred_cost": round(float(cost50), 2),
            "estimated_savings": round(float(savings50), 2),
            "savings_percent": round(float((savings50 / test_baseline_cost) * 100), 2),
            "flag_rate": round(float(flag_rate50), 4),
        },
    }

    # 2. Metrics at validation-selected optimal threshold
    pred_opt = (y_test_proba >= opt_thresh).astype(int)
    tn_opt, fp_opt, fn_opt, tp_opt = confusion_matrix(y_test_arr, pred_opt).ravel()
    cost_opt = fp_opt * fp_cost + fn_opt * fn_cost
    savings_opt = test_baseline_cost - cost_opt
    flag_rate_opt = (tp_opt + fp_opt) / n_test

    metrics_opt = {
        "threshold": opt_thresh,
        "accuracy": round(float(accuracy_score(y_test_arr, pred_opt)), 4),
        "precision": round(float(precision_score(y_test_arr, pred_opt, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test_arr, pred_opt, zero_division=0)), 4),
        "f1": round(float(f1_score(y_test_arr, pred_opt, zero_division=0)), 4),
        "roc_auc": roc_auc,
        "pr_auc": pr_auc,
        "brier_score": brier,
        "confusion_matrix": {"TN": int(tn_opt), "FP": int(fp_opt), "FN": int(fn_opt), "TP": int(tp_opt)},
        "cost_analysis": {
            "baseline_cost": round(float(test_baseline_cost), 2),
            "incurred_cost": round(float(cost_opt), 2),
            "estimated_savings": round(float(savings_opt), 2),
            "savings_percent": round(float((savings_opt / test_baseline_cost) * 100), 2),
            "flag_rate": round(float(flag_rate_opt), 4),
        },
    }

    # Read benchmarks from CSV
    benchmarks_df = pd.read_csv(config.COMPARISON_CSV_PATH)
    val_benchmarks = benchmarks_df.to_dict(orient="records")

    # Read feature metadata
    metadata = load_artifact(config.METADATA_PATH)

    # Master evaluation results object
    eval_master = {
        "dataset_verification": {
            "dataset_name": "ASOS E-Commerce Returns Dataset (Predicting Returns in Fashion E-Commerce)",
            "label_status": "Verified un-enhanced original raw labels from event_table_*_raw.p",
            "earlier_experiments_note": "Earlier experiments generated synthetic labels to target ~82% accuracy; current pipeline uses verified raw labels directly.",
            "raw_train_events_total": 1980649,
            "raw_test_events_total": 848850,
            "target_variable": "isReturned (1 = Returned, 0 = Kept)",
            "positive_class": 1,
            "sample_seed": config.RANDOM_STATE,
            "evaluated_sample_sizes": {
                "train_events": metadata["train_samples"],
                "validation_events": metadata["val_samples"],
                "held_out_test_events": n_test,
            },
        },
        "cost_model_assumptions": {
            "fp_cost": fp_cost,
            "fn_cost": fn_cost,
            "formula": "Cost = FP * fp_cost + FN * fn_cost",
            "assumption_note": "$5 FP (customer friction / verification) and $25 FN (reverse logistics, shipping, restock) are illustrative assumptions for educational demonstration. Real business impact requires randomized A/B intervention testing.",
        },
        "validation_benchmarks": val_benchmarks,
        "threshold_selection": {
            "selection_split": "validation (N=20,000)",
            "selected_optimal_threshold": opt_thresh,
            "selection_criterion": "Minimum total illustrative cost on validation set",
            "validation_brier_score": threshold_conf.get("validation_brier_score", brier),
        },
        "held_out_test_evaluation": {
            "sample_size": n_test,
            "actual_positives": n_actual_pos,
            "actual_negatives": n_actual_neg,
            "return_rate_percent": round((n_actual_pos / n_test) * 100, 2),
            "selected_model": "XGBoost",
            "at_0_50_threshold": metrics_0_50,
            "at_validation_selected_threshold": metrics_opt,
        },
    }

    # Save to single structured master JSON source
    save_artifact(eval_master, config.EVALUATION_JSON_PATH)
    logger.info(f"Saved master evaluation results to {config.EVALUATION_JSON_PATH}")

    # Also update test_evaluation_metrics.json for backwards-compatibility
    legacy_test_metrics = {
        "roc_auc": roc_auc,
        "pr_auc": pr_auc,
        "brier_score": brier,
        "accuracy": metrics_0_50["accuracy"],
        "precision": metrics_0_50["precision"],
        "recall": metrics_0_50["recall"],
        "f1": metrics_0_50["f1"],
        "threshold": 0.50,
        "confusion_matrix": metrics_0_50["confusion_matrix"],
        "at_selected_threshold": metrics_opt,
    }
    save_artifact(legacy_test_metrics, config.TEST_METRICS_PATH)
    logger.info(f"Saved legacy test metrics to {config.TEST_METRICS_PATH}")

    # Plot Confusion Matrix side-by-side (0.50 vs Optimal Threshold)
    fig, axes = plt.subplots(1, 2, figsize=(12, 5))
    cm50 = np.array([[tn50, fp50], [fn50, tp50]])
    cm_opt = np.array([[tn_opt, fp_opt], [fn_opt, tp_opt]])

    sns.heatmap(
        cm50,
        annot=True,
        fmt=",d",
        cmap="Blues",
        cbar=False,
        xticklabels=["Pred Kept (0)", "Pred Return (1)"],
        yticklabels=["Actual Kept (0)", "Actual Return (1)"],
        annot_kws={"fontsize": 12, "fontweight": "bold"},
        ax=axes[0],
    )
    axes[0].set_title(f"Standard Threshold (τ = 0.50)\nAccuracy: {metrics_0_50['accuracy']*100:.1f}%, F1: {metrics_0_50['f1']:.3f}", fontsize=11, fontweight="bold")

    sns.heatmap(
        cm_opt,
        annot=True,
        fmt=",d",
        cmap="Blues",
        cbar=False,
        xticklabels=["Pred Kept (0)", "Pred Return (1)"],
        yticklabels=["Actual Kept (0)", "Actual Return (1)"],
        annot_kws={"fontsize": 12, "fontweight": "bold"},
        ax=axes[1],
    )
    axes[1].set_title(f"Validation Cost-Optimal Threshold (τ = {opt_thresh:.2f})\nRecall: {metrics_opt['recall']*100:.1f}%, Cost: ${cost_opt:,.0f}", fontsize=11, fontweight="bold")

    plt.tight_layout()
    cm_path = config.REPORTS_DIR / "confusion_matrix.png"
    plt.savefig(cm_path, dpi=200)
    plt.close()
    logger.info(f"Saved confusion matrix plot to {cm_path}")

    return eval_master


if __name__ == "__main__":
    evaluate_held_out_test()
