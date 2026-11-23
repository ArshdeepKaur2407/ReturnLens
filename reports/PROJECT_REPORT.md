# ReturnLens — Comprehensive College Project Report
## E-Commerce Return Risk Prediction & Cost-Sensitive Decision Engine

> **Academic Level**: Third-Year Computer Science / Engineering Capstone Project  
> **Domain**: Machine Learning, E-Commerce Risk Management, Full-Stack Web Systems  
> **Master Evaluation Source**: [`reports/evaluation_results.json`](reports/evaluation_results.json)  
> **Status**: Complete, Audited, and Verified  

---

## 1. Executive Summary & Problem Overview

In modern e-commerce—particularly within fashion, apparel, and footwear—product returns represent one of the largest operational and financial burdens, with return rates frequently ranging between **30% and 50%** of total order volume. Most returns are not caused by fraudulent payment default or malicious intent, but by customer fit uncertainty, size bracketing (purchasing multiple sizes with the intention of keeping only one), and fabric/style expectations.

### Sourced Comparison: Existing Approaches vs. ReturnLens

| Dimension | Traditional Approach (Rule-Based Policies) | ReturnLens Predictive Machine Learning Engine |
| :--- | :--- | :--- |
| **Operational Logic** | Static, universal heuristics (e.g., blanket 30-day return windows, arbitrary customer blacklisting). | Individual probabilistic estimation $P(\text{Return} \mid \text{Order})$ evaluated before fulfillment. |
| **Customer Experience** | High customer friction applied indiscriminately; alienates loyal buyers. | Surgical, targeted prompts (e.g., proactive sizing fit confirmation, return policy reminders). |
| **Catalog Sensitivity** | Treats all items equally; blind to high-variance garment types and price points. | Integrates product category historical return propensity, brand tendencies, price, and discounts. |
| **Decision Cutoff** | Arbitrary or uniform thresholds ($\tau = 0.50$). | **Cost-Sensitive Optimization**: Dynamically selects $\tau^* = 0.17$ balancing $\$5$ friction against $\$25$ return loss. |
| **Explainability** | Opaque rule fires without clear explanation. | **TreeSHAP Attributions**: Quantifies top 3 additive log-odds feature drivers for every prediction. |

### Dataset Source Citation
All modeling and empirical validation in this project are conducted on the **ASOS Fashion E-Commerce Dataset** (*"Predicting Returns in Fashion E-Commerce"*), a benchmark dataset comprising **2,829,499 real-world retail transactions** (1,980,649 training events and 848,850 test events) linked to 1.12 million customer profile snapshots and 576,000 product catalog variant records.

---

## 2. Plain-English Guide to Every Project Tool

To ensure transparent understanding and defense during an academic viva/presentation, the table below documents what each major tool does in ReturnLens, why it is necessary, and whether it provides **measured predictive improvement** or **usability/interpretability benefits**.

| Tool / Technology | What It Does in This Project | Why It Is Useful | Measured Prediction vs. Usability Benefit |
| :--- | :--- | :--- | :--- |
| **Pandas** | Tabular data manipulation, handling missing values, left joins between event orders and entity node tables. | Allows structured, relational queries across millions of transactions with vectorized speed. | **Data Pipeline Foundation**: Required to prepare data matrices. |
| **Scikit-Learn Preprocessing (`ColumnTransformer`, `SimpleImputer`, `StandardScaler`, `OneHotEncoder`)** | Encapsulates numeric median imputation, z-score scaling, and categorical one-hot encoding into an isolated pipeline. | Guarantees **zero data leakage**: transformers are fit *exclusively* on the training split ($X_{\text{train}}$) and merely applied to validation and test sets. | **Integrity & Prediction**: Prevents test contamination; ensures valid, generalizable weights. |
| **Feature Engineering (`FeatureDeriver`)** | Computes pre-fulfillment attributes available at checkout: `customer_age` ($2026 - \text{yearOfBirth}$), `discount_ratio` ($\frac{\text{discount}}{\text{price}}$), and `net_price`. | Explicitly models buyer age demographics and promotional price elasticity. | **Measured Prediction Improvement**: Enhances discrimination of price-sensitive buyers. |
| **Dummy Baseline Classifier (`strategy='prior'`)** | Predicts the majority class prior probability (55.0% return rate) for all instances. | Establishes the empirical performance floor; any ML model must convincingly outperform this. | **Benchmark Reference**: Yields 50.0% ROC-AUC and 55.0% Accuracy. |
| **Logistic Regression** | Linear statistical model estimating log-odds of return: $\ln\left(\frac{p}{1-p}\right) = \beta_0 + \sum \beta_i x_i$. | Highly transparent, fast baseline (fits in 0.95 seconds) that confirms linear separability. | **Measured Prediction Improvement**: Achieves **0.7742 ROC-AUC** and **70.12% Accuracy** on validation data. |
| **XGBoost Classifier (`XGBClassifier`)** | Gradient boosted ensemble of 150 shallow decision trees (depth=5, learning rate=0.08). | Captures non-linear relationships, multi-feature interactions, and skewed distributions without overfitting. | **Measured Prediction Improvement**: Selected best model (**0.7762 Validation ROC-AUC**, **0.8119 Test ROC-AUC**, **0.8418 Test PR-AUC**). |
| **Stratified Validation Split** | Partitions training data into 80% train ($N=80,000$) and 20% validation ($N=20,000$). | Enables hyperparameter tuning, model comparison, calibration checks, and threshold tuning without touching test data. | **Scientific Validity**: Protects the final test set from selection bias. |
| **Cost-Sensitive Threshold Selection** | Sweeps decision cutoffs $\tau \in [0.05, 0.95]$ against illustrative costs ($FP = \$5$, $FN = \$25$) to pick $\tau^*$. | Aligns the model with business economics; shifting $\tau^*$ from 0.50 to 0.17 catches 98.25% of returns. | **Economic Optimization**: Reduces illustrative operational losses by 85.6%. |
| **TreeSHAP (`ReturnRiskExplainer`)** | Calculates exact additive Shapley feature contributions in log-odds space for each tree path. | Explains *why* a specific transaction was flagged, transforming black-box trees into auditable merchant actions. | **Interpretability & Trust**: Does not alter predictions, but provides human-understandable explanations. |
| **FastAPI REST Service** | Asynchronous Python API serving `/predict`, `/threshold`, `/benchmarks`, and `/simulate-cost`. | Serves real-time inference in $<15\text{ms}$ with pure-Python tree evaluation (`NativeTreeModel`). | **Deployment Usability**: Connects trained models to live e-commerce checkouts. |
| **React Single Page Application (Vite + TailwindCSS)** | Interactive frontend dashboard featuring an order risk simulator, live probability gauge, and report viewer. | Allows merchants and examiners to test order scenarios, visualize SHAP attributions, and audit results interactively. | **Presentation & Usability**: Makes the project understandable and demonstrable in a viva. |

---

## 3. Dataset Protection & Label Verification

### Discovery & Decommissioning of Synthetic Label Rewriting
During initial code inspection of `enhance_dataset.py`, we discovered that earlier exploratory experiments had programmatically rewritten the binary target `isReturned` in `event_table_training.p` and `event_table_testing.p` using a calibrated logistic formula:
$$\text{logit} = 5.2 \times (\text{custRate} - 0.50) + 3.4 \times (\text{prodRate} - 0.40) + \mathcal{N}(0, 0.65)$$
This formula artificially forced model accuracy to reach ~82-89%.

### Rigorous Protection Policy Enacted
1. **Read-Only Preservation**: Every file in `Dataset/` was marked strictly read-only. No file in `Dataset/` was modified or overwritten.
2. **Raw Label Verification**: We verified that `event_table_training_raw.p` and `event_table_testing_raw.p` were the original backups created immediately prior to label enhancement. Their class distributions (54.85% train return rate, 54.92% test return rate) exactly match the original ASOS publication statistics.
3. **Pipeline Reconfiguration**: `config.py` was reconfigured to read `event_table_training_raw.p` and `event_table_testing_raw.p` directly.
4. **Label Rewriting Disabled**: `enhance_dataset.py` was deprecated and disabled in the normal workflow.
5. **Checksum Auditing**: SHA256 hashes of all 8 dataset files were recorded before and after all engineering work, confirming 100% byte-for-byte immutability.

---

## 4. Data Preparation & Leakage Safeguards

### Cleaning & Relational Joins
1. **Header Disambiguation**: The raw customer and product node tables contained duplicated header strings (`customerId_level_return_code_D` and `variantID_level_return_code_D`). These were disambiguated in-memory to `*_D_1` and `*_D_2`.
2. **Snapshot Deduplication**: Node tables contained multiple snapshot dumps per entity. Primary keys (`hash(customerId)` and `hash(variantID)`) were deduplicated keeping the latest record (`keep='last'`), ensuring clean 1-to-1 relational joins without row multiplication.
3. **Cold-Start Handling**: For customers or product variants without prior purchase history, missing attributes were imputed using training set medians (numeric) or constant indicators (categorical) within Scikit-Learn pipelines.

### Data Leakage Safeguards & Inherent Uncertainty
* **Zero Pipeline Leakage**: All transformers (`SimpleImputer`, `StandardScaler`, `OneHotEncoder`) were fit strictly on the training partition ($X_{\text{train}}$) inside an encapsulated `ColumnTransformer`. Validation and test sets were transformed using fitted training statistics only.
* **Documented Observational Uncertainty**: Because the public ASOS dataset event tables lack transaction timestamps, the node snapshots represent lifetime summary statistics. We cannot determine whether an order occurred before or after the snapshot was compiled. In production, this must be resolved using a point-in-time streaming feature store (e.g., Feast) where customer return rates are computed strictly prior to the checkout timestamp.

---

## 5. Model Development & Validation Strategy

To ensure reproducible execution on desktop computers, we established a structured sampling and partitioning protocol using `random_state = 42`:
* **Training Sample**: 100,000 raw training events sampled from `event_table_training_raw.p`.
  - **Train Partition (80%)**: 80,000 orders (fit preprocessor and candidate models).
  - **Internal Validation Partition (20%)**: 20,000 orders (model selection, calibration check, threshold tuning).
* **Held-Out Test Sample**: 50,000 unseen test transactions sampled from `event_table_testing_raw.p` (untouched until final single-pass evaluation).

### Candidate Model Comparison on Validation Partition ($N=20,000$)

| Model Architecture | PR-AUC | ROC-AUC | Accuracy | Precision | Recall | F1-Score | Brier Score | Training Time |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **XGBoost Classifier (Selected)** | **0.8073** | **0.7762** | **70.18%** | **69.73%** | **80.90%** | **0.7490** | **0.1898** | 3.79s |
| **Logistic Regression** | 0.8040 | 0.7742 | 70.12% | 70.02% | 79.85% | 0.7461 | 0.1909 | 0.95s |
| **Baseline (Majority Prior)** | 0.5500 | 0.5000 | 55.00% | 55.00% | 100.00% | 0.7097 | 0.2475 | 0.00s |

**Selection Rationale**: XGBoost achieved the highest PR-AUC (0.8073) and ROC-AUC (0.7762) while exhibiting strong probability calibration (Brier score: 0.1898).

---

## 6. Probability Calibration & Cost-Sensitive Optimization

### Probability Honesty (Calibration Deciles)
A risk manager requires well-calibrated probabilities, meaning that when the model outputs $P(\text{Return}) = 0.70$, approximately 70 out of 100 orders should actually be returned. Across all 10 deciles on validation data, empirical return rates closely track predicted probabilities:
- Predicted 0.049 → Empirical 0.063
- Predicted 0.250 → Empirical 0.263
- Predicted 0.556 → Empirical 0.559
- Predicted 0.750 → Empirical 0.737
- Predicted 0.953 → Empirical 0.948

### Cost Model & Optimal Threshold Selection
We model the total operational cost as:
$$\text{Total Cost} = (FP \times \text{fp\_cost}) + (FN \times \text{fn\_cost})$$
Where:
- $\text{fp\_cost} = \$5.00$ (Illustrative assumption: cost of customer friction / verification on a non-returned order).
- $\text{fn\_cost} = \$25.00$ (Illustrative assumption: cost of reverse logistics, restock, shipping, and depreciation on an unmanaged return).

Because missing a return is assumed to be **5× more expensive** than triggering customer friction, the theoretical Bayes risk cutoff is:
$$\tau^* = \frac{\text{fp\_cost}}{\text{fp\_cost} + \text{fn\_cost}} = \frac{5}{5 + 25} \approx 0.167$$

Sweeping thresholds $\tau \in [0.05, 0.95]$ on our validation partition empirically identified the cost-minimizing threshold at:
$$\tau^* = 0.17$$

> ⚠️ **Scientific Disclaimer**: All dollar values (\$5 FP, \$25 FN) are placeholder assumptions for educational demonstration. Estimated savings are model-based counterfactual calculations; measuring real-world financial impact requires randomized online A/B intervention testing.

---

## 7. Verified Held-Out Test Evaluation ($N = 50,000$)

The selected XGBoost pipeline was evaluated on 50,000 unseen test transactions from `event_table_testing_raw.p`. The test set contained **27,585 actual returns (55.17%)** and **22,415 kept orders (44.83%)**.

### Overall Discrimination Performance
- **ROC-AUC**: **`0.8119`** (strong separation across all operating thresholds)
- **PR-AUC**: **`0.8418`** (robust precision-recall performance on the positive return class)
- **Brier Calibration Score**: **`0.1754`**

### Detailed Operating Point Comparison

| Metric | Unmanaged Baseline | Standard Cutoff ($\tau = 0.50$) | Cost-Optimal Cutoff ($\tau^* = 0.17$) |
| :--- | :---: | :---: | :---: |
| **Operating Threshold ($\tau$)** | None (Accept All) | 0.50 | **0.17** |
| **Accuracy** | 44.83% | **73.23%** | 64.11% |
| **Precision** | 55.17% | **74.40%** | 60.81% |
| **Recall (Interception Rate)** | 0.00% | 78.47% | **98.25%** |
| **F1-Score** | 0.0000 | **0.7638** | 0.7513 |
| **True Negatives (TN)** | 0 | **14,966** | 4,952 |
| **False Positives (FP)** | 0 | 7,449 | 17,463 |
| **False Negatives (FN)** | 27,585 | 5,938 | **483** |
| **True Positives (TP)** | 0 | 21,647 | **27,102** |
| **Flag Rate** | 0.00% | 58.19% | 89.13% |
| **Illustrative Incurred Cost** | **$689,625.00** | **$185,695.00** | **$99,390.00** |
| **Model-Estimated Savings** | $0.00 (Baseline) | **$503,930.00 (73.07%)** | **$590,235.00 (85.59%)** |

### Key Insight for College Viva
- At $\tau = 0.50$, the model delivers balanced precision (74.4%) and recall (78.5%) with higher accuracy (73.23%).
- At $\tau^* = 0.17$, because unmanaged returns are penalized heavily (\$25 vs \$5), the model aggressively prioritizes recall (98.25%), reducing unmanaged returns from 5,938 to just 483 orders and maximizing financial protection under the assumed cost model.

---

## 8. Application Demo & TreeSHAP Explainability

### Unified Full-Stack Architecture
```
[React SPA (Vite + TailwindCSS)]  <--- HTTP/JSON --->  [FastAPI Backend (:8000)]
         │                                                      │
         ├── Order Risk Simulator                               ├── NativeTreeModel (Pure Python/NumPy)
         ├── Visual Probability Gauge                           ├── LightweightInferencePreprocessor
         └── Report & Benchmark Viewer                          └── TreeSHAP Risk Explainer
```

### Local Explainability via TreeSHAP
For every scored order, ReturnLens decomposes the model's raw log-odds prediction into exact feature contributions:
$$\text{margin}(x) = \text{base\_margin} + \sum_{i=1}^{M} \phi_i(x)$$
The top 3 positive contributors pushing risk upward are translated into plain-English descriptions:
1. *"Customer Historical Return Rate (75.0%)"* (+0.412 SHAP log-odds impact)
2. *"Product Category / Variant Return Rate (58.0%)"* (+0.285 SHAP log-odds impact)
3. *"Item Promotional Discount Depth"* (+0.094 SHAP log-odds impact)

### Cold-Start Transparency
For first-time buyers with no previous order history (accounting for 43.5% of test customers), the system transparently reports:
> *"Cold-Start Customer (No prior order history; baseline population return propensity applied)"*  
The model relies gracefully on product category risk, price, and demographic baselines without crashing or hallucinating prior transactions.

---

## 9. Project Limitations & Engineering Roadmap

1. **Lack of Transaction Dates**: The benchmark dataset does not include event timestamps, necessitating stratified static partitioning rather than temporal forward-chaining.
2. **Counterfactual Observational Estimates**: Simulated cost savings assume customer behavior does not change under intervention. A live retail deployment requires randomized controlled A/B testing.
3. **Return Risk vs. Criminal Fraud**: ReturnLens models legitimate customer return propensity. Detecting stolen credit cards or cash-on-delivery delivery refusals requires separate courier attempt logs and payment chargeback signals.
4. **Future Extensions**: Multi-task learning (predicting return probability + return reason code + exchange probability) and direct integration into Shopify checkout webhooks.

---

## 10. How to Run the Project & Reproduce All Results

### 1. Start the FastAPI Backend
```bash
python -m uvicorn api.main:app --host 127.0.0.1 --port 8000
```
Visit API Documentation: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)  
Visit Interactive Web Dashboard: [http://127.0.0.1:8000](http://127.0.0.1:8000)

### 2. Reproduce the Complete Model Evaluation
```bash
# 1. Train and compare models on stratified 80k/20k splits
python src/train.py

# 2. Check calibration and optimize cost threshold on validation data
python src/calibrate_and_optimize.py

# 3. Execute single-pass evaluation on held-out test data
python src/evaluate.py

# 4. Generate master audit and business impact markdown reports
python generate_all_reports.py

# 5. Compile the 8-slide presentation pitch deck
python build_deck.py
```
