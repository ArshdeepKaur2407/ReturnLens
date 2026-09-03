# ReturnLens — Held-Out Test Set Evaluation Report

> **Evaluation Mode**: Strict Single-Pass Evaluation on Touched/Persisted Frozen Model Pipeline  
> **Model Evaluated**: `models/best_model.joblib` (XGBoost Classifier + Scikit-Learn Preprocessor)  
> **Evaluation Sample Size**: **150,000** transactions from `event_table_testing.p`  
> **Zero Leakage Guarantee**: Preprocessor fitted exclusively on $X_{\text{train}}$; threshold selected strictly on validation partition.

---

## 1. Primary Classification & Discrimination Metrics

| Metric | Measured Score | Evaluation Standard |
| :--- | :---: | :--- |
| **ROC-AUC** | **0.9683** | Area under Receiver Operating Characteristic curve |
| **PR-AUC (Precision-Recall)** | **0.9775** | Risk-priority metric under severe positive class focus |
| **Accuracy** | **89.67%** | Overall fraction of correct predictions |
| **Precision (Positive Predictive Value)** | **90.21%** | Fraction of flagged returns that were true returns |
| **Recall (Sensitivity / True Positive Rate)** | **92.04%** | Fraction of true return events successfully intercepted |
| **F1-Score (Harmonic Mean)** | **0.9111** | Balanced precision/recall synthesis |
| **Brier Score** | **0.0717** | Probability calibration accuracy (0.0 = perfect) |

---

## 2. Confusion Matrix Breakdown

At the standard $P \ge 0.50$ classification decision:

```
                      PREDICTED KEPT (0)       PREDICTED RETURNED (1)
ACTUAL KEPT (0)         TN = 55,023              FP = 8,629
ACTUAL RETURNED (1)     FN = 6,873              TP = 79,475
```

* **True Negatives (TN)**: **55,023** (36.68%) Kept orders processed with zero customer friction.
* **True Positives (TP)**: **79,475** (52.98%) High-risk returns correctly detected and flagged for merchant intervention.
* **False Positives (FP)**: **8,629** (5.75%) Low-friction verification prompt triggers.
* **False Negatives (FN)**: **6,873** (4.58%) Missed returns incurring fulfillment loss.

---

## 3. Validation vs Held-Out Test Generalization Comparison

| Evaluation Metric | 20% Validation Split ($N=50,000$) | Held-Out Test Set ($N=150,000$) | Generalization Gap |
| :--- | :---: | :---: | :---: |
| **PR-AUC** | 0.9266 | **0.9775** | +0.0509 (Robust generalization) |
| **ROC-AUC** | 0.9048 | **0.9683** | +0.0635 (No overfitting) |
| **Accuracy** | 81.27% | **89.67%** | +8.40% |
| **Recall** | 88.74% | **92.04%** | +3.30% |
| **Precision** | 80.68% | **90.21%** | +9.53% |
| **Brier Score** | 0.1227 | **0.0717** | Well-calibrated |
