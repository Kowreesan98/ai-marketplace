require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const agentRoutes = require('./routes/agents');
const sessionRoutes = require('./routes/sessions');
const chatRoutes = require('./routes/chat');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/agents', agentRoutes);
app.use('/sessions', sessionRoutes);
app.use('/chat', chatRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 AI Marketplace Backend running on http://localhost:${PORT}`);
  console.log(`📦 Database: SQLite`);
  console.log(`🔐 JWT Auth: enabled`);
  console.log(`🤖 MiniMax API: ${process.env.MINIMAX_API_KEY ? 'configured' : 'NOT SET - add to .env'}\n`);
});
