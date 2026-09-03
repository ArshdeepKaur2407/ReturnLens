"""ReturnLens — Shared Utilities Module
Provides logging, evaluation metrics, model serialization, risk classification,
and visualization utilities.
"""

import json
import logging
import time
from contextlib import contextmanager
from pathlib import Path
from typing import Any, Dict, Tuple

try:
    import joblib
except ImportError:
    joblib = None

try:
    import matplotlib.pyplot as plt
except ImportError:
    plt = None

import numpy as np

try:
    import pandas as pd
except ImportError:
    pd = None

try:
    from sklearn.metrics import (
        accuracy_score,
        average_precision_score,
        brier_score_loss,
        confusion_matrix,
        f1_score,
        precision_recall_curve,
        precision_score,
        recall_score,
        roc_auc_score,
        roc_curve,
    )
except ImportError:
    pass

import config


def get_logger(name: str = "ReturnLens") -> logging.Logger:
    """Configures and returns a structured standard logger."""
    logger = logging.getLogger(name)
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        ch = logging.StreamHandler()
        ch.setFormatter(formatter)
        logger.addHandler(ch)
    return logger


logger = get_logger("ReturnLens.Utils")


@contextmanager
def timer(task_name: str):
    """Context manager for timing operations."""
    t0 = time.perf_counter()
    logger.info(f"Starting: {task_name}")
    yield
    elapsed = time.perf_counter() - t0
    logger.info(f"Finished: {task_name} in {elapsed:.2f} seconds")


def compute_metrics(
    y_true: np.ndarray,
    y_proba: np.ndarray,
    threshold: float = 0.50,
) -> Dict[str, Any]:
    """Computes comprehensive classification and probability metrics."""
    y_pred = (y_proba >= threshold).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()

    roc_auc = float(roc_auc_score(y_true, y_proba))
    pr_auc = float(average_precision_score(y_true, y_proba))
    brier = float(brier_score_loss(y_true, y_proba))
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))

    return {
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier_score": round(brier, 4),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "threshold": round(threshold, 4),
        "confusion_matrix": {
            "TN": int(tn),
            "FP": int(fp),
            "FN": int(fn),
            "TP": int(tp),
        },
    }


def classify_risk(probability: float) -> Tuple[str, str]:
    """Maps a predicted return probability to its risk tier and recommendation."""
    for tier, (low, high, rec) in config.RISK_CATEGORIES.items():
        if low <= probability < high or (tier == "VERY_HIGH" and probability >= high):
            return tier, rec
    return "MEDIUM", config.RISK_CATEGORIES["MEDIUM"][2]


def save_artifact(obj: Any, path: Path) -> None:
    """Serializes model or dictionary artifacts."""
    path.parent.mkdir(parents=True, exist_ok=True)
    if str(path).endswith(".json"):
        with open(path, "w", encoding="utf-8") as f:
            json.dump(obj, f, indent=2)
    else:
        joblib.dump(obj, path)
    logger.info(f"Saved artifact to {path}")


def load_artifact(path: Path) -> Any:
    """Loads model or json artifacts."""
    if not path.exists():
        raise FileNotFoundError(f"Artifact not found at {path}")
    if str(path).endswith(".json"):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    if joblib is None:
        raise ImportError(f"joblib is required to load binary artifact {path}")
    return joblib.load(path)
