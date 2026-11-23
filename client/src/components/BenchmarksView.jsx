import React, { useState, useEffect } from 'react';
import { BarChart2, CheckCircle2, Award, Clock, ArrowUpDown } from 'lucide-react';

export default function BenchmarksView() {
  const [benchmarks, setBenchmarks] = useState([]);
  const [testMetrics, setTestMetrics] = useState(null);
  const [sortKey, setSortKey] = useState('pr_auc');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const bRes = await fetch('/api/benchmarks');
        const bData = await bRes.json();
        setBenchmarks(bData.benchmarks || []);

        const tRes = await fetch('/api/test-metrics');
        const tData = await tRes.json();
        setTestMetrics(tData.metrics || null);
      } catch (err) {
        console.error('Failed to load benchmarks:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const sorted = [...benchmarks].sort((a, b) => {
    return (Number(b[sortKey]) || 0) - (Number(a[sortKey]) || 0);
  });

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="saas-card p-5 sm:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Award className="w-4 h-4 text-stone-700" />
              <h2 className="text-sm font-semibold text-stone-900">Candidate Architecture Benchmarks & Selection</h2>
            </div>
            <p className="text-xs text-stone-500 mt-1 max-w-2xl">
              Evaluated on a stratified internal validation split (N = 20,000 orders) using a unified Scikit-Learn <code>ColumnTransformer</code> pipeline fitted strictly on training transactions.
            </p>
          </div>

          <div className="flex items-center space-x-1.5 text-xs">
            <span className="text-stone-500 text-[11px] mr-1 flex items-center space-x-1">
              <ArrowUpDown className="w-3 h-3 text-stone-400" />
              <span>Sort by:</span>
            </span>
            {['pr_auc', 'roc_auc', 'accuracy', 'f1', 'recall'].map((key) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium uppercase border transition-colors ${
                  sortKey === key
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-600 border-border hover:bg-stone-50'
                }`}
              >
                {key.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Model Comparison Table */}
      <div className="saas-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Validation Split Benchmarks (N = 20,000 Orders)
          </h3>
          <span className="text-[11px] text-stone-500 font-mono">Stratified Seed: 42</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-subtle border-b border-border text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Architecture</th>
                <th className="py-2.5 px-3">PR-AUC (Primary)</th>
                <th className="py-2.5 px-3">ROC-AUC</th>
                <th className="py-2.5 px-3">Accuracy</th>
                <th className="py-2.5 px-3">Precision</th>
                <th className="py-2.5 px-3">Recall</th>
                <th className="py-2.5 px-3">F1 Score</th>
                <th className="py-2.5 px-3">Brier Score</th>
                <th className="py-2.5 px-4 text-right">Training Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {sorted.map((m, idx) => {
                const isSelected = m.model_name.toLowerCase().includes('xgboost');
                return (
                  <tr
                    key={idx}
                    className={`transition-colors ${isSelected ? 'bg-sage-50/40' : 'hover:bg-stone-50/70'}`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-stone-900">{m.model_name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sage-100 text-sage-800 border border-sage-300">
                            Selected Model
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-semibold text-stone-900">
                      {Number(m.pr_auc).toFixed(4)}
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-700">
                      {Number(m.roc_auc).toFixed(4)}
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-700">
                      {(Number(m.accuracy) * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-700">
                      {(Number(m.precision) * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-700">
                      {(Number(m.recall) * 100).toFixed(2)}%
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-700">
                      {Number(m.f1).toFixed(4)}
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-500">
                      {Number(m.brier_score).toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-stone-500 text-[11px]">
                      {Number(m.train_time_sec || m.training_time_sec || 0).toFixed(2)}s
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Held-Out Test Evaluation Box */}
      {testMetrics && (
        <div className="saas-card p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border">
            <div className="flex items-center space-x-2 text-stone-900 font-semibold text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Held-Out Test Generalization Standard (N = 50,000 Unseen Orders)</span>
            </div>
            <span className="text-[11px] text-stone-500">
              Evaluated strictly once on raw test events at standard cutoff (τ = 0.50)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-lg bg-surface-subtle border border-border text-center">
              <span className="text-[11px] text-stone-500 block">Accuracy</span>
              <div className="text-lg font-bold font-mono text-stone-900 mt-0.5">
                {(testMetrics.accuracy * 100).toFixed(2)}%
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface-subtle border border-border text-center">
              <span className="text-[11px] text-stone-500 block">PR-AUC</span>
              <div className="text-lg font-bold font-mono text-stone-900 mt-0.5">
                {testMetrics.pr_auc.toFixed(4)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface-subtle border border-border text-center">
              <span className="text-[11px] text-stone-500 block">ROC-AUC</span>
              <div className="text-lg font-bold font-mono text-stone-900 mt-0.5">
                {testMetrics.roc_auc.toFixed(4)}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface-subtle border border-border text-center">
              <span className="text-[11px] text-stone-500 block">Precision</span>
              <div className="text-lg font-bold font-mono text-stone-900 mt-0.5">
                {(testMetrics.precision * 100).toFixed(2)}%
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface-subtle border border-border text-center">
              <span className="text-[11px] text-stone-500 block">Recall</span>
              <div className="text-lg font-bold font-mono text-stone-900 mt-0.5">
                {(testMetrics.recall * 100).toFixed(2)}%
              </div>
            </div>
            <div className="p-3 rounded-lg bg-surface-subtle border border-border text-center">
              <span className="text-[11px] text-stone-500 block">Brier Score</span>
              <div className="text-lg font-bold font-mono text-stone-900 mt-0.5">
                {testMetrics.brier_score.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
