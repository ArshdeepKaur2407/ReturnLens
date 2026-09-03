import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../../');

export const dataService = {
  getBenchmarks() {
    try {
      const csvPath = path.join(PROJECT_ROOT, 'reports', 'model_benchmarks.csv');
      if (!fs.existsSync(csvPath)) return [];
      const content = fs.readFileSync(csvPath, 'utf8');
      const lines = content.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const row = {};
        headers.forEach((h, i) => {
          const val = values[i];
          row[h] = isNaN(Number(val)) ? val : Number(val);
        });
        return row;
      });
    } catch (err) {
      console.error('Error reading benchmarks:', err);
      return [];
    }
  },

  getThresholdConfig() {
    try {
      const jsonPath = path.join(PROJECT_ROOT, 'models', 'threshold.json');
      if (fs.existsSync(jsonPath)) {
        return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      }
      return {
        threshold: 0.19,
        optimal_threshold: 0.19,
        fp_cost: 5.0,
        fn_cost: 25.0,
        selection_set: "validation"
      };
    } catch (err) {
      console.error('Error reading threshold config:', err);
      return { threshold: 0.19, fp_cost: 5.0, fn_cost: 25.0 };
    }
  },

  getTestMetrics() {
    try {
      const jsonPath = path.join(PROJECT_ROOT, 'reports', 'test_evaluation_metrics.json');
      if (fs.existsSync(jsonPath)) {
        return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
      }
      return null;
    } catch (err) {
      console.error('Error reading test metrics:', err);
      return null;
    }
  },

  getReportContent(reportName) {
    const safeMap = {
      'data_audit': 'data_audit.md',
      'leakage_audit': 'leakage_audit.md',
      'final_test_results': 'final_test_results.md',
      'business_impact': 'business_impact.md'
    };
    const fileName = safeMap[reportName];
    if (!fileName) return null;
    
    const filePath = path.join(PROJECT_ROOT, 'reports', fileName);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return null;
  },

  getCalibrationBins() {
    return [
      { bin: "0.00 - 0.10", mean_pred: 0.0428, empirical_rate: 0.0421, count: 8392 },
      { bin: "0.10 - 0.20", mean_pred: 0.1424, empirical_rate: 0.1454, count: 3198 },
      { bin: "0.20 - 0.30", mean_pred: 0.2468, empirical_rate: 0.2512, count: 2170 },
      { bin: "0.30 - 0.40", mean_pred: 0.3500, empirical_rate: 0.3616, count: 2110 },
      { bin: "0.40 - 0.50", mean_pred: 0.4533, empirical_rate: 0.4571, count: 2446 },
      { bin: "0.50 - 0.60", mean_pred: 0.5520, empirical_rate: 0.5464, count: 7960 },
      { bin: "0.60 - 0.70", mean_pred: 0.6506, empirical_rate: 0.6553, count: 2411 },
      { bin: "0.70 - 0.80", mean_pred: 0.7512, empirical_rate: 0.7516, count: 2886 },
      { bin: "0.80 - 0.90", mean_pred: 0.8562, empirical_rate: 0.8541, count: 3345 },
      { bin: "0.90 - 1.00", mean_pred: 0.9690, empirical_rate: 0.9686, count: 15082 }
    ];
  }
};
