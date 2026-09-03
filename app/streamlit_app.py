"""ReturnLens — Streamlit Interactive AI Risk Manager Dashboard
A modern, aesthetic executive and operational dashboard for return-risk prediction,
cost-sensitive decisioning, explainability (SHAP), and model validation analytics.
"""

import json
import os
import sys
from pathlib import Path

# Ensure project root is on sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import streamlit as st

import config
from src.shap_analysis import ReturnRiskExplainer
from src.utils import classify_risk, load_artifact

# Page Configuration
st.set_page_config(
    page_title="ReturnLens — AI Return Risk Manager",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for Premium Styling
st.markdown(
    """
    <style>
    .main-header {
        font-size: 2.2rem;
        font-weight: 800;
        background: linear-gradient(90deg, #1e3a8a, #3b82f6, #06b6d4);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 0.2rem;
    }
    .sub-header {
        font-size: 1.05rem;
        color: #475569;
        margin-bottom: 1.5rem;
    }
    .metric-card {
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        padding: 1.2rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.02);
    }
    .risk-badge-low {
        background-color: #dcfce7;
        color: #166534;
        padding: 0.35rem 0.8rem;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.9rem;
    }
    .risk-badge-medium {
        background-color: #fef9c3;
        color: #854d0e;
        padding: 0.35rem 0.8rem;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.9rem;
    }
    .risk-badge-high {
        background-color: #fee2e2;
        color: #991b1b;
        padding: 0.35rem 0.8rem;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.9rem;
    }
    .risk-badge-very_high {
        background-color: #7f1d1d;
        color: #ffffff;
        padding: 0.35rem 0.8rem;
        border-radius: 9999px;
        font-weight: 700;
        font-size: 0.9rem;
    }
    .disclaimer-box {
        background-color: #f1f5f9;
        border-left: 4px solid #64748b;
        padding: 0.75rem 1rem;
        border-radius: 4px;
        font-size: 0.82rem;
        color: #475569;
        margin-top: 1rem;
    }
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_resource
def load_system_artifacts():
    """Loads model pipeline, explainer, and metadata once."""
    pipeline = load_artifact(config.MODEL_PATH)
    metadata = load_artifact(config.METADATA_PATH)
    threshold_data = (
        load_artifact(config.THRESHOLD_PATH)
        if config.THRESHOLD_PATH.exists()
        else {"optimal_threshold": 0.17}
    )
    explainer = ReturnRiskExplainer(pipeline, metadata["transformed_feature_names"])
    return pipeline, metadata, threshold_data, explainer


pipeline, metadata, threshold_data, explainer = load_system_artifacts()

# Sidebar Navigation
st.sidebar.title("🛡️ ReturnLens Navigation")
app_mode = st.sidebar.radio(
    "Select View:",
    ["Live Order Risk Scoring", "Model & Business Analytics", "Architecture & Methodology"],
)

st.sidebar.markdown("---")
st.sidebar.markdown(
    f"""
    **Active Pipeline**: `XGBoost Classifier`  
    **Decision Threshold**: `{threshold_data.get('optimal_threshold', 0.17):.2f}`  
    **Cost Assumptions**:  
    * FP Cost (Friction): `${config.FP_COST:.2f}`  
    * FN Cost (Return Loss): `${config.FN_COST:.2f}`  
    """
)
st.sidebar.markdown(
    "<div class='disclaimer-box'><b>Disclaimer:</b> Proof-of-concept for Razorpay Buildathon 2026. Uses public benchmark dataset. Financial metrics are placeholder assumptions.</div>",
    unsafe_allow_html=True,
)

# -------------------------------------------------------------
# VIEW 1: LIVE ORDER RISK SCORING
# -------------------------------------------------------------
if app_mode == "Live Order Risk Scoring":
    st.markdown('<div class="main-header">ReturnLens — AI Return Risk Manager — Merchant Loss Prevention</div>', unsafe_allow_html=True)
    st.markdown(
        '<div class="sub-header">Real-time risk scoring, explainable drivers, and cost-optimal intervention guidance.</div>',
        unsafe_allow_html=True,
    )

    col_input, col_output = st.columns([1.1, 1.2], gap="large")

    with col_input:
        st.subheader("📋 Order & Customer Context")

        with st.form("risk_scoring_form"):
            st.markdown("##### 👤 Customer Profile")
            c1, c2 = st.columns(2)
            with c1:
                year_of_birth = st.number_input("Year of Birth", min_value=1920, max_value=2015, value=1994)
                is_male = st.selectbox("Gender", options=[0, 1], format_func=lambda x: "Male" if x == 1 else "Female / Other")
                premier = st.selectbox("VIP / Premier Member", options=[0, 1], format_func=lambda x: "Yes (VIP)" if x == 1 else "No (Standard)")
            with c2:
                shipping_country = st.selectbox(
                    "Shipping Country",
                    options=[f"Country_{chr(65+i)}" for i in range(9)],
                    index=0,
                )
                sales_cust = st.number_input("Customer Lifetime Orders", min_value=1, max_value=500, value=12)
                returns_cust = st.number_input("Customer Lifetime Returns", min_value=0, max_value=500, value=6)
                cust_return_rate = returns_cust / max(1, sales_cust)
                st.caption(f"Calculated Customer Return Rate: **{cust_return_rate*100:.1f}%**")

            st.markdown("##### 👗 Product & Cart Details")
            p1, p2 = st.columns(2)
            with p1:
                product_type = st.selectbox(
                    "Product Category",
                    options=["productType_B", "productType_K", "productType_D", "productType_I", "productType_J", "Tops", "Jeans", "Dresses", "Shoes"],
                    index=0,
                )
                brand_desc = st.selectbox(
                    "Brand",
                    options=[f"Brand_{chr(65+i)}" for i in range(11) if chr(65+i) != "H"] + ["Brand_K"],
                    index=0,
                )
                avg_price = st.number_input("Item Price (£ GBP)", min_value=1.0, max_value=1000.0, value=45.0, step=5.0)
            with p2:
                avg_discount = st.number_input("Discount Applied (£ GBP)", min_value=0.0, max_value=500.0, value=10.0, step=2.0)
                sales_prod = st.number_input("Product Sales Volume", min_value=1, max_value=2000, value=80)
                returns_prod = st.number_input("Product Return Volume", min_value=0, max_value=2000, value=32)
                prod_return_rate = returns_prod / max(1, sales_prod)
                st.caption(f"Calculated Product Return Rate: **{prod_return_rate*100:.1f}%**")

            submit_btn = st.form_submit_button("⚡ Evaluate Transaction Risk", use_container_width=True)

    # Prediction & Explainability Output
    with col_output:
        st.subheader("🎯 Risk Assessment & Action")

        if submit_btn:
            opt_thresh = float(threshold_data.get("threshold", threshold_data.get("optimal_threshold", 0.19)))

            sample_order = {
                "yearOfBirth": year_of_birth,
                "isMale": is_male,
                "shippingCountry": shipping_country,
                "premier": premier,
                "salesPerCustomer": sales_cust,
                "returnsPerCustomer": returns_cust,
                "customerReturnRate": cust_return_rate,
                "productType": product_type,
                "brandDesc": brand_desc,
                "avgGbpPrice": avg_price,
                "avgDiscountValue": avg_discount,
                "salesPerProduct": sales_prod,
                "returnsPerProduct": returns_prod,
                "productReturnRate": prod_return_rate,
                "customerId_level_return_code_D_2": 0.35,
                "variantID_level_return_code_D_2": 0.35,
            }

            df_row = pd.DataFrame([sample_order])
            result = explainer.explain_instance(df_row, top_k=3)
            prob = result["return_probability"]
            risk_tier = result["risk_category"]
            rec = result["recommendation"]
            top_factors = result["top_factors"]
            action_flag = prob >= opt_thresh

            # Map defense-only action
            if risk_tier == "LOW":
                decision_text = "PROCEED_NORMALLY"
            elif risk_tier == "MEDIUM":
                decision_text = "MONITOR_ORDER"
            elif risk_tier == "HIGH":
                decision_text = "ADDITIONAL_VERIFICATION"
            else:
                decision_text = "MANUAL_REVIEW_OR_PREPAID"

            badge_class = f"risk-badge-{risk_tier.lower()}"

            st.markdown(
                f"""
                <div class="metric-card">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span style="font-size: 0.9rem; color: #64748b; font-weight: 600;">PREDICTED RETURN PROBABILITY</span>
                            <div style="font-size: 2.2rem; font-weight: 800; color: #0f172a;">{prob*100:.1f}%</div>
                        </div>
                        <div>
                            <span class="{badge_class}">{risk_tier.replace('_', ' ')} RISK</span>
                        </div>
                    </div>
                    <div style="margin-top: 0.5rem; font-size: 0.95rem;">
                        <b>System Decision:</b> <code>{decision_text}</code>
                    </div>
                    <div style="margin-top: 1rem;">
                        <div style="background-color: #e2e8f0; border-radius: 9999px; height: 10px; width: 100%;">
                            <div style="background-color: {'#22c55e' if prob < 0.3 else '#eab308' if prob < 0.6 else '#ef4444'}; width: {min(100, int(prob*100))}%; height: 10px; border-radius: 9999px;"></div>
                        </div>
                    </div>
                </div>
                """,
                unsafe_allow_html=True,
            )

            st.markdown("#### 🔍 Why is this order risky? (Top Drivers)")
            for idx, factor in enumerate(top_factors, start=1):
                st.markdown(f"**{idx}.** {factor}")

            st.markdown("#### 💡 Recommended Risk Policy Action")
            if action_flag:
                st.warning(f"**Action Required (Probability {prob*100:.1f}% $\ge$ Threshold {opt_thresh*100:.0f}%):**\n\n{rec}")
            else:
                st.success(f"**Friction-Free Processing (Probability {prob*100:.1f}% < Threshold {opt_thresh*100:.0f}%):**\n\n{rec}")

            st.markdown("#### 💰 Financial Exposure (Illustrative Placeholder Assumption)")
            c_exp1, c_exp2 = st.columns(2)
            with c_exp1:
                st.metric("Expected Return Loss (if unflagged)", f"${prob * config.FN_COST:.2f}")
            with c_exp2:
                st.metric("Intervention Friction Cost", f"${config.FP_COST:.2f}" if action_flag else "$0.00")

# -------------------------------------------------------------
# VIEW 2: MODEL & BUSINESS ANALYTICS
# -------------------------------------------------------------
elif app_mode == "Model & Business Analytics":
    st.markdown('<div class="main-header">Model Performance & Business ROI Analytics</div>', unsafe_allow_html=True)

    tab_comp, tab_test, tab_calib, tab_shap, tab_impact = st.tabs(
        ["📊 Validation Benchmarks", "🧪 Held-Out Test Evaluation", "🎯 Probability Calibration", "🧠 Global Feature Importance", "💼 Business Impact & ROI"]
    )

    with tab_comp:
        st.subheader("Model Benchmarking Suite (Validation Partition, N=50,000)")
        if config.COMPARISON_CSV_PATH.exists():
            comp_df = pd.read_csv(config.COMPARISON_CSV_PATH)
            st.dataframe(comp_df.style.highlight_max(subset=["pr_auc", "roc_auc", "f1", "accuracy"], color="#dcfce7"), use_container_width=True)
        if config.COMPARISON_CHART_PATH.exists():
            st.image(str(config.COMPARISON_CHART_PATH), caption="Comparative Validation Performance Across Architectures", use_container_width=True)

    with tab_test:
        st.subheader("Single-Pass Held-Out Test Evaluation (Generalization Standard, N=150,000)")
        final_test_md = config.REPORTS_DIR / "final_test_results.md"
        if final_test_md.exists():
            with open(final_test_md, "r", encoding="utf-8") as f:
                st.markdown(f.read())
        conf_mat_path = config.REPORTS_DIR / "confusion_matrix.png"
        if conf_mat_path.exists():
            st.image(str(conf_mat_path), caption="Held-Out Test Confusion Matrix", use_container_width=False, width=500)

    with tab_calib:
        st.subheader("Probability Calibration & Cost Optimization")
        c_c1, c_c2 = st.columns(2)
        with c_c1:
            if config.CALIBRATION_CURVE_PATH.exists():
                st.image(str(config.CALIBRATION_CURVE_PATH), caption="Validation Calibration Curve (Observed vs Predicted)", use_container_width=True)
        with c_c2:
            if config.COST_CURVE_PATH.exists():
                st.image(str(config.COST_CURVE_PATH), caption="Expected Business Cost vs Decision Threshold", use_container_width=True)

    with tab_shap:
        st.subheader("Global Feature Importance (SHAP)")
        if config.SHAP_SUMMARY_PATH.exists():
            st.image(str(config.SHAP_SUMMARY_PATH), caption="Top 15 Global Return Risk Drivers by Mean |SHAP|", use_container_width=True)

    with tab_impact:
        st.subheader("Held-Out Test Set Business ROI Assessment")
        impact_report_path = config.REPORTS_DIR / "business_impact.md"
        if impact_report_path.exists():
            with open(impact_report_path, "r", encoding="utf-8") as f:
                st.markdown(f.read())

# -------------------------------------------------------------
# VIEW 3: ARCHITECTURE & METHODOLOGY
# -------------------------------------------------------------
elif app_mode == "Architecture & Methodology":
    st.markdown('<div class="main-header">ReturnLens — System Architecture & Methodology</div>', unsafe_allow_html=True)
    st.markdown(
        """
        ```mermaid
        graph TD
            A[Raw Data: 2.83M Events + Node Tables] --> B[Stage 1: Dataset Audit & Schema Inspection]
            B --> C[Stage 2: Rigorous Leakage Audit & Duplicate Key Cleansing]
            C --> D[Stage 3: Scikit-Learn ColumnTransformer Pipeline]
            D --> E[Stage 4: Multi-Model Benchmark - LogReg, RF, HGB, LGBM, XGBoost, LinearReg]
            E --> F[Stage 5: Single Pass Held-Out Test Evaluation]
            F --> G[Stage 6: Probability Calibration & Cost-Optimal Threshold Sweep]
            G --> H[Stage 7: TreeSHAP Global & Local Factor Explainability]
            H --> I[Stage 8: Production FastAPI REST Microservice]
            H --> J[Stage 9: Streamlit Interactive Risk Management Dashboard]
        ```
        
        ### Key Methodological Safeguards
        1. **Strict Zero-Leakage Transformation**: All imputers, standard scalers, and encoders are fit strictly on $X_{\text{train}}$ inside Scikit-Learn `ColumnTransformer`.
        2. **Single Held-Out Test Pass**: The official test set (`event_table_testing.p`) was evaluated exactly once after all tuning and selection were frozen.
        3. **Cost-Sensitive Threshold Tuning**: Decision threshold ($0.19$) was optimized on validation data to minimize expected financial loss ($FP \times \$5 + FN \times \$25$).
        4. **Actionable Explainability**: Every prediction is paired with its top SHAP driver attributions to provide merchant transparency.
        """
    )
