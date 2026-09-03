import React, { useState, useEffect } from 'react';
import { FileText, Download, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AuditReportsView() {
  const [selectedReport, setSelectedReport] = useState('final_test_results');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const reports = [
    { id: 'final_test_results', label: 'Single-Pass Test Results', file: 'final_test_results.md' },
    { id: 'data_audit', label: 'Dataset Audit Report', file: 'data_audit.md' },
    { id: 'leakage_audit', label: 'Anti-Leakage Audit', file: 'leakage_audit.md' },
    { id: 'business_impact', label: 'Business ROI & Losses', file: 'business_impact.md' },
  ];

  useEffect(() => {
    async function loadReport() {
      setLoading(true);
      try {
        const res = await fetch(`/api/reports/${selectedReport}`);
        const data = await res.json();
        setContent(data.markdown || 'Report content not found.');
      } catch (err) {
        setContent('Error loading report.');
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [selectedReport]);

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">System Audit & Transparency Documentation</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official reports generated directly from frozen pipeline artifacts and raw dataset audits.
          </p>
        </div>

        {/* Report Selector Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1">
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap border transition ${
                selectedReport === r.id
                  ? 'bg-blue-600/30 border-cyan-500/60 text-white shadow-md'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Markdown Document Container */}
      <div className="glass-panel p-8 border-slate-800">
        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs animate-pulse">Loading report document...</div>
        ) : (
          <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-4">
            <pre className="p-6 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono text-xs whitespace-pre-wrap overflow-x-auto">
              {content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
