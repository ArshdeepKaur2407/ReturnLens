import React, { useState } from 'react';
import { SlidersHorizontal, ShieldCheck, AlertCircle, ArrowRight, Info, Check, RefreshCw, Sparkles, UserCheck } from 'lucide-react';

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
    setFormData((prev) => {
      const next = { ...prev, [field]: val };
      // Keep returns bounded by sales
      if (field === 'salesPerCustomer' && next.returnsPerCustomer > val) {
        next.returnsPerCustomer = val;
      }
      return next;
    });
  };

  const loadPreset = (type) => {
    if (type === 'high_risk') {
      setFormData({
        yearOfBirth: 1995,
        isMale: 0,
        shippingCountry: 'Country_G',
        premier: 0,
        salesPerCustomer: 12,
        returnsPerCustomer: 9,
        productType: 'Dresses',
        brandDesc: 'Brand_K',
        avgGbpPrice: 68.0,
        avgDiscountValue: 18.0,
        salesPerProduct: 60,
        returnsPerProduct: 35,
        customerId_level_return_code_D_2: 0.45,
        variantID_level_return_code_D_2: 0.45,
      });
    } else if (type === 'cold_start') {
      setFormData({
        yearOfBirth: 1998,
        isMale: 1,
        shippingCountry: 'Country_B',
        premier: 0,
        salesPerCustomer: 0,
        returnsPerCustomer: 0,
        productType: 'Tops',
        brandDesc: 'Brand_A',
        avgGbpPrice: 32.0,
        avgDiscountValue: 0.0,
        salesPerProduct: 80,
        returnsPerProduct: 15,
        customerId_level_return_code_D_2: 0.0,
        variantID_level_return_code_D_2: 0.15,
      });
    } else {
      // Standard regular order
      setFormData({
        yearOfBirth: 1990,
        isMale: 0,
        shippingCountry: 'Country_A',
        premier: 1,
        salesPerCustomer: 20,
        returnsPerCustomer: 2,
        productType: 'Jeans',
        brandDesc: 'Brand_C',
        avgGbpPrice: 45.0,
        avgDiscountValue: 5.0,
        salesPerProduct: 120,
        returnsPerProduct: 25,
        customerId_level_return_code_D_2: 0.1,
        variantID_level_return_code_D_2: 0.2,
      });
    }
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

  const isColdStart = formData.salesPerCustomer === 0;
  const calculatedCustRate = isColdStart ? 0 : (formData.returnsPerCustomer / Math.max(1, formData.salesPerCustomer)) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Input Configuration: 6 cols */}
      <div className="lg:col-span-6 saas-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
          <div>
            <h2 className="text-sm font-semibold text-stone-900 flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-stone-700" />
              <span>Order Risk Simulator</span>
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Simulate customer behavior and catalog signals for real-time TreeSHAP scoring.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => loadPreset('standard')}
              className="text-[11px] font-medium px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 transition-colors"
            >
              Regular
            </button>
            <button
              type="button"
              onClick={() => loadPreset('high_risk')}
              className="text-[11px] font-medium px-2 py-1 rounded-md bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors"
            >
              High Risk
            </button>
            <button
              type="button"
              onClick={() => loadPreset('cold_start')}
              className="text-[11px] font-medium px-2 py-1 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
            >
              Cold Start
            </button>
          </div>
        </div>

        <form onSubmit={runPrediction} className="space-y-5">
          {/* Section 1: Customer Profile */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                1. Customer Behavioral Signals
              </span>
              {isColdStart && (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  First-Time Shopper
                </span>
              )}
            </div>

            {isColdStart ? (
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-start space-x-2">
                <Info className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" />
                <p>
                  Zero historical orders recorded. Customer return rate defaults to population baseline; predictions rely primarily on catalog category, item price, and demographic priors.
                </p>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-stone-700 font-medium mb-1">
                  <span>Lifetime Orders</span>
                  <span className="font-mono text-stone-900 font-semibold">{formData.salesPerCustomer}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={formData.salesPerCustomer}
                  onChange={(e) => handleChange('salesPerCustomer', parseInt(e.target.value) || 0)}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-stone-700 font-medium mb-1">
                  <span>Lifetime Returns</span>
                  <span className="font-mono text-stone-900 font-semibold">{formData.returnsPerCustomer}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(1, formData.salesPerCustomer)}
                  value={formData.returnsPerCustomer}
                  disabled={isColdStart}
                  onChange={(e) => handleChange('returnsPerCustomer', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-subtle border border-border text-xs">
              <span className="text-stone-600">Calculated Historical Return Rate:</span>
              <span className={`font-mono font-semibold ${isColdStart ? 'text-stone-500' : calculatedCustRate > 40 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {isColdStart ? 'N/A (Cold-Start)' : `${calculatedCustRate.toFixed(1)}%`}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">Birth Year</label>
                <input
                  type="number"
                  min="1920"
                  max="2020"
                  value={formData.yearOfBirth}
                  onChange={(e) => handleChange('yearOfBirth', parseInt(e.target.value) || 1990)}
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">Delivery Country</label>
                <select
                  value={formData.shippingCountry}
                  onChange={(e) => handleChange('shippingCountry', e.target.value)}
                  className="w-full"
                >
                  {['Country_A', 'Country_B', 'Country_C', 'Country_D', 'Country_E', 'Country_G', 'Country_H'].map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">VIP Tier</label>
                <select
                  value={formData.premier}
                  onChange={(e) => handleChange('premier', parseInt(e.target.value))}
                  className="w-full"
                >
                  <option value={1}>VIP Member</option>
                  <option value={0}>Standard</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Product & Pricing */}
          <div className="space-y-3 pt-4 border-t border-border">
            <span className="text-xs font-semibold uppercase tracking-wider text-stone-500 block">
              2. Catalog Attributes & Cart Value
            </span>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-stone-700 font-medium mb-1">
                  <span>Item Price (£)</span>
                  <span className="font-mono text-stone-900 font-semibold">£{formData.avgGbpPrice.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="250"
                  step="5"
                  value={formData.avgGbpPrice}
                  onChange={(e) => handleChange('avgGbpPrice', parseFloat(e.target.value) || 5)}
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-stone-700 font-medium mb-1">
                  <span>Promotional Discount (£)</span>
                  <span className="font-mono text-stone-900 font-semibold">£{formData.avgDiscountValue.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="2"
                  value={formData.avgDiscountValue}
                  onChange={(e) => handleChange('avgDiscountValue', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">Product Category</label>
                <select
                  value={formData.productType}
                  onChange={(e) => handleChange('productType', e.target.value)}
                  className="w-full"
                >
                  {['Dresses', 'Tops', 'Jeans', 'Shoes', 'productType_B', 'productType_K', 'productType_D'].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">Brand Catalog</label>
                <select
                  value={formData.brandDesc}
                  onChange={(e) => handleChange('brandDesc', e.target.value)}
                  className="w-full"
                >
                  {['Brand_K', 'Brand_A', 'Brand_B', 'Brand_C', 'Brand_D', 'Brand_G', 'Brand_E'].map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 active:bg-stone-950 text-white font-medium text-xs tracking-wide shadow-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-stone-300" />
                <span>Evaluating TreeSHAP Attribution...</span>
              </>
            ) : (
              <>
                <span>Score Order Return Risk</span>
                <ArrowRight className="w-3.5 h-3.5 text-stone-300" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Right Output Panel: 6 cols */}
      <div className="lg:col-span-6 space-y-5">
        {result ? (
          <div className="saas-card p-5 sm:p-6 space-y-5">
            {/* Score & Risk Tier Header */}
            <div className="flex items-center justify-between pb-4 border-b border-border">
              <div>
                <span className="text-[11px] font-medium uppercase tracking-wider text-stone-500">
                  Predicted Return Propensity
                </span>
                <div className="flex items-baseline space-x-2 mt-0.5">
                  <span className="text-3xl sm:text-4xl font-bold font-mono text-stone-900 tracking-tight">
                    {(result.return_probability * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-stone-500 font-mono">
                    (Cutoff: {(result.optimal_threshold * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>

              <div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                    result.risk_category === 'VERY_HIGH'
                      ? 'badge-very_high'
                      : result.risk_category === 'HIGH'
                      ? 'badge-high'
                      : result.risk_category === 'MEDIUM'
                      ? 'badge-medium'
                      : 'badge-low'
                  }`}
                >
                  {result.risk_category.replace('_', ' ')} RISK
                </span>
              </div>
            </div>

            {/* Decision Threshold Progress Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] text-stone-500">
                <span>Safe (0%)</span>
                <span className="font-medium text-stone-800">
                  Cost-Optimal Cutoff ({((result?.optimal_threshold || 0.17) * 100).toFixed(0)}%)
                </span>
                <span>Critical (100%)</span>
              </div>

              <div className="w-full bg-stone-100 rounded-full h-2.5 relative overflow-hidden border border-stone-200">
                <div
                  className={`h-full transition-all duration-300 ${
                    result.return_probability >= 0.8
                      ? 'bg-rose-600'
                      : result.return_probability >= 0.6
                      ? 'bg-rose-500'
                      : result.return_probability >= (result.optimal_threshold || 0.17)
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, result.return_probability * 100))}%` }}
                ></div>
                {/* Visual marker at threshold */}
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-stone-900 z-10"
                  style={{ left: `${(result.optimal_threshold || 0.17) * 100}%` }}
                  title={`Cost-Optimal Decision Cutoff (${((result.optimal_threshold || 0.17) * 100).toFixed(0)}%)`}
                ></div>
              </div>
            </div>

            {/* Merchant Action Callout */}
            <div
              className={`p-3.5 rounded-lg border text-xs ${
                result.action_flag
                  ? 'bg-rose-50/60 border-rose-200 text-rose-900'
                  : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
              }`}
            >
              <div className="flex items-center space-x-2 font-semibold mb-1">
                {result.action_flag ? (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                )}
                <span>Merchant Decision: {result.decision}</span>
              </div>
              <p className="text-stone-700 leading-relaxed text-[11px]">
                {result.recommendation}
              </p>
            </div>

            {/* TreeSHAP Contributing Drivers */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Key Contributing Factors (TreeSHAP)
                </h3>
                <span className="text-[11px] text-stone-400 font-mono">Marginal Log-Odds</span>
              </div>

              <div className="space-y-2">
                {result.top_factors && result.top_factors.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-surface-subtle border border-border text-xs flex items-start space-x-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-stone-200 text-stone-700 font-mono text-[11px] font-semibold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="text-stone-800 leading-snug flex-1">{factor}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cost Exposure Comparison */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
              <div className="p-3 rounded-lg bg-surface-subtle border border-border">
                <span className="text-[11px] text-stone-500 block">Expected Loss (Unmanaged)</span>
                <div className="text-base font-bold font-mono text-stone-900 mt-0.5">
                  ${result.expected_loss.toFixed(2)}
                </div>
                <span className="text-[10px] text-stone-400 block mt-0.5">P(Return) × $25 loss assumption</span>
              </div>

              <div className="p-3 rounded-lg bg-surface-subtle border border-border">
                <span className="text-[11px] text-stone-500 block">Targeted Verification Cost</span>
                <div className="text-base font-bold font-mono text-stone-900 mt-0.5">
                  {result.action_flag ? '$5.00' : '$0.00'}
                </div>
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  {result.action_flag ? 'Targeted prompt dispatched' : 'Friction-free pass-through'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Awaiting State */
          <div className="saas-card p-10 flex flex-col items-center justify-center text-center space-y-3 min-h-[460px]">
            <div className="w-12 h-12 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-600">
              <SlidersHorizontal className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-stone-900">Awaiting Order Inputs</h3>
              <p className="text-xs text-stone-500 max-w-xs mt-1">
                Configure behavioral signals on the left and click <b>Score Order Return Risk</b> to view calibrated probabilities and TreeSHAP attributions.
              </p>
            </div>
            <button
              type="button"
              onClick={runPrediction}
              className="mt-2 px-3.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-xs font-medium text-stone-800 border border-stone-200 transition-colors"
            >
              Run Default Evaluation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
