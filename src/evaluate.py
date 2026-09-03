"""ReturnLens — Held-out Test Evaluation Module
Runs exactly ONE unbiased evaluation pass of the final model pipeline on the
official held-out test set (event_table_testing.p + node tables).
Compares validation vs test performance to check for generalization gaps.
"""

from typing import Any, Dict

import numpy as np
import pandas as pd
from sklearn.pipeline import Pipeline

import config
from src.data_loading import load_and_join_data
from src.utils import compute_metrics, get_logger, load_artifact, save_artifact, timer

logger = get_logger("ReturnLens.Evaluate")


def evaluate_held_out_test(
    sample_size: int = 150000,
) -> Dict[str, Any]:
    """Runs a single evaluation pass on the untouched test set.

    Args:
        sample_size: Number of test events to evaluate.

    Returns:
        test_metrics: Dictionary of evaluated metrics on test data.
    """
    logger.info("Loading persisted best model pipeline...")
    pipeline: Pipeline = load_artifact(config.MODEL_PATH)

    logger.info(f"Loading held-out test set (sample_size={sample_size})...")
    X_test_raw, y_test = load_and_join_data(split="test", sample_size=sample_size)

    with timer("Inference on Held-Out Test Set"):
        y_test_proba = pipeline.predict_proba(X_test_raw)[:, 1]

    # Compute metrics at default 0.50 threshold
    test_metrics = compute_metrics(y_test.values, y_test_proba, threshold=0.50)
    logger.info("\n=== HELD-OUT TEST EVALUATION RESULTS (Single Pass) ===")
    logger.info(f"ROC-AUC: {test_metrics['roc_auc']:.4f}")
    logger.info(f"PR-AUC: {test_metrics['pr_auc']:.4f}")
    logger.info(f"Accuracy: {test_metrics['accuracy']:.4f}")
    logger.info(f"Precision: {test_metrics['precision']:.4f}")
    logger.info(f"Recall: {test_metrics['recall']:.4f}")
    logger.info(f"F1 Score: {test_metrics['f1']:.4f}")
    logger.info(f"Brier Score: {test_metrics['brier_score']:.4f}")
    logger.info(f"Confusion Matrix: {test_metrics['confusion_matrix']}")

    # Save test metrics report
    test_report_path = config.REPORTS_DIR / "test_evaluation_metrics.json"
    save_artifact(test_metrics, test_report_path)
    return test_metrics


if __name__ == "__main__":
    evaluate_held_out_test()
