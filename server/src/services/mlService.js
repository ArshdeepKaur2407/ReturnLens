import axios from 'axios';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

const FASTAPI_URL = process.env.FASTAPI_URL || 'http://127.0.0.1:8000';

const DEFAULT_ORDER = {
  yearOfBirth: 1995,
  isMale: 0,
  shippingCountry: "Country_A",
  premier: 0,
  salesPerCustomer: 8,
  returnsPerCustomer: 3,
  customerReturnRate: 0.375,
  productType: "productType_B",
  brandDesc: "Brand_K",
  avgGbpPrice: 35.0,
  avgDiscountValue: 5.0,
  salesPerProduct: 45,
  returnsPerProduct: 15,
  productReturnRate: 0.333,
  customerId_level_return_code_A: 0.0,
  customerId_level_return_code_B: 0.0,
  customerId_level_return_code_C: 0.0,
  customerId_level_return_code_D_1: 0.0,
  customerId_level_return_code_E: 0.0,
  customerId_level_return_code_D_2: 0.3,
  customerId_level_return_code_F: 0.0,
  customerId_level_return_code_G: 0.0,
  customerId_level_return_code_H: 0.0,
  customerId_level_return_code_I: 0.2,
  customerId_level_return_code_J: 0.1,
  customerId_level_return_code_K: 0.0,
  customerId_level_return_code_L: 0.0,
  variantID_level_return_code_A: 0.0,
  variantID_level_return_code_B: 0.0,
  variantID_level_return_code_C: 0.0,
  variantID_level_return_code_D_1: 0.0,
  variantID_level_return_code_E: 0.0,
  variantID_level_return_code_D_2: 0.3,
  variantID_level_return_code_F: 0.0,
  variantID_level_return_code_G: 0.0,
  variantID_level_return_code_H: 0.0,
  variantID_level_return_code_I: 0.2,
  variantID_level_return_code_J: 0.1,
  variantID_level_return_code_K: 0.0,
  variantID_level_return_code_L: 0.0
};

export const mlService = {
  async predict(rawOrderData) {
    const orderData = { ...DEFAULT_ORDER, ...rawOrderData };
    
    // Auto-calculate rates if not passed directly
    if (rawOrderData.returnsPerCustomer !== undefined && rawOrderData.salesPerCustomer !== undefined) {
      orderData.customerReturnRate = orderData.returnsPerCustomer / Math.max(1, orderData.salesPerCustomer);
    }
    if (rawOrderData.returnsPerProduct !== undefined && rawOrderData.salesPerProduct !== undefined) {
      orderData.productReturnRate = orderData.returnsPerProduct / Math.max(1, orderData.salesPerProduct);
    }

    try {
      // 1. Try FastAPI microservice if running
      const response = await axios.post(`${FASTAPI_URL}/predict`, orderData, {
        timeout: 2500
      });
      return response.data;
    } catch (apiErr) {
      // 2. Direct Python CLI worker fallback for standalone reliability
      return new Promise((resolve, reject) => {
        const payloadStr = JSON.stringify(orderData);
        const script = `
import sys, json, pandas as pd
import config
from src.utils import load_artifact
from src.shap_analysis import ReturnRiskExplainer

try:
    data = json.loads(sys.argv[1])
    pipeline = load_artifact(config.MODEL_PATH)
    metadata = load_artifact(config.METADATA_PATH)
    thresh_data = load_artifact(config.THRESHOLD_PATH) if config.THRESHOLD_PATH.exists() else {"optimal_threshold": 0.19, "fn_cost": 25.0}
    explainer = ReturnRiskExplainer(pipeline, metadata["transformed_feature_names"])
    
    df_row = pd.DataFrame([data])
    result = explainer.explain_instance(df_row, top_k=3)
    prob = result["return_probability"]
    risk_cat = result["risk_category"]
    
    thresh = float(thresh_data.get("threshold", thresh_data.get("optimal_threshold", 0.19)))
    fn_cost = float(thresh_data.get("fn_cost", 25.0))
    
    if risk_cat == "LOW":
        decision = "PROCEED_NORMALLY"
    elif risk_cat == "MEDIUM":
        decision = "MONITOR_ORDER"
    elif risk_cat == "HIGH":
        decision = "ADDITIONAL_VERIFICATION"
    else:
        decision = "MANUAL_REVIEW_OR_PREPAID"
        
    out = {
        "return_probability": prob,
        "risk_category": risk_cat,
        "decision": decision,
        "recommendation": result["recommendation"],
        "expected_loss": round(prob * fn_cost, 2),
        "top_factors": result["top_factors"],
        "optimal_threshold": thresh,
        "action_flag": bool(prob >= thresh)
    }
    print(json.dumps(out))
except Exception as e:
    sys.stderr.write(str(e))
    sys.exit(1)
`;
        const py = spawn('python', ['-c', script, payloadStr], { cwd: PROJECT_ROOT });
        let stdout = '';
        let stderr = '';

        py.stdout.on('data', (d) => { stdout += d.toString(); });
        py.stderr.on('data', (d) => { stderr += d.toString(); });

        py.on('close', (code) => {
          if (code === 0) {
            try {
              resolve(JSON.parse(stdout.trim()));
            } catch (parseErr) {
              reject(parseErr);
            }
          } else {
            reject(new Error(stderr || 'Python ML inference worker exited with error'));
          }
        });
      });
    }
  }
};
