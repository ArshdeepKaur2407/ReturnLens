# ReturnLens — Held-Out Test Set Evaluation Report

> **Evaluation Mode**: Strict Single-Pass Evaluation on Held-Out Test Partition (`event_table_testing_raw.p`)  
> **Model Evaluated**: `models/best_model.joblib` (XGBoost Classifier + Scikit-Learn ColumnTransformer)  
> **Evaluated Test Sample Size**: **50,000** transactions (Seed: 42)  
> **Target Class**: Positive = 1 (Returned: 27,585 orders, 55.17%), Negative = 0 (Kept: 22,415 orders, 44.83%)  
> **Zero Leakage Guarantee**: Preprocessor fitted exclusively on $X_{\text{train}}$; threshold selected strictly on validation split.

---

## 1. Primary Classification & Discrimination Metrics

| Evaluation Metric | Standard Threshold (τ = 0.50) | Validation-Selected Threshold (τ = 0.17) | Metric Description |
| :--- | :---: | :---: | :--- |
| **ROC-AUC** | **0.8119** | **0.8119** | Area under ROC Curve (discrimination power) |
| **PR-AUC** | **0.8418** | **0.8418** | Area under Precision-Recall Curve (positive class focus) |
| **Accuracy** | **73.23%** | **64.11%** | Overall fraction of correct predictions |
| **Precision** | **74.40%** | **60.81%** | True returns among all flagged orders |
| **Recall (Sensitivity)** | **78.47%** | **98.25%** | Fraction of actual returns successfully detected |
| **F1-Score** | **0.7638** | **0.7513** | Harmonic mean of Precision and Recall |
| **Brier Score** | **0.1754** | **0.1754** | Mean squared probability error (0.0 = perfect calibration) |

---

## 2. Confusion Matrices & Operating Points

### A. At Standard Cutoff (τ = 0.50)
* **True Negatives (TN)**: **14,966** (29.9%) — Kept orders cleared without friction.
* **True Positives (TP)**: **21,647** (43.3%) — Returns detected for targeted intervention.
* **False Positives (FP)**: **7,449** (14.9%) — Non-returned orders flagged unnecessarily.
* **False Negatives (FN)**: **5,938** (11.9%) — Missed returns incurring full fulfillment loss.
* **Flag Rate**: **58.19%**

### B. At Cost-Optimal Cutoff (τ = 0.17)
* **True Negatives (TN)**: **4,952** (9.9%)
* **True Positives (TP)**: **27,102** (54.2%)
* **False Positives (FP)**: **17,463** (34.9%)
* **False Negatives (FN)**: **483** (1.0%)
* **Flag Rate**: **89.13%**

---

## 3. Candidate Model Comparison on Validation Partition (N=20,000)

| Model Name | PR-AUC | ROC-AUC | Accuracy | Precision | Recall | F1-Score | Brier Score | Fit Time |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **XGBoost** | 0.8073 | 0.7762 | 70.18% | 69.73% | 80.90% | 0.7490 | 0.1898 | 3.79s |
| **Logistic Regression** | 0.8040 | 0.7742 | 70.12% | 70.02% | 79.85% | 0.7461 | 0.1909 | 0.95s |
| **Baseline (Prior)** | 0.5500 | 0.5000 | 55.00% | 55.00% | 100.00% | 0.7097 | 0.2475 | 0.00s |

---

## 4. Key Takeaways & Discussion

1. **Simple Baseline**: The majority prior baseline achieves 50.0% ROC-AUC and 55.0% accuracy, providing the statistical floor.
2. **Logistic Regression vs. XGBoost**: Logistic Regression provides a strong, interpretable baseline (~0.774 ROC-AUC), while XGBoost captures subtle non-linear interactions (~0.776 ROC-AUC on validation, ~0.812 on held-out test).
3. **Threshold Selection Effect**: Because missing a return is assumed to be 5× more costly than unnecessary customer friction ($25 vs $5), lowering the threshold to 0.17 pushes recall to 98.25%, minimizing expected operational loss at the expense of higher flag rate.
