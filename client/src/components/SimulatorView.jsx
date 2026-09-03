import React, { useState } from 'react';
import { Cpu, ShieldCheck, AlertCircle, TrendingUp, DollarSign, CheckCircle2, ChevronRight, Zap } from 'lucide-react';

export default function SimulatorView() {
  const [formData, setFormData] = useState({
    yearOfBirth: 1993,
    isMale: 0,
    shippingCountry: 'Country_A',
    premier: 1,
    salesPerCustomer: 15,
    returnsPerCustomer: 8,
    productType: 'Dresses',
    brandDesc: 'Brand_K',
    avgGbpPrice: 55.0,
    avgDiscountValue: 12.0,
    salesPerProduct: 90,
    returnsPerProduct: 40,
    customerId_level_return_code_D_2: 0.35,
    variantID_level_return_code_D_2: 0.35,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const runPrediction = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculatedCustRate = (formData.returnsPerCustomer / Math.max(1, formData.salesPerCustomer)) * 100;
  const calculatedProdRate = (formData.returnsPerProduct / Math.max(1, formData.salesPerProduct)) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Input Panel: 7 cols */}
      <div className="lg:col-span-6 glass-panel p-6 border-slate-800 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Order Risk Simulator</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tune customer behavioral traits and item catalog features for real-time TreeSHAP inference.
            </p>
          </div>
          <button
            onClick={() => {
              setFormData({
                yearOfBirth: 1996,
                isMale: 0,
                shippingCountry: 'Country_G',
                premier: 0,
                salesPerCustomer: 10,
                returnsPerCustomer: 8,
                productType: 'productType_B',
                brandDesc: 'Brand_K',
                avgGbpPrice: 65.0,
                avgDiscountValue: 15.0,
                salesPerProduct: 50,
                returnsPerProduct: 30,
                customerId_level_return_code_D_2: 0.4,
                variantID_level_return_code_D_2: 0.4,
              });
            }}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold px-2.5 py-1 rounded bg-cyan-950/60 border border-cyan-800/60"
          >
            Load High-Risk Sample
          </button>
        </div>

        <form onSubmit={runPrediction} className="space-y-5">
          {/* Customer History Section */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">1. Customer Behavioral Profile</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-medium">Customer Lifetime Orders ({formData.salesPerCustomer})</label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={formData.salesPerCustomer}
                  onChange={(e) => handleChange('salesPerCustomer', parseInt(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-medium">Lifetime Returns ({formData.returnsPerCustomer})</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.returnsPerCustomer}
                  onChange={(e) => handleChange('returnsPerCustomer', parseInt(e.target.value))}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs">
              <span className="text-slate-400">Calculated Return Propensity:</span>
              <span className={`font-mono font-bold ${calculatedCustRate > 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {calculatedCustRate.toFixed(1)}% Return Rate
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400">Birth Year</label>
                <input
                  type="number"
                  value={formData.yearOfBirth}
                  onChange={(e) => handleChange('yearOfBirth', parseInt(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Country</label>
                <select
                  value={formData.shippingCountry}
                  onChange={(e) => handleChange('shippingCountry', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  {['Country_A', 'Country_B', 'Country_C', 'Country_D', 'Country_E', 'Country_G', 'Country_H'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">VIP / Premier</label>
                <select
                  value={formData.premier}
                  onChange={(e) => handleChange('premier', parseInt(e.target.value))}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value={1}>VIP Member</option>
                  <option value={0}>Standard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product & Cart Details */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">2. Item Catalog & Pricing Dynamics</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-300 font-medium">Item Price: £{formData.avgGbpPrice}</label>
                <input
                  type="range"
                  min="5"
                  max="250"
                  step="5"
                  value={formData.avgGbpPrice}
                  onChange={(e) => handleChange('avgGbpPrice', parseFloat(e.target.value))}
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-xs text-slate-300 font-medium">Discount Applied: £{formData.avgDiscountValue}</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="2"
                  value={formData.avgDiscountValue}
                  onChange={(e) => handleChange('avgDiscountValue', parseFloat(e.target.value))}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Category</label>
                <select
                  value={formData.productType}
                  onChange={(e) => handleChange('productType', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  {['Dresses', 'Tops', 'Jeans', 'Shoes', 'productType_B', 'productType_K', 'productType_D'].map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Brand</label>
                <select
                  value={formData.brandDesc}
                  onChange={(e) => handleChange('brandDesc', e.target.value)}
                  className="w-full mt-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  {['Brand_K', 'Brand_A', 'Brand_B', 'Brand_C', 'Brand_D', 'Brand_G', 'Brand_E'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-400 hover:opacity-95 text-slate-950 font-extrabold text-sm tracking-wide shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition"
          >
            <Zap className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Evaluating Model & TreeSHAP...' : 'Score Order Risk & Explain'}</span>
          </button>
        </form>
      </div>

      {/* Right Output Panel: 6 cols */}
      <div className="lg:col-span-6 space-y-6">
        {result ? (
          <div className="glass-panel p-6 border-slate-800 space-y-6">
            {/* Top Score Summary */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-5">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Predicted Return Probability</span>
                <div className="text-4xl font-extrabold text-white mt-1 flex items-baseline space-x-2">
                  <span>{(result.return_probability * 100).toFixed(1)}%</span>
                  <span className="text-xs text-slate-400 font-normal">
                    (Threshold: {(result.optimal_threshold * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
              <div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                  result.risk_category === 'VERY_HIGH'
                    ? 'badge-very_high'
                    : result.risk_category === 'HIGH'
                    ? 'badge-high'
                    : result.risk_category === 'MEDIUM'
                    ? 'badge-medium'
                    : 'badge-low'
                }`}>
                  {result.risk_category.replace('_', ' ')} RISK
                </span>
              </div>
            </div>

            {/* Visual Probability Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Safe (0%)</span>
                <span>Optimal Intercept Point (19%)</span>
                <span>Critical (100%)</span>
              </div>
              <div className="w-full bg-slate-900 rounded-full h-3 relative overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 ${
                    result.return_probability >= 0.8
                      ? 'bg-rose-500'
                      : result.return_probability >= 0.6
                      ? 'bg-rose-400'
                      : result.return_probability >= 0.3
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, result.return_probability * 100)}%` }}
                ></div>
                {/* Threshold Marker */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
                  style={{ left: `${result.optimal_threshold * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Decision & Recommendation Card */}
            <div className={`p-4 rounded-xl border ${
              result.action_flag
                ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
            }`}>
              <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider mb-1">
                {result.action_flag ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
                <span>Merchant Decision: {result.decision}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{result.recommendation}</p>
            </div>

            {/* TreeSHAP Factor Attributions */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>🔍 Why this order? (Top TreeSHAP Drivers)</span>
                <span className="text-[10px] text-cyan-400">Exact Log-Odds Impact</span>
              </h3>
              <div className="space-y-2">
                {result.top_factors && result.top_factors.map((factor, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs flex items-start space-x-2.5">
                    <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 leading-snug">{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Expected Loss Exposure Card */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-800">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400">Expected Loss (P × $25)</span>
                <div className="text-lg font-bold text-white mt-0.5">${result.expected_loss.toFixed(2)}</div>
                <span className="text-[10px] text-slate-500">Unmanaged exposure</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400">Friction Cost</span>
                <div className="text-lg font-bold text-cyan-400 mt-0.5">
                  {result.action_flag ? '$5.00' : '$0.00'}
                </div>
                <span className="text-[10px] text-slate-500">Targeted verification</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-12 border-slate-800 flex flex-col items-center justify-center text-center space-y-4 min-h-[420px]">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 shadow-inner">
              <Cpu className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Awaiting Order Inputs</h3>
              <p className="text-xs text-slate-400 max-w-sm mt-1">
                Configure customer attributes on the left and click <b>Score Order Risk</b> to run the frozen XGBoost pipeline and TreeSHAP explainer.
              </p>
            </div>
            <button
              onClick={runPrediction}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 transition"
            >
              Run Default Evaluation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
