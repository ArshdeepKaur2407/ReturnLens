"""ReturnLens — Central Configuration Module
Centralizes dataset paths, model artifacts, random seeds, cost parameters,
risk thresholds, and API configurations.
"""

import os
from pathlib import Path

# Base Directories
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "Dataset"
MODELS_DIR = BASE_DIR / "models"
REPORTS_DIR = BASE_DIR / "reports"
APP_DIR = BASE_DIR / "app"
API_DIR = BASE_DIR / "api"

# Ensure runtime directories exist
MODELS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_DIR.mkdir(parents=True, exist_ok=True)

# Random Seed for Reproducibility
RANDOM_STATE = 42

# Dataset File Paths
CUSTOMER_NODES_TRAIN = DATA_DIR / "customer_nodes_training.p"
CUSTOMER_NODES_TEST = DATA_DIR / "customer_nodes_testing.p"
PRODUCT_NODES_TRAIN = DATA_DIR / "product_nodes_training.p"
PRODUCT_NODES_TEST = DATA_DIR / "product_nodes_testing.p"
EVENT_TABLE_TRAIN = DATA_DIR / "event_table_training.p"
EVENT_TABLE_TEST = DATA_DIR / "event_table_testing.p"

# Artifact File Paths
MODEL_PATH = MODELS_DIR / "best_model.joblib"
METADATA_PATH = MODELS_DIR / "feature_metadata.json"
THRESHOLD_PATH = MODELS_DIR / "threshold.json"
COMPARISON_CSV_PATH = REPORTS_DIR / "model_benchmarks.csv"
COMPARISON_CHART_PATH = REPORTS_DIR / "model_comparison.png"
CALIBRATION_CURVE_PATH = REPORTS_DIR / "calibration_curve.png"
COST_CURVE_PATH = REPORTS_DIR / "cost_curve.png"
SHAP_SUMMARY_PATH = REPORTS_DIR / "shap_summary.png"

# Target & Key Definitions
TARGET_COL = "isReturned"
CUSTOMER_KEY = "hash(customerId)"
VARIANT_KEY = "hash(variantID)"

# Cost-Sensitive Decision Optimization Parameters
# NOTE: These monetary figures are PLACEHOLDER BUSINESS ASSUMPTIONS for prototype demonstration,
# not reflective of proprietary Razorpay operational costs or merchant policies.
FP_COST = 5.0   # False Positive Cost: friction / verification / retention impact on non-returned order
FN_COST = 25.0  # False Negative Cost: unmanaged return shipping, restock, depreciation loss per returned item

# Default Risk Categories
RISK_CATEGORIES = {
    "LOW": (0.00, 0.30, "Low risk. Proceed with standard friction-free checkout and processing."),
    "MEDIUM": (0.30, 0.60, "Medium risk. Monitor order and apply standard post-order verification."),
    "HIGH": (0.60, 0.80, "High risk. Apply targeted friction (e.g. sizing confirmation, return policy prompt)."),
    "VERY_HIGH": (0.80, 1.00, "Very high risk. Manual review or require prepaid verification before fulfillment.")
}

# API Configuration
API_HOST = "127.0.0.1"
API_PORT = 8000
