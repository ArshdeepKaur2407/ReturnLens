# ReturnLens — Business Impact & Cost-Sensitive Decision Report

**Project**: ReturnLens (AI Risk Manager — E-Commerce Return Risk Prediction)  
**Evaluation Set**: Held-Out Test Sample ($N = 50,000$ transactions)  
**Cost Model**: $\text{Total Cost} = (FP \times \$5.00) + (FN \times \$25.00)$  

> ⚠️ **Disclaimer & Scientific Note**: *The financial figures below (\$5.00 FP friction cost and \$25.00 FN return fulfillment cost) are explicit **illustrative assumptions** for academic demonstration. Estimated savings are **model-based counterfactual estimates**; determining true business savings in a live production environment requires randomized A/B intervention testing.*

---

## 1. Operating Policy Comparison (Held-Out Test Sample)

| Metric | Unmanaged Baseline (No Intervention) | Standard Cutoff (τ = 0.50) | Cost-Optimal Cutoff (τ = 0.17) |
| :--- | :---: | :---: | :---: |
| **Operating Threshold (τ)** | None (Accept All) | 0.50 | **0.17** |
| **Flagged Orders** | 0 (0.00%) | 29,096 (58.19%) | **44,565 (89.13%)** |
| **Intercepted Returns (TP)** | 0 | 21,647 (78.47% recall) | **27,102 (98.25% recall)** |
| **Customer Friction Triggers (FP)** | 0 | 7,449 (14.90%) | **17,463 (34.93%)** |
| **Unmanaged Returns (FN)** | 27,585 | 5,938 | **483** |
| **Illustrative Total Cost ($)** | **$689,625.00** | **$185,695.00** | **$99,390.00** |
| **Estimated Model Savings ($)** | \$0.00 (Baseline) | **$503,930.00 (73.1%)** | **$590,235.00 (85.6%)** |

---

## 2. Interpretation of the Cost Curve

1. **Asymmetric Penalty Dynamics**:
   - In e-commerce return risk, a False Negative carries reverse-shipping, packaging, and restocking losses (assumed at \$25.00).
   - A False Positive triggers a mild verification prompt (e.g. size confirmation, return policy reminder), assumed to cost \$5.00 in friction or retention impact.
2. **Why τ* is Lower Than 0.50**:
   - The theoretical Bayes risk cutoff for this cost ratio is $\tau^* = \frac530 \approx 0.167$.
   - The empirical sweep on validation data selects **0.17**, aligning closely with theoretical expectations.
3. **Operational Trade-Off**:
   - At $\tau = 0.50$, the system balances accuracy (73.2%) and flags 58.2% of orders.
   - At $\tau = 0.17$, the system prioritizes intercepting 98.2% of returns, cutting unmanaged return leakage to just 483 orders.
