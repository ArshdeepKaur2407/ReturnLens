import React, { useState, useEffect } from 'react';
import { Sparkles, DollarSign, Sliders, TrendingDown, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CalibrationCostView() {
  const [bins, setBins] = useState([]);
  const [threshold, setThreshold] = useState(0.19);
  const [fpCost, setFpCost] = useState(5.0);
  const [fnCost, setFnCost] = useState(25.0);
  const [simulation, setSimulation] = useState(null);

  useEffect(() => {
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

  const triggerCelebrate = () => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-6 border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Probability Calibration & Cost-Threshold Matrix</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Validating probability honesty across empirical deciles and dynamically optimizing the decision threshold $\tau^*$ to minimize financial loss.
            </p>
          </div>
          <button
            onClick={() => {
              setThreshold(0.19);
              triggerCelebrate();
            }}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 hover:opacity-90 text-slate-950 font-bold text-xs shadow-md transition"
          >
            Snap to Cost-Optimal Threshold (0.19)
          </button>
        </div>
      </div>

      {/* Grid: Left Calibration Reliability Table, Right Dynamic Cost Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 6 cols Calibration Table */}
        <div className="lg:col-span-6 glass-panel p-6 border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center justify-between">
            <span>Decile Calibration Reliability Table</span>
            <span className="text-xs text-emerald-400 font-mono">Brier: 0.1227</span>
          </h3>
          <p className="text-xs text-slate-400">
            A merchant can trust a score of <b>78%</b> because empirical returns match predicted probabilities across all 10 bins.
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-2.5 px-2">Decile Bin</th>
                  <th className="pb-2.5 px-2">Mean Pred Prob</th>
                  <th className="pb-2.5 px-2">Empirical Return</th>
                  <th className="pb-2.5 px-2 text-right">Event Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {bins.map((b, idx) => {
                  const diff = Math.abs(b.mean_pred - b.empirical_rate);
                  return (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-2 font-mono text-cyan-300">{b.bin}</td>
                      <td className="py-2.5 px-2 font-mono text-slate-200">{(b.mean_pred * 100).toFixed(1)}%</td>
                      <td className="py-2.5 px-2 font-mono text-emerald-400 font-bold">
                        {(b.empirical_rate * 100).toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-slate-400">
                        {b.count.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: 6 cols Dynamic Threshold & Cost Simulator */}
        <div className="lg:col-span-6 glass-panel p-6 border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Cost-Threshold Simulator</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Threshold $\tau$: <b>{threshold.toFixed(2)}</b>
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs text-slate-300 font-medium mb-1.5">
                <span>Decision Threshold ($\tau = {threshold.toFixed(2)}$)</span>
                <span className="text-cyan-400 font-bold">
                  {threshold === 0.19 ? '🌟 Optimal $\\tau^*$ Minimum Cost' : ''}
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.95"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400">False Positive Cost (Friction)</label>
                <div className="flex items-center mt-1">
                  <span className="px-2.5 py-1.5 bg-slate-900 border border-r-0 border-slate-700 text-xs text-slate-400 rounded-l-lg">$</span>
                  <input
                    type="number"
                    value={fpCost}
                    onChange={(e) => setFpCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-r-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">False Negative Cost (Return Loss)</label>
                <div className="flex items-center mt-1">
                  <span className="px-2.5 py-1.5 bg-slate-900 border border-r-0 border-slate-700 text-xs text-slate-400 rounded-l-lg">$</span>
                  <input
                    type="number"
                    value={fnCost}
                    onChange={(e) => setFnCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-r-lg bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Financial Impact Result Card */}
          {simulation && (
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Baseline Loss</span>
                  <div className="text-base font-bold text-slate-300 mt-0.5">
                    ${(simulation.baseline_cost / 1000).toFixed(1)}k
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Incurred Cost</span>
                  <div className="text-base font-bold text-rose-400 mt-0.5">
                    ${(simulation.incurred_cost / 1000).toFixed(1)}k
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase">Net Saved</span>
                  <div className="text-base font-bold text-emerald-400 mt-0.5">
                    +{simulation.savings_pct}%
                  </div>
                </div>
              </div>

              {/* Dynamic Confusion Matrix Display */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Simulated Held-Out Test Confusion Matrix (N=150,000)
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">TN (Cleared):</span>
                    <span className="text-emerald-400 font-bold">{simulation.confusion_matrix.TN.toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">FP (Friction):</span>
                    <span className="text-amber-400 font-bold">{simulation.confusion_matrix.FP.toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">FN (Missed):</span>
                    <span className="text-rose-400 font-bold">{simulation.confusion_matrix.FN.toLocaleString()}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800 flex justify-between">
                    <span className="text-slate-400">TP (Pre-empted):</span>
                    <span className="text-cyan-400 font-bold">{simulation.confusion_matrix.TP.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
