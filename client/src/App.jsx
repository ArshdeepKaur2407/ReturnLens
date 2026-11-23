import React, { useState } from 'react';
import Header from './components/Header';
import SimulatorView from './components/SimulatorView';
import BenchmarksView from './components/BenchmarksView';
import CalibrationCostView from './components/CalibrationCostView';
import LiveRadarView from './components/LiveRadarView';
import DefenseRulesView from './components/DefenseRulesView';
import AuditReportsView from './components/AuditReportsView';
import ApiExplorerView from './components/ApiExplorerView';

export default function App() {
  const [activeTab, setActiveTab] = useState('simulator');

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-stone-900 font-sans">
      {/* Navigation Header */}
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'simulator' && <SimulatorView />}
        {activeTab === 'benchmarks' && <BenchmarksView />}
        {activeTab === 'calibration' && <CalibrationCostView />}
        {activeTab === 'radar' && <LiveRadarView />}
        {activeTab === 'rules' && <DefenseRulesView />}
        {activeTab === 'audit' && <AuditReportsView />}
        {activeTab === 'api' && <ApiExplorerView />}
      </main>

      {/* Clean Light-Themed Footer */}
      <footer className="border-t border-border bg-white py-6 text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-stone-700">
            <span className="font-semibold text-stone-900">ReturnLens</span>
            <span className="text-stone-300">•</span>
            <span>E-Commerce Return Risk Prediction & Cost-Sensitive Decision Engine</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-stone-500">
            <span className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>Strict Anti-Leakage Audit</span>
            </span>
            <span className="text-stone-300">•</span>
            <span>Calibrated TreeSHAP</span>
            <span className="text-stone-300">•</span>
            <span className="font-mono text-stone-700 font-medium">τ* = 0.17 Threshold Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
