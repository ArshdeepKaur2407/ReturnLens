import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, CheckCircle2, AlertTriangle, ArrowUpRight, RefreshCw, Zap, Sparkles, X, ExternalLink, ShieldCheck } from 'lucide-react';

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
        const high = data.transactions.filter(t => t.risk_category === 'HIGH' || t.risk_category === 'VERY_HIGH').length;
        const intercepted = data.transactions.filter(t => t.status === 'INTERCEPTED').length;
        const loss = data.transactions.reduce((acc, t) => acc + (t.status === 'INTERCEPTED' ? t.expected_loss : 0), 0);
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

  const getDefenseAction = (prob, riskCat) => {
    if (prob >= 0.8 || riskCat === 'VERY_HIGH') {
      return {
        label: '⚡ Convert COD to UPI (5% Off)',
        sub: 'Auto-disable COD; prompt prepaid UPI',
        color: 'bg-rose-950/80 text-rose-300 border-rose-700/60 hover:bg-rose-900/80',
        dot: 'bg-rose-400',
        policy: 'Pre-Fulfillment Defense Rule #1: High Return Risk. COD disabled at gateway. 5% instant UPI discount offered to guarantee prepaid commitment.'
      };
    }
    if (prob >= 0.55 || riskCat === 'HIGH') {
      return {
        label: '💬 WhatsApp Size Fit Check',
        sub: 'Pre-dispatch sizing confirmation',
        color: 'bg-amber-950/80 text-amber-300 border-amber-700/60 hover:bg-amber-900/80',
        dot: 'bg-amber-400',
        policy: 'Pre-Fulfillment Defense Rule #2: Apparel sizing discrepancy detected. Automated WhatsApp bot dispatches fit confirmation before courier pickup.'
      };
    }
    if (prob >= 0.3 || riskCat === 'MEDIUM') {
      return {
        label: '👁️ High-Value SKU Monitor',
        sub: 'Enhanced delivery tracking',
        color: 'bg-blue-950/80 text-blue-300 border-blue-700/60 hover:bg-blue-900/80',
        dot: 'bg-blue-400',
        policy: 'Pre-Fulfillment Defense Rule #3: Moderate risk on luxury/discount item. Mandatory OTP verification at delivery.'
      };
    }
    return {
      label: '✨ 1-Click Fast Checkout',
      sub: 'Zero friction, instant pass',
      color: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/80',
      dot: 'bg-emerald-400',
      policy: 'Pre-Fulfillment Defense Rule #0: Verified low-friction trusted shopper. 1-click checkout approved with zero authentication barrier.'
    };
  };

  return (
    <div className="space-y-6">
      {/* Executive Value Strip */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/60 border border-blue-700/40 p-5 shadow-2xl shadow-blue-950/40">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-blue-500/30 flex-shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-base font-extrabold text-white tracking-tight">
                  Autonomous Return & RTO Defense Intelligence
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-900/80 text-blue-200 border border-blue-600/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Gateway Sentinel
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Intercepts serial return abusers, size bracketers, and COD fraud before courier dispatch. Operates autonomously at the pre-fulfillment layer to protect merchant reverse-logistics margins without adding checkout friction.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-wrap lg:flex-nowrap">
            <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-right min-w-[130px]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Gateway SLA</span>
              <span className="text-base font-extrabold text-emerald-400">&lt;18ms</span>
              <span className="text-[10px] text-slate-500 block">Pre-Auth Hook</span>
            </div>
            <div className="px-4 py-2 rounded-xl bg-slate-900/90 border border-slate-800 text-right min-w-[150px]">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Net Loss Saved</span>
              <span className="text-base font-extrabold text-cyan-300">₹1.24 Cr / $1.51M</span>
              <span className="text-[10px] text-slate-500 block">Tested Held-Out Set</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Banner with Radar Pulse & Metrics */}
      <div className="glass-panel p-6 border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="relative">
              <div className="radar-dot"></div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Live Ingestion Radar</h2>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Real-Time Streaming
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluated through XGBoost, probability calibrator, and cost-optimal decision threshold (<code className="text-cyan-400">0.19</code>).
              </p>
            </div>
          </div>

          <button
            onClick={fetchLiveFeed}
            disabled={loading}
            className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Refresh Feed</span>
          </button>
        </div>

        {/* Live Metric Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Stream Volume</span>
            <div className="text-2xl font-bold text-white mt-1">{stats.total} Orders</div>
            <span className="text-[11px] text-slate-500">Active transaction buffer</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Intercepted Risk</span>
            <div className="text-2xl font-bold text-rose-400 mt-1">{stats.intercepted} Flagged</div>
            <span className="text-[11px] text-rose-500/80">Triggered automated defense</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Friction-Free Cleared</span>
            <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.total - stats.intercepted} Cleared</div>
            <span className="text-[11px] text-emerald-500/80">1-click instant checkout</span>
          </div>
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Mitigated Return Loss</span>
            <div className="text-2xl font-bold text-cyan-400 mt-1">${stats.savedLoss.toFixed(2)}</div>
            <span className="text-[11px] text-cyan-500/80">Pre-empted courier bleed</span>
          </div>
        </div>
      </div>

      {/* Real-Time Transaction Table */}
      <div className="glass-panel p-6 border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <span>Incoming Transaction Feed</span>
            <span className="text-xs font-normal text-slate-400">(Click any order to inspect automated defense policy)</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">Auto-refreshes every 12s</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="pb-3 px-3">Txn ID / Time</th>
                <th className="pb-3 px-3">Customer Profile</th>
                <th className="pb-3 px-3">Product Item</th>
                <th className="pb-3 px-3">Customer Hist. Rate</th>
                <th className="pb-3 px-3">Product Risk</th>
                <th className="pb-3 px-3">Return Risk</th>
                <th className="pb-3 px-3">Automated Defense Action</th>
                <th className="pb-3 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {transactions.map((tx) => {
                const isHigh = tx.return_probability >= 0.6;
                const isVeryHigh = tx.return_probability >= 0.8;
                const action = getDefenseAction(tx.return_probability, tx.risk_category);

                return (
                  <tr
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className="hover:bg-slate-800/40 cursor-pointer transition group"
                  >
                    <td className="py-3.5 px-3">
                      <div className="font-mono text-cyan-300 font-semibold flex items-center space-x-1 group-hover:text-cyan-200">
                        <span>{tx.id}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition text-cyan-400" />
                      </div>
                      <div className="text-[11px] text-slate-500">{new Date(tx.timestamp).toLocaleTimeString()}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-slate-200">{tx.customerId}</div>
                      <div className="text-[11px] text-slate-400">{tx.country}</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="text-slate-200">{tx.product}</div>
                      <div className="text-[11px] text-slate-400">£{tx.price.toFixed(2)} (Disc: £{tx.discount.toFixed(2)})</div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${tx.customerReturnRate > 0.5 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, tx.customerReturnRate * 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-mono">{(tx.customerReturnRate * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${tx.productReturnRate > 0.4 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, tx.productReturnRate * 100)}%` }}
                          ></div>
                        </div>
                        <span className="font-mono">{(tx.productReturnRate * 100).toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-md text-[11px] font-bold ${
                          isVeryHigh ? 'badge-very_high' : isHigh ? 'badge-high' : tx.return_probability >= 0.3 ? 'badge-medium' : 'badge-low'
                        }`}>
                          {(tx.return_probability * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3">
                      <div className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium transition ${action.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${action.dot}`}></span>
                        <span>{action.label}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        tx.status === 'INTERCEPTED'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800/80'
                      }`}>
                        {tx.status === 'INTERCEPTED' ? <ShieldAlert className="w-3 h-3 mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Defense Action Modal Preview */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Autonomous Defense Policy Summary</h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Order Identifier</span>
                  <span className="font-mono text-cyan-300 text-sm font-bold">{selectedTx.id}</span>
                </div>
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                  <span className="text-slate-400 text-[11px] block">Return Probability</span>
                  <span className="text-sm font-bold text-rose-400">{(selectedTx.return_probability * 100).toFixed(1)}%</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-800/50 space-y-2">
                <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Enforced Checkout Policy</span>
                </span>
                <p className="text-slate-200 leading-relaxed font-medium">
                  {getDefenseAction(selectedTx.return_probability, selectedTx.risk_category).policy}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <span className="text-slate-400 text-[11px] font-semibold block">Merchant Financial Impact</span>
                <div className="flex items-center justify-between text-slate-200">
                  <span>Protected Reverse Shipping & Restocking:</span>
                  <span className="font-bold text-emerald-400">+${selectedTx.expected_loss} (₹{(selectedTx.expected_loss * 83).toFixed(0)})</span>
                </div>
                <div className="flex items-center justify-between text-slate-400 text-[11px]">
                  <span>Verification Cost Overhead:</span>
                  <span>$5.00 (Friction-minimized)</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-3">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition"
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
