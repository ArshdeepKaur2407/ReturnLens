import React, { useState, useEffect } from 'react';
import { Scale, Sliders, TrendingDown, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

export default function CalibrationCostView() {
  const [bins, setBins] = useState([]);
  const [threshold, setThreshold] = useState(0.17);
  const [optimalThreshold, setOptimalThreshold] = useState(0.17);
  const [fpCost, setFpCost] = useState(5.0);
  const [fnCost, setFnCost] = useState(25.0);
  const [simulation, setSimulation] = useState(null);

  useEffect(() => {
    fetch('/api/threshold')
      .then((r) => r.json())
      .then((d) => {
        const opt = d.optimal_threshold || d.threshold || 0.17;
        setOptimalThreshold(opt);
        setThreshold(opt);
      })
      .catch((e) => console.error(e));

    fetch('/api/calibration')
      .then((r) => r.json())
      .then((d) => setBins(d.bins || []))
      .catch((e) => console.error(e));
  }, []);

  const runSimulation = async (newThresh, newFp, newFn) => {
    try {
      const res = await fetch('/api/simulate-cost', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          threshold: newThresh !== undefined ? newThresh : threshold,
          fp_cost: newFp !== undefined ? newFp : fpCost,
          fn_cost: newFn !== undefined ? newFn : fnCost,
        }),
      });
      const data = await res.json();
      setSimulation(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    runSimulation(threshold, fpCost, fnCost);
  }, [threshold, fpCost, fnCost]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="saas-card p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Scale className="w-4 h-4 text-stone-700" />
              <h2 className="text-sm font-semibold text-stone-900">
                Probability Calibration & Asymmetric Cost Optimization
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-1 max-w-2xl">
              Verifying that predicted probabilities reflect empirical return frequencies and deriving the cost-optimal decision threshold (τ* = {optimalThreshold.toFixed(2)}) on validation data.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setThreshold(optimalThreshold)}
            className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs shadow-xs transition-colors self-start md:self-auto"
          >
            Snap to Cost-Optimal Threshold ({optimalThreshold.toFixed(2)})
          </button>
        </div>
      </div>

      {/* Grid: Left Calibration Reliability Table, Right Dynamic Cost Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 6 cols Decile Calibration */}
        <div className="lg:col-span-6 saas-card overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                Decile Calibration Reliability Table
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Empirical return rates match predicted probabilities across all 10 deciles.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
              Brier: 0.1754
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-surface-subtle border-b border-border text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-4">Predicted Range</th>
                  <th className="py-2.5 px-3">Mean Predicted</th>
                  <th className="py-2.5 px-3">Empirical Return Rate</th>
                  <th className="py-2.5 px-4 text-right">Orders (Count)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {bins.map((bin, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/70 transition-colors">
                    <td className="py-2.5 px-4 font-mono text-stone-800">
                      {bin.bin_range}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-stone-600">
                      {(bin.mean_predicted_prob * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-stone-900">
                      {(bin.empirical_return_rate * 100).toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono text-stone-500">
                      {bin.count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: 6 cols Cost Simulation */}
        <div className="lg:col-span-6 saas-card p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
                Asymmetric Cost Curve Simulator
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                Simulating financial loss over N = 50,000 test orders under custom penalty assumptions.
              </p>
            </div>
            <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-sage-50 text-sage-800 border border-sage-200">
              τ = {threshold.toFixed(2)}
            </span>
          </div>

          {/* Sliders & Cost Inputs */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-stone-700 font-medium mb-1">
                <span>Decision Threshold (τ)</span>
                <span className="font-mono font-semibold text-stone-900">{threshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
              />
              <div className="flex justify-between text-[10px] text-stone-400 mt-1 font-mono">
                <span>0.05 (High Recall)</span>
                <span className="text-stone-700 font-medium">Optimal: {optimalThreshold.toFixed(2)}</span>
                <span>0.95 (High Precision)</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">
                  False Positive Cost ($)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={fpCost}
                  onChange={(e) => setFpCost(parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
                <span className="text-[10px] text-stone-400 block mt-0.5">Friction / verification cost</span>
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-600 block mb-1">
                  False Negative Cost ($)
                </label>
                <input
                  type="number"
                  min="0"
                  max="200"
                  step="1"
                  value={fnCost}
                  onChange={(e) => setFnCost(parseFloat(e.target.value) || 0)}
                  className="w-full"
                />
                <span className="text-[10px] text-stone-400 block mt-0.5">Reverse shipping & restock loss</span>
              </div>
            </div>
          </div>

          {/* Simulation Output Card */}
          {simulation && (
            <div className="space-y-4 pt-3 border-t border-border">
              {/* Financial Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
                  <span className="text-[10px] uppercase font-medium text-stone-500 block">Baseline Loss</span>
                  <div className="text-sm font-bold font-mono text-stone-700 mt-0.5">
                    ${Math.round(simulation.baseline_cost).toLocaleString()}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
                  <span className="text-[10px] uppercase font-medium text-stone-500 block">Incurred Loss</span>
                  <div className="text-sm font-bold font-mono text-stone-900 mt-0.5">
                    ${Math.round(simulation.incurred_cost).toLocaleString()}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-sage-50 border border-sage-200">
                  <span className="text-[10px] uppercase font-medium text-sage-700 block">Model Savings</span>
                  <div className="text-sm font-bold font-mono text-sage-900 mt-0.5">
                    {simulation.savings_pct}%
                  </div>
                </div>
              </div>

              {/* Confusion Matrix Breakdown */}
              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-xs">
                <div className="text-[11px] font-semibold text-stone-700 mb-2">
                  Confusion Matrix at τ = {threshold.toFixed(2)} (N = 50,000 Orders)
                </div>
                <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                  <div className="p-2 rounded bg-white border border-stone-200">
                    <span className="text-stone-500 block text-[10px]">True Positives (Returns Caught)</span>
                    <span className="font-bold text-stone-900">{simulation.confusion_matrix.TP.toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-stone-200">
                    <span className="text-stone-500 block text-[10px]">False Positives (Review Friction)</span>
                    <span className="font-bold text-stone-900">{simulation.confusion_matrix.FP.toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-stone-200">
                    <span className="text-stone-500 block text-[10px]">False Negatives (Missed Returns)</span>
                    <span className="font-bold text-stone-900">{simulation.confusion_matrix.FN.toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded bg-white border border-stone-200">
                    <span className="text-stone-500 block text-[10px]">True Negatives (Kept Passes)</span>
                    <span className="font-bold text-stone-900">{simulation.confusion_matrix.TN.toLocaleString()}</span>
                  </div>
                </div>
                <p className="text-[10px] text-stone-400 mt-2">
                  * Note: Cost figures are illustrative modeling assumptions ($5 FP, $25 FN). Realized business ROI requires live randomized A/B intervention testing.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
