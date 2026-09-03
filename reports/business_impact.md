# ReturnLens — Business Impact & Cost-Sensitive Decision Report

**Project**: ReturnLens (AI Risk Manager — E-Commerce Return Risk Prediction)  
**Status**: Stage 6 Deliverable  
**Disclaimer**: *All financial numbers ($) in this report are based on explicit PLACEHOLDER BUSINESS ASSUMPTIONS (FP Cost: $5.00, FN Cost: $25.00). This is a proof-of-concept prototype and does not represent real Razorpay or partner merchant proprietary financial data or policy.*

---

## 1. Executive Summary & Calibration Assessment

* **Probability Calibration (Brier Score)**: `0.1227` (Close to 0 indicates well-calibrated probabilities).
* **Optimal Cost-Sensitive Threshold**: `0.19` (Determined strictly via minimum cost sweep on Validation data).
* **Held-Out Test Sample Evaluated**: `150,000` orders.

---

## 2. Business Impact & ROI Comparison (Held-Out Test Set)

| Policy Metric | Baseline (Unmanaged / Zero Flagging) | ReturnLens AI Risk Manager | Absolute Impact / Delta |
| :--- | :--- | :--- | :--- |
| **Decision Threshold** | None (Default Accept All) | **`0.19`** | Tuned for minimum financial loss |
| **Flagged High-Risk Orders** | `0 (0.0%)` | **`106,704 (71.14%)`** | Targeted risk intervention |
| **Correctly Intercepted Returns (TP)** | `0` | **`85,096`** | Pre-empted return logistics |
| **Unnecessary Friction on Kept Orders (FP)** | `0` | **`21,608`** | Controlled customer friction |
| **Unmanaged Returns Incurred (FN)** | `86,348` | **`1,252`** | **`85,096` avoided return losses** |
| **Total Operational Loss / Cost ($)** | **`$2,158,700.00`** | **`$139,340.00`** | **`$2,019,360.00 Estimated Savings`** |
| **Cost Reduction Ratio** | Baseline (100%) | **`6.45%`** | **`93.55% Net Loss Reduction`** |

---

## 3. Predicted Probability vs. Observed Return Rate (Validation Data)

| Predicted Probability Range | Mean Predicted Probability | Observed Empirical Return Rate | Order Sample Count |
| :--- | :--- | :--- | :--- |
| 0.00 - 0.10 | 0.0428 | 0.0421 | 8,392 |
| 0.10 - 0.20 | 0.1424 | 0.1454 | 3,198 |
| 0.20 - 0.30 | 0.2468 | 0.2512 | 2,170 |
| 0.30 - 0.40 | 0.3500 | 0.3616 | 2,110 |
| 0.40 - 0.50 | 0.4533 | 0.4571 | 2,446 |
| 0.50 - 0.60 | 0.5520 | 0.5464 | 7,960 |
| 0.60 - 0.70 | 0.6506 | 0.6553 | 2,411 |
| 0.70 - 0.80 | 0.7512 | 0.7516 | 2,886 |
| 0.80 - 0.90 | 0.8562 | 0.8541 | 3,345 |
| 0.90 - 1.00 | 0.9690 | 0.9686 | 15,082 |
