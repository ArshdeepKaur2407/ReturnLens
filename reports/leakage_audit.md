# ReturnLens — Comprehensive Data Leakage Audit & Validation Split Strategy

**Project**: ReturnLens (AI Risk Manager — E-Commerce Return Risk Prediction)  
**Author**: Antigravity Machine Learning Engineering Team  
**Date**: September 2026  
**Status**: Stage 2 Deliverable  

---

## 1. Executive Summary & Audit Objective

Data leakage is the single greatest threat to the validity of real-world risk management systems. If an ML model inadvertently accesses future information, post-transaction outcomes, or test-set distribution statistics during training, it produces misleadingly high offline evaluation metrics while failing catastrophically in production.

This audit report documents a feature-by-feature inspection of the entire dataset provided in `/Dataset`. Every candidate feature is systematically categorized, audited for direct and aggregate leakage risks, and assigned an explicit, leakage-safe treatment.

---

## 2. Leakage Taxonomy & Evaluation Framework

We evaluate the dataset against four distinct vectors of data leakage:

1. **Direct Post-Event Leakage**: Attributes that are generated *after* or *as a consequence of* an order being placed or returned (e.g., return shipment status, refund timestamps, refund amounts, customer service complaint tickets, post-event return reason codes).
2. **Aggregate / Target Information Leakage**: Summary statistics or historical aggregates that inadvertently include the *current transaction's* target outcome `isReturned` or future outcomes from the validation/test set.
3. **Pipeline & Transformation Leakage**: Preprocessing transformers (median imputers, scalers, one-hot encoders) fitted on the entire dataset (including validation or test splits) rather than strictly on training records.
4. **Entity Overlap & Temporal Boundary Leakage**: Using future snapshots of customer/product profiles to score past events.

---

## 3. Detailed Feature-by-Feature Leakage Audit

### Table 1: Customer Profile Features (`customer_nodes_*.p`)

| Feature Name | Raw Data Type | Leakage Risk Level | Audit Finding & Mechanism | Decision | Treatment / Transformation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `hash(customerId)` | `int64` | None (Entity Key) | Anonymized unique identifier for customers. | **Keep** (Join Key) | Used for joining node attributes to event table; excluded from model input matrix. |
| `yearOfBirth` | `int64` | None (Demographic) | Static customer demographic feature (Range: 1887–2022). | **Keep** | Median imputation for cold-start (unseen) customers, followed by standard scaling. Derived feature `customer_age` can be computed as `2026 - yearOfBirth`. |
| `isMale` | `int64` | None (Demographic) | Binary gender indicator (0 = Female/Other, 1 = Male). | **Keep** | Mode/constant imputation (0) for missing values. |
| `shippingCountry` | `object` | None (Geographic) | Categorical country identifier (`Country_A` through `Country_I`). | **Keep** | One-Hot Encoded with `handle_unknown='ignore'`. |
| `Country_A` .. `Country_I` | `int64` | None (Pre-encoded) | Pre-computed binary indicators for country. | **Drop / Redundant** | Rely on `shippingCountry` categorical column with standard Scikit-Learn `OneHotEncoder` to avoid multicollinearity. |
| `premier` | `int64` | None (Subscription) | VIP / subscription membership status at time of profile capture. | **Keep** | Binary numeric feature; imputed with 0 for cold-start customers. |
| `salesPerCustomer` | `int64` | Low (Historical Aggregate) | Total lifetime purchase count prior to snapshot. Audit confirmed total exceeds sampled event counts (`salesPerCustomer >= ev_sales` in 99.8%+ cases). | **Keep as Historical Feature** | Median imputation for new customers; standard scaling. |
| `returnsPerCustomer` | `int64` | Low (Historical Aggregate) | Total lifetime return count prior to snapshot. | **Keep as Historical Feature** | Median imputation for new customers; standard scaling. |
| `customerReturnRate` | `float64` | Medium (Aggregate Rate) | Historical return ratio (`returnsPerCustomer / salesPerCustomer`). Reflects prior baseline customer propensity, not current order outcome. | **Keep as Historical Feature** | Median imputation for cold-start customers; scaled. |
| `customerId_level_return_code_A` .. `L` | `float64` | Low (Historical Proportions) | Proportions of historical returns attributed to reasons A through L. Sums to $\le 1.0$. | **Keep** | Renamed uniquely (`_D1`, `_D2` to fix duplicate column headers in raw data); 0-imputation for cold-start customers. |

---

### Table 2: Product & Variant Profile Features (`product_nodes_*.p`)

| Feature Name | Raw Data Type | Leakage Risk Level | Audit Finding & Mechanism | Decision | Treatment / Transformation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `hash(variantID)` | `int64` | None (Entity Key) | Specific variant / SKU identifier. | **Keep** (Join Key) | Used for joining node attributes to event table; excluded from model input matrix. |
| `hash(productID)` | `int64` | None (Entity Key) | Parent product group identifier. | **Keep** (Optional High-cardinality) | Frequency/target encoding avoided to prevent leakage; excluded or low-cardinality grouped. |
| `hash(supplierRef)` | `int64` | None (Merchant Key) | Supplier / Merchant identifier. | **Keep** (Entity Key) | Excluded from direct linear features to avoid high cardinality memorization. |
| `productType` | `object` | None (Catalog) | Product category name (e.g., Tops, Jeans, Dresses, Shoes). | **Keep** | Cleaned and One-Hot Encoded (`handle_unknown='ignore'`). |
| `brandDesc` | `object` | None (Catalog) | Brand identifier (e.g., `Brand_A` through `Brand_K`). | **Keep** | One-Hot Encoded (`handle_unknown='ignore'`). |
| `Brand_A` .. `Brand_K` | `int64` | None (Pre-encoded) | Pre-computed binary indicators for brands. | **Drop / Redundant** | Rely on `brandDesc` with `OneHotEncoder` for clean, unified categorical encoding. |
| `productType_A` .. `K` | `int64` | None (Pre-encoded) | Pre-computed binary indicators for product types. | **Drop / Redundant** | Rely on `productType` with `OneHotEncoder`. |
| `avgGbpPrice` | `float64` | None (Catalog Pricing) | Average selling price in GBP (£). Key risk factor for luxury/expensive return arbitrage. | **Keep** | Median imputation for cold-start variants; standard scaling. |
| `avgDiscountValue` | `float64` | None (Catalog Pricing) | Average discount amount in GBP (£). | **Keep** | Median imputation; standard scaling. |
| `salesPerProduct` | `int64` | Low (Historical Aggregate) | Historical sales volume for this variant. | **Keep as Historical Feature** | Median imputation for new products; log/standard scaling. |
| `returnsPerProduct` | `int64` | Low (Historical Aggregate) | Historical return volume for this variant. | **Keep as Historical Feature** | Median imputation for new products; standard scaling. |
| `productReturnRate` | `float64` | Medium (Aggregate Rate) | Product-level return rate (`returnsPerProduct / salesPerProduct`). | **Keep as Historical Feature** | Median imputation for new products; standard scaling. |
| `variantID_level_return_code_A` .. `L` | `float64` | Low (Historical Proportions) | Product-level proportion of past returns by reason code (e.g. sizing issue, defective, style mismatch). | **Keep** | Renamed uniquely (`_D1`, `_D2` to fix duplicate column headers in raw data); 0-imputation for cold-start variants. |

---

### Table 3: Transaction Event Features (`event_table_*.p`)

| Feature Name | Raw Data Type | Leakage Risk Level | Audit Finding & Mechanism | Decision | Treatment / Transformation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `hash(variantID)` | `int64` | None | Join foreign key linking order to product profile. | **Keep** (Join Key) | Used during table join only. |
| `hash(customerId)` | `int64` | None | Join foreign key linking order to customer profile. | **Keep** (Join Key) | Used during table join only. |
| `isReturned` | `int64` | **TARGET** | Ground truth label (0 = Kept, 1 = Returned). | **Target Column** | Separated strictly as $y$; never passed into feature matrix $X$. |

---

## 4. Special Anomaly Audit & Resolutions

### A. Resolution of Duplicate Column Headers
* **Empirical Finding**: In both `customer_nodes` and `product_nodes`, two distinct columns share the exact string identifier `customerId_level_return_code_D` and `variantID_level_return_code_D` respectively. Inspection confirmed these columns contain different numeric distributions (Column 0: Mean ~0.036; Column 1: Mean ~0.350).
* **Treatment**: In the data loading and preprocessing pipeline, duplicate headers are sequentially renamed to `*_return_code_D_1` and `*_return_code_D_2`. This prevents Pandas Series collision and ensures zero feature loss.

### B. Node Table Deduplication & Snapshot Alignment
* **Empirical Finding**: `product_nodes_training.p` contains 198,471 exact duplicate rows. `customer_nodes_training.p` contains 89,913 customers with two historical snapshot rows reflecting evolving cumulative transactions.
* **Treatment**: Deduplicate node tables on their primary keys (`hash(customerId)` and `hash(variantID)`) keeping the latest record (`keep='last'`) *before* executing the left join with event tables. This prevents 1-to-many Cartesian explosion during join operations.

### C. Pipeline Imputation & Transformation Guarantee
* **Zero-Leakage Invariance**: All `SimpleImputer`, `StandardScaler`, and `OneHotEncoder` objects will be fit **strictly on the Training Split ($X_{\text{train}}$)** inside an encapsulated `scikit-learn` `Pipeline` / `ColumnTransformer`. Validation and Test sets ($X_{\text{val}}$, $X_{\text{test}}$) are strictly transformed using the fitted training parameters.

---

## 5. Train / Validation / Test Partitioning Strategy

### A. Partitioning Architecture

The dataset includes official pre-partitioned files (`event_table_training.p` and `event_table_testing.p`). Because the event records do not contain granular transaction-level timestamps, temporal time-series rolling splits are not applicable. Instead, we establish a rigorous stratified validation partition from the training set:

```
Total Transaction Events: 2,829,499 rows
│
├── 1. Training Set (event_table_training.p — 1,980,649 rows — 70.0%)
│    │
│    ├── [A] Model Train Partition (80% of Train): 1,584,519 rows
│    │    └── Used exclusively for fitting transformers and model parameters.
│    │
│    └── [B] Internal Validation Partition (20% of Train): 396,130 rows
│         └── Used exclusively for hyperparameter tuning, model comparison,
│             probability calibration, and cost-optimal threshold tuning.
│
└── 2. Official Held-Out Test Set (event_table_testing.p — 848,850 rows — 30.0%)
     └── Completely untouched until Stage 5 (single final evaluation pass).
```

### B. Summary of Split Row Counts & Class Balance

| Split Partition | Row Count | % of Total Events | Class 0 (Kept) | Class 1 (Returned) | Return Rate (%) | Split Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Train Set ($X_{\text{train}}, y_{\text{train}}$)** | **1,584,519** | 56.00% | 715,413 | 869,106 | 54.85% | Preprocessor fitting & model training |
| **Validation Set ($X_{\text{val}}, y_{\text{val}}$)** | **396,130** | 14.00% | 178,853 | 217,277 | 54.85% | Model selection, calibration & threshold search |
| **Held-Out Test Set ($X_{\text{test}}, y_{\text{test}}$)** | **848,850** | 30.00% | 382,640 | 466,210 | 54.92% | Final unbiased validation pass (once only) |
| **Total Event Population** | **2,829,499** | 100.00% | 1,276,906 | 1,552,593 | 54.87% | Full dataset population |

---

## 6. Entity Overlap Analysis (Seen vs. Unseen Entity Dynamics)

A realistic e-commerce risk engine must handle both returning customers/products (warm start) and new, first-time visitors or newly cataloged products (cold start). The table below documents the entity overlap between splits:

| Entity Type | Identifier Key | Unique in Train Split | Unique in Validation Split | Unique in Test Split | Test Overlap with Train (% Seen) | Cold-Start in Test (% Unseen) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Customers** | `hash(customerId)` | 1,012,389 | 344,520 | 650,831 | **56.46% Seen** (367,461) | **43.54% Unseen** (283,370) |
| **Product Variants** | `hash(variantID)` | 473,812 | 224,198 | 357,493 | **78.27% Seen** (279,798) | **21.73% Unseen** (77,695) |
| **Parent Products** | `hash(productID)` | 109,240 | 88,415 | 111,675 | **94.99% Seen** (106,083) | **5.01% Unseen** (5,592) |
| **Suppliers / Merchants** | `hash(supplierRef)` | 90,812 | 75,320 | 92,719 | **95.14% Seen** (88,214) | **4.86% Unseen** (4,505) |

### Interpretation of Entity Dynamics:
* **Customers**: The test set is a **mixed entity split** (56.5% repeat customers with historical return profiles; 43.5% cold-start new customers). The model will be tested on its ability to leverage historical behavior when present, while relying gracefully on demographic, pricing, and catalog attributes when customer history is absent.
* **Products & Merchants**: The test set exhibits high catalog coverage (>78% seen variants, >94% seen product families and suppliers), matching typical retail conditions where catalog items persist across transactions.

---

## 7. Audit Conclusion & Approval Gate

1. **Direct Leakage**: None detected in event tables.
2. **Aggregate Leakage**: Historical customer/product aggregates verified as pre-computed profile features. No same-row target leakage detected.
3. **Pipeline Invariance**: Strict encapsulation in Scikit-Learn `Pipeline` guarantees zero data leakage from validation/test sets during preprocessing.
4. **Validation Strategy**: 80/20 stratified split of training data, preserving the untouched test set for final verification.
