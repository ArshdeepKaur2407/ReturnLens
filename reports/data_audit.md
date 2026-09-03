# ReturnLens — Comprehensive Dataset Audit Report

> **Dataset Scope**: Razorpay Buildathon 2026 — Track 02 (AI Risk Manager: E-Commerce Return Loss Prevention)  
> **Source Directory**: `Dataset/`  
> **Total Transaction Events**: 2,829,499 (1,980,649 Train, 848,850 Held-Out Test)  
> **Total Node Entity Snapshots**: 2,425,638 records  

---

## 1. File Structure & Dimensions

| File Name | Row Count | Column Count | Primary Key / Foreign Key | Entity Type | Missing Value Rate |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `event_table_training.p` | **1,980,649** | 3 | `hash(variantID)`, `hash(customerId)` | Transaction Events | 0.00% |
| `event_table_testing.p` | **848,850** | 3 | `hash(variantID)`, `hash(customerId)` | Transaction Events | 0.00% |
| `customer_nodes_training.p` | **1,121,819** | 30 | `hash(customerId)` | Customer Profile Snapshots | 2.14% |
| `customer_nodes_testing.p` | **480,780** | 30 | `hash(customerId)` | Customer Profile Snapshots | 2.15% |
| `product_nodes_training.p` | **576,127** | 44 | `hash(variantID)` | Product Catalog Snapshots | 0.82% |
| `product_nodes_testing.p` | **246,912** | 44 | `hash(variantID)` | Product Catalog Snapshots | 0.81% |

---

## 2. Target Variable Analysis (`isReturned`)

* **Binary Encoding**: `0` = Kept / Fulfilled, `1` = Returned.
* **Class Balance (Training)**: Kept = 838,370 (42.33%), Returned = 1,142,279 (57.67%).
* **Class Balance (Held-Out Test)**: Kept = 359,457 (42.35%), Returned = 489,393 (57.65%).
* **Target Integrity**: Target column is strictly present in event tables; node tables contain historical lifetime aggregates only.

---

## 3. Entity Resolution & Schema Anomalies Identified

1. **Duplicate Header Resolution**:
   - Customer and Product node tables contained duplicated headers `customerId_level_return_code_D` and `variantID_level_return_code_D`.
   - **Resolution**: Renamed disambiguated columns to `*_D_1` and `*_D_2` prior to dataframe construction.

2. **Snapshot Deduplication**:
   - Node tables represent snapshot dumps with multiple timestamps per entity ID.
   - **Resolution**: Deduplicated node snapshots on primary hash keys (`hash(customerId)`, `hash(variantID)`), reducing customer records to 1,031,906 unique training customers and product variants to 377,603 unique variants.

3. **Cold-Start Customers**:
   - Transactions where customer profiles have no prior history are handled gracefully through Scikit-Learn `ColumnTransformer` median imputation without data leakage.

---

## 4. Feature Taxonomy & Types

* **Customer Demographics & History (30 cols)**: `yearOfBirth`, `isMale`, `shippingCountry` (Categorical, 10 unique countries), `premier` (VIP loyalty flag), `salesPerCustomer`, `returnsPerCustomer`, `customerReturnRate`, and return code distributions `customerId_level_return_code_A` through `L`.
* **Product Catalog & Sizing Risk (44 cols)**: `productType` (Categorical, 25 types), `brandDesc` (Categorical, 150+ brands), `avgGbpPrice`, `avgDiscountValue`, `salesPerProduct`, `returnsPerProduct`, `productReturnRate`, and variant-level return codes `variantID_level_return_code_A` through `L`.
* **Engineered Signal Features**: `customer_age` (2026 - `yearOfBirth`), `discount_ratio` (`avgDiscountValue` / `avgGbpPrice`), and `net_price` (`avgGbpPrice` - `avgDiscountValue`).
