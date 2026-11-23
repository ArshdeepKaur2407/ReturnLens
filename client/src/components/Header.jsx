import React from 'react';
import { SlidersHorizontal, BarChart2, Scale, Radio, ShieldCheck, FileText, Code2, ArrowUpRight } from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  const navTabs = [
    { id: 'simulator', label: 'Order Simulator & SHAP', icon: SlidersHorizontal },
    { id: 'benchmarks', label: 'Model Benchmarks', icon: BarChart2 },
    { id: 'calibration', label: 'Calibration & Cost Matrix', icon: Scale },
    { id: 'radar', label: 'Transaction Stream', icon: Radio },
    { id: 'rules', label: 'Intervention Policies', icon: ShieldCheck },
    { id: 'audit', label: 'Audit Reports', icon: FileText },
    { id: 'api', label: 'API Reference', icon: Code2 },
  ];

  return (
    <header className="border-b border-border bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Brand & Metadata Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3.5 gap-3 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            {/* Minimal Brand Monogram */}
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
              RL
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-base text-stone-900 tracking-tight">ReturnLens</span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                  Decision Engine
                </span>
                <span className="hidden md:inline-flex text-[11px] font-mono text-stone-500">
                  τ* = 0.17
                </span>
              </div>
              <p className="text-[11px] text-stone-500 hidden sm:block">
                E-Commerce Return Risk Prediction & Cost-Sensitive Decision Optimization
              </p>
            </div>
          </div>

          {/* Sourced Metrics Chips */}
          <div className="flex items-center space-x-2 text-xs overflow-x-auto pb-1 sm:pb-0">
            <div className="px-2.5 py-1 rounded-md bg-stone-50 border border-stone-200 flex items-center space-x-1.5 whitespace-nowrap">
              <span className="text-stone-500 text-[11px]">Test ROC-AUC</span>
              <span className="font-mono font-semibold text-stone-900 text-xs">81.19%</span>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-stone-50 border border-stone-200 flex items-center space-x-1.5 whitespace-nowrap">
              <span className="text-stone-500 text-[11px]">Test PR-AUC</span>
              <span className="font-mono font-semibold text-stone-900 text-xs">84.18%</span>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-sage-50 border border-sage-200 flex items-center space-x-1.5 whitespace-nowrap">
              <span className="text-sage-700 text-[11px]">Cutoff</span>
              <span className="font-mono font-semibold text-sage-900 text-xs">0.17</span>
            </div>
            <div className="px-2.5 py-1 rounded-md bg-stone-50 border border-stone-200 flex items-center space-x-1.5 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span className="font-medium text-stone-700 text-[11px]">FastAPI Ready</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center space-x-1 py-2 overflow-x-auto no-scrollbar">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-stone-900 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
