import React, { useState, useEffect } from 'react';
import { FileText, Copy, Check, ExternalLink } from 'lucide-react';

export default function AuditReportsView() {
  const [selectedReport, setSelectedReport] = useState('final_test_results');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const reports = [
    { id: 'final_test_results', label: 'Single-Pass Test Results', file: 'final_test_results.md' },
    { id: 'data_audit', label: 'Dataset Audit Report', file: 'data_audit.md' },
    { id: 'leakage_audit', label: 'Leakage & Preprocessor Audit', file: 'leakage_audit.md' },
    { id: 'business_impact', label: 'Business Cost Impact', file: 'business_impact.md' },
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

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Selector */}
      <div className="saas-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-stone-700" />
              <h2 className="text-sm font-semibold text-stone-900">System Audit & Transparency Documentation</h2>
            </div>
            <p className="text-xs text-stone-500 mt-1 max-w-2xl">
              Authentic reports generated directly from frozen pipeline artifacts, unperturbed raw labels, and dataset integrity checks.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 border border-border text-xs font-medium text-stone-700 shadow-xs transition-colors self-start sm:self-auto"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-stone-400" />}
            <span>{copied ? 'Copied' : 'Copy Markdown'}</span>
          </button>
        </div>

        {/* Report Selector Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pt-2 border-t border-border">
          {reports.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedReport(r.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                selectedReport === r.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-surface-subtle text-stone-600 hover:text-stone-900 hover:bg-stone-100 border border-border'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Markdown Document Content */}
      <div className="saas-card p-5 sm:p-7">
        {loading ? (
          <div className="text-center py-16 text-stone-400 text-xs font-medium">
            Loading report content...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <pre className="p-5 rounded-lg bg-surface-subtle border border-border text-stone-800 font-mono text-xs whitespace-pre-wrap leading-relaxed">
              {content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
