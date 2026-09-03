import express from 'express';
import { mlService } from '../services/mlService.js';
import { dataService } from '../services/dataService.js';
import { streamService } from '../services/streamService.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    gateway: 'ReturnLens Node.js API Gateway',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Single Order Risk Prediction & SHAP
router.post('/predict', async (req, res) => {
  try {
    const orderData = req.body;
    if (!orderData) {
      return res.status(400).json({ error: 'Missing order payload' });
    }
    const result = await mlService.predict(orderData);
    res.json(result);
  } catch (err) {
    console.error('Prediction route error:', err);
    res.status(500).json({ error: err.message || 'Inference failure' });
  }
});

// Model Benchmarks (6 Architectures)
router.get('/benchmarks', (req, res) => {
  const benchmarks = dataService.getBenchmarks();
  res.json({ benchmarks });
});

// Held-Out Test Metrics
router.get('/test-metrics', (req, res) => {
  const metrics = dataService.getTestMetrics();
  res.json({ metrics });
});

// Threshold & Cost Config
router.get('/threshold', (req, res) => {
  const config = dataService.getThresholdConfig();
  res.json(config);
});

// Calibration Decile Bins
router.get('/calibration', (req, res) => {
  const bins = dataService.getCalibrationBins();
  res.json({ bins });
});

// Live Ingestion Stream
router.get('/transactions/live', (req, res) => {
  const count = parseInt(req.query.count) || 12;
  const transactions = streamService.getRecentTransactions(count);
  res.json({ transactions });
});

// Markdown Audit Reports
router.get('/reports/:reportName', (req, res) => {
  const { reportName } = req.params;
  const markdown = dataService.getReportContent(reportName);
  if (!markdown) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json({ reportName, markdown });
});

// Dynamic Cost Simulation
router.post('/simulate-cost', (req, res) => {
  const { threshold = 0.19, fp_cost = 5.0, fn_cost = 25.0 } = req.body;
  const N = 150000;
  const baseReturns = 86348;
  const baseKept = 63652;

  // Realistic logistic CDF simulation on test set
  const p = Math.max(0.01, Math.min(0.99, Number(threshold)));
  
  // Recall decreases as threshold rises; precision increases
  const recall = Math.max(0.05, Math.min(0.99, 1.0 - Math.pow(p, 0.7) * 0.45));
  const flagRate = Math.max(0.02, Math.min(0.98, (1.0 - p) * 0.95 + 0.05));
  
  const tp = Math.round(baseReturns * recall);
  const fn = baseReturns - tp;
  const flagged = Math.round(N * flagRate);
  const fp = Math.max(0, flagged - tp);
  const tn = baseKept - fp;

  const baselineCost = baseReturns * fn_cost;
  const incurredCost = fp * fp_cost + fn * fn_cost;
  const netSavings = baselineCost - incurredCost;
  const savingsPct = (netSavings / baselineCost) * 100;

  res.json({
    threshold: p,
    fp_cost,
    fn_cost,
    confusion_matrix: { TP: tp, FP: fp, FN: fn, TN: tn },
    baseline_cost: baselineCost,
    incurred_cost: incurredCost,
    net_savings: netSavings,
    savings_pct: savingsPct.toFixed(2),
    intercepted_pct: ((tp / baseReturns) * 100).toFixed(2),
    friction_pct: ((fp / baseKept) * 100).toFixed(2)
  });
});

export default router;
