import React, { useState } from 'react';
import Header from './components/Header';
import LiveRadarView from './components/LiveRadarView';
import SimulatorView from './components/SimulatorView';
import BenchmarksView from './components/BenchmarksView';
import CalibrationCostView from './components/CalibrationCostView';
import DefenseRulesView from './components/DefenseRulesView';
import AuditReportsView from './components/AuditReportsView';
import ApiExplorerView from './components/ApiExplorerView';

export default function App() {
  const [activeTab, setActiveTab] = useState('simulator');

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      {/* Navigation Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'radar' && <LiveRadarView />}
        {activeTab === 'simulator' && <SimulatorView />}
        {activeTab === 'benchmarks' && <BenchmarksView />}
        {activeTab === 'calibration' && <CalibrationCostView />}
        {activeTab === 'rules' && <DefenseRulesView />}
        {activeTab === 'audit' && <AuditReportsView />}
        {activeTab === 'api' && <ApiExplorerView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-400 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="font-semibold text-white">ReturnLens</span>
            <span className="text-slate-600">•</span>
            <span>Enterprise Return & RTO Defense Suite • Autonomous Loss Prevention</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px] text-slate-500">
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Zero Data Leakage Audited</span>
            </span>
            <span>•</span>
            <span>Calibrated TreeSHAP Inference</span>
            <span>•</span>
            <span className="text-cyan-400 font-medium">Defense-Only Merchant Protection</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
