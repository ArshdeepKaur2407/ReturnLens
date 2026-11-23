import React, { useState } from 'react';
import { Code2, Copy, Check, ExternalLink } from 'lucide-react';

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
    curl: `curl -X POST http://127.0.0.1:5050/api/predict \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(samplePayload, null, 2)}'`,
    
    node: `import axios from 'axios';

const payload = ${JSON.stringify(samplePayload, null, 2)};

const response = await axios.post('http://127.0.0.1:5050/api/predict', payload);
console.log('Return Risk Assessment:', response.data);`,

    python: `import requests

payload = ${JSON.stringify(samplePayload, null, 2)}

response = requests.post("http://127.0.0.1:5050/api/predict", json=payload)
print(response.json())`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[lang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="saas-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <Code2 className="w-4 h-4 text-stone-700" />
              <h2 className="text-sm font-semibold text-stone-900">Developer API Explorer & SDK Snippets</h2>
            </div>
            <p className="text-xs text-stone-500 mt-1 max-w-2xl">
              Integrate real-time return risk scoring and TreeSHAP attributions into pre-dispatch fulfillment or checkout pipelines.
            </p>
          </div>

          <a
            href="/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-colors self-start sm:self-auto"
          >
            <span>Open Swagger / OpenAPI Docs</span>
            <ExternalLink className="w-3.5 h-3.5 text-stone-300" />
          </a>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="saas-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div className="flex items-center space-x-1">
            {['curl', 'node', 'python'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-3 py-1 rounded-md text-xs font-medium uppercase transition-colors ${
                  lang === l
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'bg-surface-subtle text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-border'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-xs font-medium text-stone-700 border border-border shadow-xs transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
            <span>{copied ? 'Copied' : 'Copy Snippet'}</span>
          </button>
        </div>

        {/* Code Snippet Box */}
        <div className="rounded-lg bg-stone-950 p-4 border border-stone-800 overflow-x-auto">
          <pre className="text-stone-200 font-mono text-xs leading-relaxed">
            {snippets[lang]}
          </pre>
        </div>

        {/* Expected JSON Response Spec */}
        <div className="pt-3 border-t border-border space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500 block">
            Example API Response Payload:
          </span>
          <div className="rounded-lg bg-surface-subtle p-4 border border-border overflow-x-auto">
            <pre className="text-stone-800 font-mono text-xs leading-relaxed">
{`{
  "return_probability": 0.7649,
  "risk_category": "HIGH",
  "decision": "💬 Proactive Sizing Fit Prompt (High Return Risk)",
  "recommendation": "High risk. Apply targeted friction (e.g. sizing confirmation, return policy prompt).",
  "expected_loss": 19.12,
  "top_factors": [
    "Customer Historical Return Rate (66.7%) (+0.495 SHAP log-odds impact)",
    "Item Promotional Discount Depth (+0.151 SHAP log-odds impact)",
    "Historical Return Reason Pattern (Fit / Sizing / Style) (+0.091 SHAP log-odds impact)"
  ],
  "optimal_threshold": 0.17,
  "action_flag": true
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
