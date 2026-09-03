import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Mount API routes
app.use('/api', apiRouter);

// Root greeting
app.get('/', (req, res) => {
  res.json({
    project: 'ReturnLens AI Return Risk Manager',
    edition: 'Razorpay Buildathon 2026 — Track 02',
    backend: 'Node.js Express Gateway',
    version: '1.0.0',
    documentation: '/api/health'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 [ReturnLens Server] Node.js Gateway running on http://localhost:${PORT}`);
});
