import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, ArrowUpRight, X, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LiveRadarView() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, highRisk: 0, intercepted: 0, savedLoss: 0 });
  const [selectedTx, setSelectedTx] = useState(null);

  const fetchLiveFeed = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/transactions/live?count=10');
      const data = await res.json();
      if (data.transactions) {
        setTransactions(data.transactions);
        const high = data.transactions.filter(
          (t) => t.risk_category === 'HIGH' || t.risk_category === 'VERY_HIGH'
        ).length;
        const intercepted = data.transactions.filter((t) => t.status === 'FLAGGED_FOR_REVIEW' || t.return_probability >= 0.17).length;
        const loss = data.transactions.reduce(
          (acc, t) => acc + (t.return_probability >= 0.17 ? t.expected_loss : 0),
          0
        );
        setStats({ total: data.transactions.length, highRisk: high, intercepted, savedLoss: loss });
      }
    } catch (e) {
      console.error('Failed to fetch live feed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveFeed();
    const timer = setInterval(fetchLiveFeed, 12000);
    return () => clearInterval(timer);
  }, []);

  const getInterventionBadge = (prob) => {
    if (prob >= 0.8) {
      return {
        label: 'Pre-Pay Verification Required',
        style: 'bg-rose-50 text-rose-800 border-rose-200',
        note: 'Very high return propensity. Recommend prepaid confirmation or sizing review prior to fulfillment.',
      };
    }
    if (prob >= 0.55) {
      return {
        label: 'Automated Sizing Prompt',
        style: 'bg-amber-50 text-amber-800 border-amber-200',
        note: 'High return probability detected. Automated fit advisory sent via post-order notification.',
      };
    }
    if (prob >= 0.17) {
      return {
        label: 'Post-Order Sizing Review',
        style: 'bg-stone-100 text-stone-800 border-stone-200',
        note: 'Probability exceeds cost-optimal threshold (τ* = 0.17). Flagged for light review.',
      };
    }
    return {
      label: 'Standard Checkout Approved',
      style: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      note: 'Low return risk. Friction-free standard order processing.',
    };
  };

  return (
    <div className="space-y-6">
      {/* Overview & Live Metrics Header */}
      <div className="saas-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-700">
              <Radio className="w-4 h-4 text-stone-700" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-semibold text-stone-900">Real-Time Order Stream Monitor</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Live Feed
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Simulated real-time transaction ingestion evaluated against cost-optimal cutoff (τ* = 0.17).
              </p>
            </div>
          </div>

          <button
            onClick={fetchLiveFeed}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 border border-border text-xs font-medium text-stone-700 shadow-xs transition-colors self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-stone-600' : 'text-stone-400'}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-lg bg-surface-subtle border border-border">
            <span className="text-[11px] text-stone-500 block">Active Stream Volume</span>
            <div className="text-xl font-bold font-mono text-stone-900 mt-0.5">{stats.total} Orders</div>
            <span className="text-[10px] text-stone-400 block mt-0.5">Rolling transaction buffer</span>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-subtle border border-border">
            <span className="text-[11px] text-stone-500 block">Flagged for Review</span>
            <div className="text-xl font-bold font-mono text-rose-700 mt-0.5">{stats.intercepted} Orders</div>
            <span className="text-[10px] text-stone-400 block mt-0.5">Exceeding τ* = 0.17 cutoff</span>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-subtle border border-border">
            <span className="text-[11px] text-stone-500 block">Friction-Free Cleared</span>
            <div className="text-xl font-bold font-mono text-emerald-700 mt-0.5">{stats.total - stats.intercepted} Orders</div>
            <span className="text-[10px] text-stone-400 block mt-0.5">Approved without review</span>
          </div>

          <div className="p-3.5 rounded-lg bg-surface-subtle border border-border">
            <span className="text-[11px] text-stone-500 block">Modeled Loss Exposure</span>
            <div className="text-xl font-bold font-mono text-stone-900 mt-0.5">${stats.savedLoss.toFixed(2)}</div>
            <span className="text-[10px] text-stone-400 block mt-0.5">Under $25 return loss assumption</span>
          </div>
        </div>
      </div>

      {/* Transaction Feed Table */}
      <div className="saas-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Incoming Orders Stream
          </h3>
          <span className="text-[11px] text-stone-400 font-mono">Click any row to inspect policy</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-surface-subtle border-b border-border text-stone-500 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-4">Order ID</th>
                <th className="py-2.5 px-3">Customer ID</th>
                <th className="py-2.5 px-3">Catalog Item</th>
                <th className="py-2.5 px-3">Cart Value</th>
                <th className="py-2.5 px-3">Customer Hist. Rate</th>
                <th className="py-2.5 px-3">Return Risk</th>
                <th className="py-2.5 px-4 text-right">Intervention Policy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {transactions.map((tx) => {
                const badge = getInterventionBadge(tx.return_probability);
                const isFlagged = tx.return_probability >= 0.17;

                return (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-stone-50 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4">
                      <div className="font-mono font-semibold text-stone-900 flex items-center space-x-1 group-hover:text-stone-700">
                        <span>{tx.id}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-stone-400 transition-opacity" />
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {new Date(tx.timestamp).toLocaleTimeString()}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono text-stone-800">{tx.customerId}</div>
                      <span className="text-[10px] text-stone-500">{tx.country}</span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="text-stone-800">{tx.product}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-stone-800">
                      £{Number(tx.price).toFixed(2)}
                      {tx.discount > 0 && (
                        <span className="text-[10px] text-stone-400 block">Disc: £{tx.discount.toFixed(2)}</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono text-stone-700">
                      {(tx.customerReturnRate * 100).toFixed(1)}%
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                          tx.return_probability >= 0.6
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : tx.return_probability >= 0.17
                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {(tx.return_probability * 100).toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-medium border ${badge.style}`}>
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-border rounded-xl max-w-md w-full p-5 sm:p-6 shadow-elevated space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-stone-700" />
                <h3 className="text-sm font-semibold text-stone-900">Order Policy Assessment</h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
                  <span className="text-stone-500 text-[10px] block">Order Identifier</span>
                  <span className="font-mono text-stone-900 font-semibold text-xs">{selectedTx.id}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-subtle border border-border">
                  <span className="text-stone-500 text-[10px] block">Return Probability</span>
                  <span className="font-mono text-stone-900 font-semibold text-xs">
                    {(selectedTx.return_probability * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 space-y-1">
                <span className="text-[10px] font-semibold text-stone-700 uppercase tracking-wider block">
                  Recommended Fulfillment Policy
                </span>
                <p className="text-stone-800 leading-relaxed text-xs">
                  {getInterventionBadge(selectedTx.return_probability).note}
                </p>
              </div>

              <div className="p-3 rounded-lg bg-surface-subtle border border-border space-y-1 text-[11px]">
                <div className="flex justify-between text-stone-700">
                  <span>Customer Lifetime Rate:</span>
                  <span className="font-mono font-semibold">{(selectedTx.customerReturnRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-stone-700">
                  <span>Product Category Rate:</span>
                  <span className="font-mono font-semibold">{(selectedTx.productReturnRate * 100).toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-stone-700">
                  <span>Modeled Return Exposure:</span>
                  <span className="font-mono font-semibold">${selectedTx.expected_loss.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
