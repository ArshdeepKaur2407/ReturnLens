"""ReturnLens — Model Explainability and SHAP Analysis Module
Computes global TreeSHAP feature importance, generates summary plots, and computes
per-prediction local factor attributions for individual transactions.
"""
from __future__ import annotations
import json
from typing import Any, Dict, List, Optional, Tuple, Union

try:
    import matplotlib.pyplot as plt
except ImportError:
    plt = None
import numpy as np
try:
    import pandas as pd
except ImportError:
    pd = None

try:
    import xgboost as xgb
except ImportError:
    xgb = None

try:
    from sklearn.pipeline import Pipeline
except ImportError:
    Pipeline = None

try:
    from src.data_loading import load_and_join_data
except ImportError:
    load_and_join_data = None

from src.native_model import NativeTreeModel
from src.utils import classify_risk, get_logger, load_artifact, save_artifact, timer

logger = get_logger("ReturnLens.SHAP")


class ReturnRiskExplainer:
    """Provides fast risk factor attributions and predictions supporting
    NativeTreeModel, native XGBoost Boosters, and Scikit-Learn pipelines.
    """

    def __init__(
        self,
        model: Any,
        feature_names: List[str],
        preprocessor: Optional[Any] = None,
    ):
        self.feature_names = feature_names
        self.preprocessor = preprocessor
        self.native_model = None
        self.booster = None
        self.pipeline = None
        self.classifier = None
        self.is_native = False
        self.is_xgboost = False

        if isinstance(model, NativeTreeModel):
            self.native_model = model
            self.is_native = True
            logger.info("Initialized pure-Python NativeTreeModel inference engine.")
        elif xgb is not None and isinstance(model, xgb.Booster):
            self.booster = model
            self.is_xgboost = True
            logger.info("Initialized native XGBoost Booster TreeSHAP engine.")
        elif hasattr(model, "named_steps"):
            self.pipeline = model
            if self.preprocessor is None:
                self.preprocessor = model.named_steps["preprocessor"]
            self.classifier = model.named_steps["classifier"]
            if hasattr(self.classifier, "get_booster") and xgb is not None:
                self.booster = self.classifier.get_booster()
                self.is_xgboost = True
                logger.info("Initialized native XGBoost TreeSHAP engine.")
            else:
                self.booster = None
                self.is_xgboost = False
        else:
            self.native_model = model
            self.is_native = True

    def compute_shap_values(self, X_trans: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """Computes feature values and bias term for a transformed matrix."""
        if self.is_native and self.native_model is not None:
            x_vec = X_trans[0] if len(X_trans.shape) > 1 else X_trans
            _, contribs = self.native_model.predict_margin_and_contribs(x_vec)
            return contribs.reshape(1, -1), np.array([self.native_model.base_margin])
        elif self.is_xgboost and self.booster is not None and xgb is not None:
            dmat = xgb.DMatrix(X_trans)
            contribs = self.booster.predict(dmat, pred_contribs=True)
            shap_vals = contribs[:, :-1]
            bias = contribs[:, -1]
            return shap_vals, bias
        else:
            import shap
            explainer = shap.TreeExplainer(self.classifier)
            shap_vals = explainer.shap_values(X_trans)
            if isinstance(shap_vals, list):
                shap_vals = shap_vals[1] if len(shap_vals) > 1 else shap_vals[0]
            return shap_vals, np.zeros(len(X_trans))

    def explain_instance(
        self,
        raw_row: Any,
        top_k: int = 3,
    ) -> Dict[str, Any]:
        """Explains a single transaction input (dict or DataFrame)."""
        if hasattr(self.preprocessor, "transform_dict") and isinstance(raw_row, dict):
            X_trans = self.preprocessor.transform_dict(raw_row)
        elif hasattr(self.preprocessor, "transform"):
            X_trans = self.preprocessor.transform(raw_row)
        else:
            X_trans = np.asarray(raw_row, dtype=np.float64)

        if self.is_native and self.native_model is not None:
            x_vec = X_trans[0] if len(X_trans.shape) > 1 else X_trans
            margin, contribs = self.native_model.predict_margin_and_contribs(x_vec)
            proba = float(1.0 / (1.0 + np.exp(-margin)))
            sv = contribs
        elif self.booster is not None and xgb is not None:
            dmat = xgb.DMatrix(X_trans.astype(np.float32))
            proba = float(self.booster.predict(dmat)[0])
            shap_vals, _ = self.compute_shap_values(X_trans)
            sv = shap_vals[0]
        else:
            proba = float(self.pipeline.predict_proba(raw_row)[0, 1])
            shap_vals, _ = self.compute_shap_values(X_trans)
            sv = shap_vals[0]

        risk_category, recommendation = classify_risk(proba)

        # Top positive contributing features (pushing risk UP)
        top_pos_indices = np.argsort(sv)[::-1]
        top_factors = []
        for idx in top_pos_indices:
            feat_name = self.feature_names[idx]
            impact = sv[idx]
            if impact > 0.001:
                clean_name = feat_name.replace("num__", "").replace("cat__", "")
                readable_name = self._make_human_readable(clean_name, raw_row)
                top_factors.append(f"{readable_name} (+{impact:.3f} SHAP log-odds impact)")
            if len(top_factors) >= top_k:
                break

        # Fallback if no positive factors
        if not top_factors:
            top_factors = ["Baseline risk profile", "Product category risk", "Customer return history"]

        return {
            "return_probability": round(proba, 4),
            "risk_category": risk_category,
            "recommendation": recommendation,
            "top_factors": top_factors,
        }

    def _get_val(self, raw_row: Any, col: str, default: Any = None) -> Any:
        if isinstance(raw_row, dict):
            val = raw_row.get(col, default)
            return default if val is None else val
        elif hasattr(raw_row, "get"):
            series = raw_row.get(col)
            if series is not None:
                if hasattr(series, "values") and len(series.values) > 0:
                    val = series.values[0]
                    return default if (pd is not None and pd.isna(val)) else val
                elif isinstance(series, (list, tuple)) and len(series) > 0:
                    return series[0]
        return default

    def _make_human_readable(self, feat_name: str, raw_row: Any) -> str:
        """Translates internal feature names into plain-English risk driver descriptions."""
        if "customerReturnRate" in feat_name:
            val = self._get_val(raw_row, "customerReturnRate", None)
            if val is None:
                return "Cold-Start Customer (Baseline Population Return Propensity)"
            return f"High Customer Historical Return Rate ({float(val)*100:.1f}%)"
        elif "productReturnRate" in feat_name:
            val = self._get_val(raw_row, "productReturnRate", None)
            if val is None:
                return "Cold-Start Product Category (Baseline Return Propensity)"
            return f"Elevated Product Category Return Rate ({float(val)*100:.1f}%)"
        elif "returnsPerCustomer" in feat_name:
            val = self._get_val(raw_row, "returnsPerCustomer", 0)
            return f"Frequent Past Returns by Customer ({int(val)} total returns)"
        elif "avgGbpPrice" in feat_name:
            val = self._get_val(raw_row, "avgGbpPrice", 25.0)
            return f"High Item Value (£{float(val):.2f})"
        elif "avgDiscountValue" in feat_name or "discount_ratio" in feat_name:
            return "Heavy Discount Arbitrage Risk"
        elif "customer_age" in feat_name or "yearOfBirth" in feat_name:
            return "Customer Demographic Age Band"
        elif "return_code" in feat_name:
            return "Specific Historical Return Reason Pattern"
        elif "premier" in feat_name:
            return "VIP / Subscription Member Dynamics"
        elif "productType" in feat_name:
            clean_type = feat_name.replace("productType_", "").replace("cat__", "")
            return f"High-Return Product Category ({clean_type})"
        elif "shippingCountry" in feat_name:
            clean_country = feat_name.replace("shippingCountry_", "").replace("cat__", "")
            return f"Shipping Country Risk Profile ({clean_country})"
        elif "brandDesc" in feat_name:
            clean_brand = feat_name.replace("brandDesc_", "").replace("cat__", "")
            return f"Brand Return Tendency ({clean_brand})"
        return feat_name.replace("_", " ").title()


def run_shap_analysis(
    sample_size: int = 10000,
) -> Tuple[pd.DataFrame, Dict[str, Any]]:
    """Runs global SHAP analysis and worked individual example."""
    logger.info("Loading persisted pipeline and feature metadata...")
    pipeline: Pipeline = load_artifact(config.MODEL_PATH)
    metadata: Dict[str, Any] = load_artifact(config.METADATA_PATH)
    feature_names = metadata["transformed_feature_names"]

    explainer_obj = ReturnRiskExplainer(pipeline, feature_names)

    # 1. Global Explanation on Sample
    logger.info(f"Loading sample data for global SHAP summary (sample_size={sample_size})...")
    X_sample, _ = load_and_join_data(split="test", sample_size=sample_size)
    X_trans = pipeline.named_steps["preprocessor"].transform(X_sample)

    with timer("Computing Global SHAP Values"):
        shap_vals, _ = explainer_obj.compute_shap_values(X_trans)

    # Feature Importance Ranking DataFrame
    mean_abs_shap = np.mean(np.abs(shap_vals), axis=0)
    importance_df = pd.DataFrame(
        {
            "feature": feature_names,
            "mean_abs_shap": mean_abs_shap,
        }
    ).sort_values(by="mean_abs_shap", ascending=False)

    logger.info(f"\nTop 10 Global Risk Drivers by Mean |SHAP|:\n{importance_df.head(10).to_string(index=False)}")

    # Plot and Save SHAP Summary Bar Chart
    plt.figure(figsize=(10, 8))
    top_features = importance_df.head(15).sort_values(by="mean_abs_shap", ascending=True)
    plt.barh(top_features["feature"], top_features["mean_abs_shap"], color="#3b82f6")
    plt.xlabel("Mean |SHAP Value| (Impact on Model Log-Odds)", fontsize=11)
    plt.title("ReturnLens — Top 15 Global Return Risk Drivers (TreeSHAP)", fontsize=12, fontweight="bold")
    plt.grid(True, alpha=0.3)
    plt.tight_layout()
    plt.savefig(config.SHAP_SUMMARY_PATH, dpi=300)
    plt.close()
    logger.info(f"Saved SHAP summary plot to {config.SHAP_SUMMARY_PATH}")

    # 2. Worked Individual Test Example
    logger.info("\n=== WORKED INDIVIDUAL ORDER EXPLANATION EXAMPLE ===")
    single_test_row = X_sample.iloc[[0]]
    explanation = explainer_obj.explain_instance(single_test_row, top_k=3)

    print(f"\nReturn Risk: {explanation['return_probability']*100:.1f}%")
    print(f"Risk Category: {explanation['risk_category']}")
    print(f"Recommendation: {explanation['recommendation']}")
    print("Top factors:")
    for idx, f in enumerate(explanation["top_factors"], 1):
        print(f"  {idx}. {f}")

    return importance_df, explanation


if __name__ == "__main__":
    run_shap_analysis()
