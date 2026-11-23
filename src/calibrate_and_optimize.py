"""ReturnLens — Calibration & Cost-Sensitive Threshold Optimization
Assesses probability calibration (Brier score, empirical bin calibration),
performs decision threshold sweep against illustrative cost parameters ($5 FP, $25 FN),
and determines the optimal operating cutoff on validation data.
"""

import json
import sys
from pathlib import Path
from typing import Any, Dict, List, Tuple

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.calibration import calibration_curve
from sklearn.metrics import brier_score_loss, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

import config
from src.data_loading import load_and_join_data
from src.utils import get_logger, load_artifact, save_artifact, timer

logger = get_logger("ReturnLens.CalibrationOptimization")


def assess_calibration(
    y_true: np.ndarray,
    y_proba: np.ndarray,
    n_bins: int = 10,
) -> Tuple[np.ndarray, np.ndarray, float, pd.DataFrame]:
    """Calculates calibration curve and empirical decile calibration table."""
    prob_true, prob_pred = calibration_curve(y_true, y_proba, n_bins=n_bins, strategy="uniform")
    brier = float(brier_score_loss(y_true, y_proba))

    # Bin table
    bins = np.linspace(0, 1, n_bins + 1)
    bin_assignments = np.digitize(y_proba, bins) - 1
    bin_records = []
    for i in range(n_bins):
        mask = bin_assignments == i
        if np.sum(mask) > 0:
            bin_records.append(
                {
                    "bin_range": f"{bins[i]:.2f} - {bins[i+1]:.2f}",
                    "mean_predicted_prob": round(float(np.mean(y_proba[mask])), 4),
                    "empirical_return_rate": round(float(np.mean(y_true[mask])), 4),
                    "count": int(np.sum(mask)),
                }
            )

    calib_df = pd.DataFrame(bin_records)
    return prob_true, prob_pred, brier, calib_df


def sweep_thresholds(
    y_true: np.ndarray,
    y_proba: np.ndarray,
    fp_cost: float = config.FP_COST,
    fn_cost: float = config.FN_COST,
) -> pd.DataFrame:
    """Sweeps decision thresholds from 0.05 to 0.95 to find minimum-cost policy on validation data."""
    thresholds = np.linspace(0.05, 0.95, 91)
    records = []
    n_total = len(y_true)
    n_actual_pos = np.sum(y_true == 1)

    # Baseline cost: no intervention (all predicted 0 -> FN = all returned orders)
    baseline_cost = n_actual_pos * fn_cost

    for thresh in thresholds:
        y_pred = (y_proba >= thresh).astype(int)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()

        total_cost = (fp * fp_cost) + (fn * fn_cost)
        avg_cost_per_order = total_cost / n_total
        flagged_count = tp + fp
        flag_rate = flagged_count / n_total

        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        cost_savings = baseline_cost - total_cost

        records.append(
            {
                "threshold": round(float(thresh), 4),
                "total_cost": round(float(total_cost), 2),
                "avg_cost_per_order": round(float(avg_cost_per_order), 2),
                "flag_rate": round(float(flag_rate), 4),
                "flagged_orders": int(flagged_count),
                "precision": round(float(prec), 4),
                "recall": round(float(rec), 4),
                "TP": int(tp),
                "FP": int(fp),
                "TN": int(tn),
                "FN": int(fn),
                "cost_savings": round(float(cost_savings), 2),
            }
        )

    return pd.DataFrame(records)


def run_calibration_and_optimization(
    sample_size: int = 100000,
) -> Dict[str, Any]:
    """Runs probability calibration and threshold optimization on validation partition."""
    logger.info("Loading trained model pipeline...")
    pipeline: Pipeline = load_artifact(config.MODEL_PATH)

    logger.info(f"Loading raw validation partition (from {sample_size} sample)...")
    X_raw, y_raw = load_and_join_data(split="train", sample_size=sample_size, random_state=config.RANDOM_STATE)
    _, X_val_raw, _, y_val = train_test_split(
        X_raw,
        y_raw,
        test_size=0.20,
        stratify=y_raw,
        random_state=config.RANDOM_STATE,
    )

    y_val_proba = pipeline.predict_proba(X_val_raw)[:, 1]
    y_val_arr = y_val.values

    # 1. Calibration Analysis
    prob_true, prob_pred, brier, calib_table = assess_calibration(y_val_arr, y_val_proba)
    logger.info(f"Validation Brier Score: {brier:.4f}")

    # Plot Calibration Curve
    plt.figure(figsize=(7, 6))
    plt.plot(prob_pred, prob_true, "s-", color="#2563eb", label=f"ReturnLens (Brier={brier:.4f})")
    plt.plot([0, 1], [0, 1], "--", color="#9ca3af", label="Perfect Calibration")
    plt.xlabel("Mean Predicted Probability", fontsize=11)
    plt.ylabel("Observed Return Rate", fontsize=11)
    plt.title("Probability Calibration Curve (Validation Set, N=20,000)", fontsize=11, fontweight="bold")
    plt.legend(loc="lower right")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(config.CALIBRATION_CURVE_PATH, dpi=200)
    plt.close()
    logger.info(f"Saved calibration curve to {config.CALIBRATION_CURVE_PATH}")

    # 2. Threshold Sweep on Validation Data Only
    sweep_df = sweep_thresholds(y_val_arr, y_val_proba, config.FP_COST, config.FN_COST)
    optimal_row = sweep_df.loc[sweep_df["total_cost"].idxmin()]
    optimal_thresh = float(optimal_row["threshold"])
    logger.info(
        f"\nOptimal Decision Threshold on Validation: {optimal_thresh:.2f} "
        f"(Total Cost: ${optimal_row['total_cost']:,.2f}, Savings: ${optimal_row['cost_savings']:,.2f})"
    )

    # Plot Cost vs Threshold Curve
    plt.figure(figsize=(8, 5))
    plt.plot(sweep_df["threshold"], sweep_df["total_cost"], color="#dc2626", lw=2.5, label="Total Expected Cost ($)")
    plt.axvline(optimal_thresh, color="#16a34a", linestyle="--", lw=2, label=f"Optimal Cutoff ({optimal_thresh:.2f})")
    plt.title("Illustrative Cost vs. Decision Threshold (Validation Set)", fontsize=11, fontweight="bold")
    plt.xlabel("Return Risk Decision Threshold (τ)", fontsize=10)
    plt.ylabel("Expected Cost ($) [Assumed: $5 FP, $25 FN]", fontsize=10)
    plt.legend(loc="upper center")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(config.COST_CURVE_PATH, dpi=200)
    plt.close()
    logger.info(f"Saved cost curve to {config.COST_CURVE_PATH}")

    # Save calibration bins table
    calib_bins_path = config.REPORTS_DIR / "calibration_bins.json"
    calib_table.to_json(calib_bins_path, orient="records", indent=2)
    logger.info(f"Saved calibration bins table to {calib_bins_path}")

    # 3. Save Threshold Configuration (Recalculated, never hardcoded)
    threshold_data = {
        "threshold": optimal_thresh,
        "optimal_threshold": optimal_thresh,
        "fp_cost": config.FP_COST,
        "fn_cost": config.FN_COST,
        "cost_assumptions_note": "Monetary figures ($5 FP, $25 FN) are illustrative placeholder assumptions.",
        "selection_set": "validation",
        "description": "Cost-minimizing decision threshold selected on validation data",
        "validation_brier_score": round(brier, 4),
        "validation_expected_cost": round(float(optimal_row["total_cost"]), 2),
        "validation_cost_savings": round(float(optimal_row["cost_savings"]), 2),
        "validation_flag_rate": round(float(optimal_row["flag_rate"]), 4),
        "risk_categories": config.RISK_CATEGORIES,
    }
    save_artifact(threshold_data, config.THRESHOLD_PATH)
    logger.info(f"Saved threshold configuration to {config.THRESHOLD_PATH}")

    return {
        "optimal_threshold": optimal_thresh,
        "brier_score": brier,
        "calib_table": calib_table.to_dict(orient="records"),
        "validation_expected_cost": float(optimal_row["total_cost"]),
        "validation_cost_savings": float(optimal_row["cost_savings"]),
        "validation_flag_rate": float(optimal_row["flag_rate"]),
    }


if __name__ == "__main__":
    run_calibration_and_optimization()
