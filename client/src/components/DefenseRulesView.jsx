import React, { useState } from 'react';
import { CheckCircle2, Shield, ToggleLeft, ToggleRight, Plus, Trash2, ArrowRight } from 'lucide-react';

export default function DefenseRulesView() {
  const [rules, setRules] = useState([
    {
      id: 1,
      name: 'Size Bracketing Prompt',
      condition: 'Multiple sizes of same product variant in cart',
      action: 'Render interactive 3D sizing advisor before checkout',
      riskTier: 'HIGH',
      active: true,
    },
    {
      id: 2,
      name: 'Prepaid Verification Requirement',
      condition: 'P(Return) >= 80% & Cart Value > £50',
      action: 'Disable Cash-on-Delivery (COD); require instant UPI/Card verification',
      riskTier: 'VERY_HIGH',
      active: true,
    },
    {
      id: 3,
      name: 'Loyalty VIP Return Pass',
      condition: 'Customer is VIP Premier & Lifetime Orders > 20',
      action: 'Bypass friction check and provide complimentary return pickup',
      riskTier: 'LOW',
      active: true,
    },
    {
      id: 4,
      name: 'Category Return Notice',
      condition: 'Product Type in [Dresses, Shoes] with category return rate > 45%',
      action: 'Display clear return terms reminder on product page',
      riskTier: 'MEDIUM',
      active: false,
    },
  ]);

  const toggleRule = (id) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Merchant Defense Policy Engine</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Configure non-blocking defensive interventions triggered automatically by ReturnLens risk scores.
            </p>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`glass-panel p-5 border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              rule.active ? 'border-slate-800 bg-slate-900/60' : 'border-slate-900 bg-slate-950/40 opacity-60'
            }`}
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center space-x-2.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                  rule.riskTier === 'VERY_HIGH'
                    ? 'badge-very_high'
                    : rule.riskTier === 'HIGH'
                    ? 'badge-high'
                    : rule.riskTier === 'MEDIUM'
                    ? 'badge-medium'
                    : 'badge-low'
                }`}>
                  {rule.riskTier}
                </span>
                <h3 className="text-sm font-bold text-white">{rule.name}</h3>
              </div>
              <div className="text-xs text-slate-300">
                <span className="text-slate-400">Condition:</span> <code className="text-cyan-300 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">{rule.condition}</code>
              </div>
              <div className="text-xs text-slate-300">
                <span className="text-slate-400">Action:</span> {rule.action}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => toggleRule(rule.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  rule.active
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {rule.active ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                <span>{rule.active ? 'Active Policy' : 'Disabled'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
