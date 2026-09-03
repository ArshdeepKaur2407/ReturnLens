"""ReturnLens — Calibration, Cost-Sensitive Threshold Optimization & Business Impact
Assesses probability calibration, performs threshold sweep against business cost parameters,
evaluates cost on held-out test data, and computes ROI business impact metrics.
"""

import json
from typing import Any, Dict, List, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
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
    """Calculates calibration curve and empirical bin calibration table."""
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
    val_sample_size: int = 250000,
    test_sample_size: int = 150000,
) -> Dict[str, Any]:
    """Runs complete calibration check, threshold optimization on validation data,
    and single-pass evaluation on held-out test data.
    """
    logger.info("Loading trained pipeline...")
    pipeline: Pipeline = load_artifact(config.MODEL_PATH)

    # 1. Load validation partition
    logger.info("Loading validation partition for threshold tuning...")
    X_raw, y_raw = load_and_join_data(split="train", sample_size=val_sample_size)
    _, X_val_raw, _, y_val = train_test_split(
        X_raw,
        y_raw,
        test_size=0.20,
        stratify=y_raw,
        random_state=config.RANDOM_STATE,
    )

    y_val_proba = pipeline.predict_proba(X_val_raw)[:, 1]
    y_val_arr = y_val.values

    # 2. Calibration Analysis
    prob_true, prob_pred, brier, calib_table = assess_calibration(y_val_arr, y_val_proba)
    logger.info(f"Validation Brier Score: {brier:.4f}")
    logger.info(f"\nPredicted Prob vs Observed Return Rate Table:\n{calib_table.to_string(index=False)}")

    # Plot Calibration Curve
    plt.figure(figsize=(7, 6))
    plt.plot(prob_pred, prob_true, "s-", color="#2563eb", label=f"ReturnLens (Brier={brier:.4f})")
    plt.plot([0, 1], [0, 1], "--", color="#9ca3af", label="Perfect Calibration")
    plt.xlabel("Mean Predicted Probability", fontsize=11)
    plt.ylabel("Observed Return Rate", fontsize=11)
    plt.title("Probability Calibration Curve (Validation Set)", fontsize=12, fontweight="bold")
    plt.legend(loc="lower right")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(config.CALIBRATION_CURVE_PATH, dpi=300)
    plt.close()
    logger.info(f"Saved calibration curve to {config.CALIBRATION_CURVE_PATH}")

    # 3. Threshold Sweep on Validation Data Only
    sweep_df = sweep_thresholds(y_val_arr, y_val_proba, config.FP_COST, config.FN_COST)
    optimal_row = sweep_df.loc[sweep_df["total_cost"].idxmin()]
    optimal_thresh = float(optimal_row["threshold"])
    logger.info(
        f"\nOptimal Decision Threshold on Validation: {optimal_thresh:.2f} "
        f"(Total Cost: ${optimal_row['total_cost']:,.2f}, Savings: ${optimal_row['cost_savings']:,.2f})"
    )

    # Plot Cost vs Threshold Curve
    plt.figure(figsize=(9, 5))
    plt.plot(sweep_df["threshold"], sweep_df["total_cost"], color="#dc2626", lw=2.5, label="Total Expected Cost ($)")
    plt.axvline(optimal_thresh, color="#16a34a", linestyle="--", lw=2, label=f"Optimal Threshold ({optimal_thresh:.2f})")
    plt.title("Expected Business Cost vs. Decision Threshold (Validation Set)", fontsize=12, fontweight="bold")
    plt.xlabel("Return Risk Decision Threshold", fontsize=11)
    plt.ylabel("Total Cost ($) [Placeholder Cost Model]", fontsize=11)
    plt.legend(loc="upper center")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(config.COST_CURVE_PATH, dpi=300)
    plt.close()
    logger.info(f"Saved cost curve to {config.COST_CURVE_PATH}")

    # 4. Save Threshold Configuration
    threshold_data = {
        "optimal_threshold": optimal_thresh,
        "fp_cost_placeholder": config.FP_COST,
        "fn_cost_placeholder": config.FN_COST,
        "validation_brier_score": round(brier, 4),
        "validation_expected_cost": round(float(optimal_row["total_cost"]), 2),
        "validation_cost_savings": round(float(optimal_row["cost_savings"]), 2),
        "validation_flag_rate": round(float(optimal_row["flag_rate"]), 4),
        "risk_categories": config.RISK_CATEGORIES,
    }
    save_artifact(threshold_data, config.THRESHOLD_PATH)

    # 5. Apply Optimal Threshold to Held-Out Test Set (Single Untouched Pass)
    logger.info("Applying optimal threshold to held-out test set...")
    X_test_raw, y_test = load_and_join_data(split="test", sample_size=test_sample_size)
    y_test_proba = pipeline.predict_proba(X_test_raw)[:, 1]
    y_test_arr = y_test.values

    y_test_pred = (y_test_proba >= optimal_thresh).astype(int)
    tn_t, fp_t, fn_t, tp_t = confusion_matrix(y_test_arr, y_test_pred).ravel()
    test_cost = (fp_t * config.FP_COST) + (fn_t * config.FN_COST)
    test_baseline_cost = np.sum(y_test_arr == 1) * config.FN_COST
    test_savings = test_baseline_cost - test_cost
    test_flag_rate = (tp_t + fp_t) / len(y_test_arr)

    # 6. Generate Business Impact Report
    report_content = f"""# ReturnLens — Business Impact & Cost-Sensitive Decision Report

**Project**: ReturnLens (AI Risk Manager — E-Commerce Return Risk Prediction)  
**Status**: Stage 6 Deliverable  
**Disclaimer**: *All financial numbers ($) in this report are based on explicit PLACEHOLDER BUSINESS ASSUMPTIONS (FP Cost: ${config.FP_COST:.2f}, FN Cost: ${config.FN_COST:.2f}). This is a proof-of-concept prototype and does not represent real Razorpay or partner merchant proprietary financial data or policy.*

---

## 1. Executive Summary & Calibration Assessment

* **Probability Calibration (Brier Score)**: `{brier:.4f}` (Close to 0 indicates well-calibrated probabilities).
* **Optimal Cost-Sensitive Threshold**: `{optimal_thresh:.2f}` (Determined strictly via minimum cost sweep on Validation data).
* **Held-Out Test Sample Evaluated**: `{len(y_test_arr):,}` orders.

---

## 2. Business Impact & ROI Comparison (Held-Out Test Set)

| Policy Metric | Baseline (Unmanaged / Zero Flagging) | ReturnLens AI Risk Manager | Absolute Impact / Delta |
| :--- | :--- | :--- | :--- |
| **Decision Threshold** | None (Default Accept All) | **`{optimal_thresh:.2f}`** | Tuned for minimum financial loss |
| **Flagged High-Risk Orders** | `0 (0.0%)` | **`{tp_t + fp_t:,} ({test_flag_rate*100:.2f}%)`** | Targeted risk intervention |
| **Correctly Intercepted Returns (TP)** | `0` | **`{tp_t:,}`** | Pre-empted return logistics |
| **Unnecessary Friction on Kept Orders (FP)** | `0` | **`{fp_t:,}`** | Controlled customer friction |
| **Unmanaged Returns Incurred (FN)** | `{np.sum(y_test_arr == 1):,}` | **`{fn_t:,}`** | **`{np.sum(y_test_arr == 1) - fn_t:,}` avoided return losses** |
| **Total Operational Loss / Cost ($)** | **`${test_baseline_cost:,.2f}`** | **`${test_cost:,.2f}`** | **`${test_savings:,.2f} Estimated Savings`** |
| **Cost Reduction Ratio** | Baseline (100%) | **`{(test_cost / test_baseline_cost)*100:.2f}%`** | **`{(test_savings / test_baseline_cost)*100:.2f}% Net Loss Reduction`** |

---

## 3. Predicted Probability vs. Observed Return Rate (Validation Data)

| Predicted Probability Range | Mean Predicted Probability | Observed Empirical Return Rate | Order Sample Count |
| :--- | :--- | :--- | :--- |
"""
    for _, row in calib_table.iterrows():
        report_content += f"| {row['bin_range']} | {row['mean_predicted_prob']:.4f} | {row['empirical_return_rate']:.4f} | {row['count']:,} |\n"

    report_path = config.REPORTS_DIR / "business_impact.md"
    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)
    logger.info(f"Saved business impact report to {report_path}")

    return {
        "optimal_threshold": optimal_thresh,
        "test_savings": test_savings,
        "test_cost": test_cost,
        "test_baseline_cost": test_baseline_cost,
    }


if __name__ == "__main__":
    run_calibration_and_optimization()
