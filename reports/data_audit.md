# ReturnLens — Comprehensive Dataset Audit Report

> **Dataset Scope**: ASOS E-Commerce Returns Dataset (Predicting Returns in Fashion E-Commerce)  
> **Source Directory**: `Dataset/` (Read-Only Verified)  
> **Total Raw Transaction Events**: 2,829,499 (1,980,649 Train, 848,850 Held-Out Test)  
> **Total Node Entity Snapshots**: 2,425,638 records  
> **Dataset Protection**: Verified unmanipulated original labels from `event_table_*_raw.p`.

---

## 1. File Structure & Dimensions

| File Name | Row Count | Column Count | Primary / Foreign Key | Entity Type | Missing Value Rate |
| :--- | :---: | :---: | :--- | :--- | :---: |
| `event_table_training_raw.p` | **1,980,649** | 3 | `hash(variantID)`, `hash(customerId)` | Transaction Events (Verified Raw) | 0.00% |
| `event_table_testing_raw.p` | **848,850** | 3 | `hash(variantID)`, `hash(customerId)` | Transaction Events (Verified Raw) | 0.00% |
| `customer_nodes_training.p` | **1,121,819** | 30 | `hash(customerId)` | Customer Profile Snapshots | 2.14% |
| `customer_nodes_testing.p` | **480,780** | 30 | `hash(customerId)` | Customer Profile Snapshots | 2.15% |
| `product_nodes_training.p` | **576,127** | 44 | `hash(variantID)` | Product Catalog Snapshots | 0.82% |
| `product_nodes_testing.p` | **246,912** | 44 | `hash(variantID)` | Product Catalog Snapshots | 0.81% |

---

## 2. Target Variable Analysis (`isReturned`)

* **Binary Encoding**: `0` = Kept / Fulfilled, `1` = Returned.
* **Class Balance (Training Raw)**: Kept = 894,266 (45.15%), Returned = 1,086,383 (54.85%).
* **Class Balance (Held-Out Test Raw)**: Kept = 382,640 (45.08%), Returned = 466,210 (54.92%).
* **Target Integrity & Verification**:
  - The dataset target variable represents empirical e-commerce customer return behavior.
  - Earlier iterations used generated synthetic labels via `enhance_dataset.py` to artificially target ~82% accuracy.
  - The current project strictly consumes verified original raw labels without overwriting any dataset files.

---

## 3. Data Cleaning & Entity Resolution

1. **Duplicate Header Resolution**:
   - Customer and Product node tables contained duplicated headers `customerId_level_return_code_D` and `variantID_level_return_code_D`.
   - Disambiguated in memory to `*_D_1` and `*_D_2` during dataframe construction.

2. **Snapshot Deduplication**:
   - Node tables represent periodic snapshots with multiple rows per entity ID.
   - Deduplicated on primary keys (`hash(customerId)`, `hash(variantID)`), keeping the latest snapshot (`keep='last'`).

3. **Cold-Start Handling**:
   - Transactions where customer profiles have no prior history are handled via Scikit-Learn `SimpleImputer` (median imputation for numeric values, constant for categoricals) fit strictly on training events.

---

## 4. Evaluated Sample Sizes (Practical Desktop Configuration)

* **Random Seed**: `42`
* **Training Partition**: `80,000` orders
* **Validation Partition**: `20,000` orders (for model comparison & threshold selection)
* **Held-Out Test Partition**: `50,000` orders (single-pass evaluation)
