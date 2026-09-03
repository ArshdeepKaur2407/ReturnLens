import React from 'react';
import { Shield, Activity, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  const navTabs = [
    { id: 'radar', label: 'Live Risk Radar', icon: Activity },
    { id: 'simulator', label: 'Risk Simulator & SHAP', icon: Cpu },
    { id: 'benchmarks', label: '6-Model Benchmarks', icon: Shield },
    { id: 'calibration', label: 'Calibration & Cost Matrix', icon: Sparkles },
    { id: 'rules', label: 'Defense Policies', icon: CheckCircle2 },
    { id: 'audit', label: 'Audit & Reports', icon: Shield },
    { id: 'api', label: 'Developer API', icon: Cpu },
  ];

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-cyan-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl font-extrabold tracking-tight gradient-text">ReturnLens</h1>
                <span className="inline-flex items-center space-x-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700/60 shadow-sm shadow-cyan-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
                  <span>Autonomous AI Risk Sentinel</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">
                Autonomous Pre-Fulfillment RTO Defense & Serial Return Prevention • Calibrated TreeSHAP
              </p>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center space-x-3 text-xs overflow-x-auto pb-1 md:pb-0">
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center space-x-2">
              <span className="text-slate-400">RTO Interception</span>
              <span className="font-bold text-emerald-400">92.04%</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center space-x-2">
              <span className="text-slate-400">Loss Mitigated</span>
              <span className="font-bold text-cyan-400">-75.95%</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center space-x-2">
              <span className="text-slate-400">Decision SLA</span>
              <span className="font-bold text-purple-400">&lt;18ms</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-slate-300">Gateway :5050</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1.5 mt-4 overflow-x-auto pb-1">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`tab-btn flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap border ${
                  isActive
                    ? 'active bg-blue-600/20 border-cyan-500/50 text-white'
                    : 'bg-slate-900/40 border-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
