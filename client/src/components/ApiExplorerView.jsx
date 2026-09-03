import React, { useState } from 'react';
import { Terminal, Copy, Check, Code2, Globe, Send } from 'lucide-react';

export default function ApiExplorerView() {
  const [lang, setLang] = useState('curl');
  const [copied, setCopied] = useState(false);

  const samplePayload = {
    yearOfBirth: 1994,
    isMale: 0,
    shippingCountry: "Country_A",
    premier: 1,
    salesPerCustomer: 15,
    returnsPerCustomer: 7,
    productType: "Dresses",
    brandDesc: "Brand_K",
    avgGbpPrice: 55.0,
    avgDiscountValue: 10.0,
    salesPerProduct: 80,
    returnsPerProduct: 35
  };

  const snippets = {
    curl: `curl -X POST /api/predict \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(samplePayload, null, 2)}'`,
    
    node: `import axios from 'axios';

const response = await axios.post('/api/predict', ${JSON.stringify(samplePayload, null, 2)});

console.log('Return Risk Assessment:', response.data);`,

    python: `import requests

payload = ${JSON.stringify(samplePayload, null, 2)}

response = requests.post("/api/predict", json=payload)
print(response.json())`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border-slate-800">
        <div className="flex items-center space-x-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Developer API Explorer & SDK Generator</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
            Integrate ReturnLens return-risk scoring into pre-dispatch fulfillment or custom e-commerce checkout flows.
        </p>
      </div>

      {/* Code Viewer Panel */}
      <div className="glass-panel p-6 border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            {['curl', 'node', 'python'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase border transition ${
                  lang === l
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>
        </div>

        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-cyan-300 font-mono text-xs overflow-x-auto">
          {snippets[lang]}
        </pre>

        {/* Expected JSON Response Spec */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Example API Response Payload:</span>
          <pre className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-200 font-mono text-xs overflow-x-auto">
{`{
  "return_probability": 0.8842,
  "risk_category": "VERY_HIGH",
  "decision": "MANUAL_REVIEW_OR_PREPAID",
  "recommendation": "Very high risk. Manual review or require prepaid verification before fulfillment.",
  "expected_loss": 22.10,
  "top_factors": [
    "High Customer Historical Return Rate (46.7%) (+1.840 SHAP impact)",
    "Elevated Product Sizing Mismatch Rate (43.8%) (+0.562 SHAP impact)",
    "High Item Value (£55.00) (+0.124 SHAP impact)"
  ],
  "optimal_threshold": 0.19,
  "action_flag": true
}`}
          </pre>
        </div>
      </div>
    </div>
  );
}
