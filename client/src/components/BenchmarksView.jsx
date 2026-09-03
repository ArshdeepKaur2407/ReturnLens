import React, { useState, useEffect } from 'react';
import { Shield, Award, CheckCircle2, TrendingUp, BarChart3, Clock, AlertTriangle } from 'lucide-react';

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
    return (b[sortKey] || 0) - (a[sortKey] || 0);
  });

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="glass-panel p-6 border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Multi-Model Benchmark & Selection Suite</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Evaluated on stratified internal validation split ($N=50,000$) using unified Scikit-Learn <code>ColumnTransformer</code> pipeline fit strictly on $X_{'{'}train{'}'}$.
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Sort by:</span>
            {['pr_auc', 'roc_auc', 'accuracy', 'recall', 'f1'].map((key) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={`px-2.5 py-1 rounded-md font-semibold uppercase text-[11px] border transition ${
                  sortKey === key
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                    : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {key.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 6 Models Comparison Table */}
      <div className="glass-panel p-6 border-slate-800">
        <h3 className="text-sm font-bold text-white mb-4">Candidate Model Architectures (Validation Split)</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-3">Architecture</th>
                <th className="pb-3 px-3">PR-AUC (Primary)</th>
                <th className="pb-3 px-3">ROC-AUC</th>
                <th className="pb-3 px-3">Accuracy</th>
                <th className="pb-3 px-3">Precision</th>
                <th className="pb-3 px-3">Recall</th>
                <th className="pb-3 px-3">F1 Score</th>
                <th className="pb-3 px-3">Brier Score</th>
                <th className="pb-3 px-3 text-right">Training Speed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {sorted.map((m, idx) => {
                const isSelected = m.model_name.toLowerCase().includes('xgboost');
                return (
                  <tr key={idx} className={`hover:bg-slate-800/30 transition ${isSelected ? 'bg-blue-950/20' : ''}`}>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-100">{m.model_name}</span>
                        {isSelected && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                            SELECTED
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-bold text-cyan-400">{Number(m.pr_auc).toFixed(4)}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono text-slate-300">{Number(m.roc_auc).toFixed(4)}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono font-semibold text-emerald-400">{(Number(m.accuracy) * 100).toFixed(2)}%</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono text-slate-300">{(Number(m.precision) * 100).toFixed(2)}%</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono text-slate-300">{(Number(m.recall) * 100).toFixed(2)}%</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono text-slate-300">{Number(m.f1).toFixed(4)}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="font-mono text-slate-400">{Number(m.brier_score).toFixed(4)}</span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-400">
                      {Number(m.training_time_sec).toFixed(2)}s
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
        <div className="glass-panel p-6 border-slate-800 space-y-4">
          <div className="flex items-center space-x-2 text-sm font-bold text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <span>Single-Pass Held-Out Test Evaluation (Generalization Standard, N=150,000)</span>
          </div>
          <p className="text-xs text-slate-400">
            Frozen XGBoost pipeline evaluated strictly once on <code>event_table_testing.p</code> with zero prior parameter tuning or threshold peeking.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">Test Accuracy</span>
              <div className="text-xl font-extrabold text-emerald-400 mt-1">{(testMetrics.accuracy * 100).toFixed(2)}%</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">Test PR-AUC</span>
              <div className="text-xl font-extrabold text-cyan-400 mt-1">{testMetrics.pr_auc.toFixed(4)}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">Test ROC-AUC</span>
              <div className="text-xl font-extrabold text-blue-400 mt-1">{testMetrics.roc_auc.toFixed(4)}</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">Test Precision</span>
              <div className="text-xl font-extrabold text-purple-400 mt-1">{(testMetrics.precision * 100).toFixed(2)}%</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">Test Recall</span>
              <div className="text-xl font-extrabold text-amber-400 mt-1">{(testMetrics.recall * 100).toFixed(2)}%</div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
              <span className="text-[11px] text-slate-400">Brier Score</span>
              <div className="text-xl font-extrabold text-slate-200 mt-1">{testMetrics.brier_score.toFixed(4)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
