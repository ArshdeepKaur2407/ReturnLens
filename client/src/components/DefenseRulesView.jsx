import React, { useState } from 'react';
import { ShieldCheck, Check, Info } from 'lucide-react';

export default function DefenseRulesView() {
  const [rules, setRules] = useState([
    {
      id: 1,
      name: 'Size Bracketing Advisory',
      condition: 'P(Return) >= 55% or Multiple sizes of same SKU in cart',
      action: 'Render interactive sizing fit advisor before order confirmation',
      riskTier: 'HIGH',
      active: true,
    },
    {
      id: 2,
      name: 'Prepaid Verification Requirement',
      condition: 'P(Return) >= 80% and Cart Value > £50',
      action: 'Disable Cash-on-Delivery (COD); prompt instant prepaid confirmation',
      riskTier: 'VERY_HIGH',
      active: true,
    },
    {
      id: 3,
      name: 'VIP Return Waiver',
      condition: 'Customer is VIP Premier and Lifetime Orders > 20',
      action: 'Bypass targeted friction check and provide complimentary return processing',
      riskTier: 'LOW',
      active: true,
    },
    {
      id: 4,
      name: 'Category Return Notice',
      condition: 'Category in [Dresses, Shoes] with category return rate > 45%',
      action: 'Display clear return terms reminder on product detail page',
      riskTier: 'MEDIUM',
      active: true,
    },
  ]);

  const toggleRule = (id) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="saas-card p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-stone-700" />
              <h2 className="text-sm font-semibold text-stone-900">Pre-Fulfillment Intervention Policies</h2>
            </div>
            <p className="text-xs text-stone-500 mt-1 max-w-2xl">
              Configure non-blocking defensive checks triggered when return-risk scores exceed defined operational thresholds.
            </p>
          </div>
        </div>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`saas-card p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              rule.active ? 'bg-white' : 'bg-surface-subtle opacity-75'
            }`}
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center space-x-2.5">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                    rule.riskTier === 'VERY_HIGH'
                      ? 'badge-very_high'
                      : rule.riskTier === 'HIGH'
                      ? 'badge-high'
                      : rule.riskTier === 'MEDIUM'
                      ? 'badge-medium'
                      : 'badge-low'
                  }`}
                >
                  {rule.riskTier} TIER
                </span>
                <h3 className="text-xs font-semibold text-stone-900">{rule.name}</h3>
              </div>

              <div className="text-xs text-stone-600">
                <span className="text-stone-400 font-medium">Trigger:</span>{' '}
                <code className="text-stone-800 bg-stone-100 px-1.5 py-0.5 rounded font-mono text-[11px] border border-stone-200">
                  {rule.condition}
                </code>
              </div>

              <div className="text-xs text-stone-600">
                <span className="text-stone-400 font-medium">Action:</span> {rule.action}
              </div>
            </div>

            <div className="flex items-center space-x-3 self-start md:self-center">
              <button
                type="button"
                onClick={() => toggleRule(rule.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  rule.active
                    ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                    : 'bg-white text-stone-600 border-border hover:bg-stone-50'
                }`}
              >
                {rule.active && <Check className="w-3.5 h-3.5 text-stone-300" />}
                <span>{rule.active ? 'Active Policy' : 'Disabled'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
