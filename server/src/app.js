const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Import routes with debugging
console.log('🔍 Attempting to load food routes...');
const foodRoutes = require('../routes/food');
console.log('✅ Food routes loaded:', typeof foodRoutes);
console.log('🔍 Food routes methods:', Object.keys(foodRoutes));

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_URL] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting - adjusted for Codespaces
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP, please try again later.',
  trustProxy: true, // Trust proxy headers in Codespaces
  skip: (req) => {
    // Skip rate limiting for health checks and in development
    return req.path === '/health' || process.env.NODE_ENV === 'development';
  }
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Add middleware to log all requests
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.url}`);
  next();
});

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Genie Food Expiry Tracker API',
    version: '1.0.0'
  });
});

// Main API info route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Genie API is running!',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      status: '/api/status',
      food: {
        getAll: 'GET /api/food',
        create: 'POST /api/food',
        update: 'PUT /api/food/:id',
        delete: 'DELETE /api/food/:id',
        expiring: 'GET /api/food/expiring?days=7',
        expired: 'GET /api/food/expired'
      },
      auth: '/api/auth (coming soon)'
    }
  });
});

// API status endpoint for frontend
app.get('/api/status', (req, res) => {
  res.json({
    status: 'connected',
    timestamp: new Date().toISOString(),
    services: {
      database: 'in-memory storage active',
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not configured',
      aws: process.env.AWS_ACCESS_KEY_ID ? 'configured' : 'not configured'
    }
  });
});

// Use food routes with debugging
console.log('🔍 Mounting food routes at /api/food...');
app.use('/api/food', foodRoutes);
console.log('✅ Food routes mounted successfully');

// Add a direct test route to verify mounting works
app.get('/api/food-direct-test', (req, res) => {
  res.json({ message: 'Direct food test route works!', timestamp: new Date().toISOString() });
});

// Test routes for future development
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error occurred:', err.message);
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use('*', (req, res) => {
  console.log('🚫 404 - Route not found:', req.method, req.originalUrl);
  res.status(404).json({ 
    message: 'Route not found',
    requested: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /health',
      'GET /api',
      'GET /api/status', 
      'GET /api/test',
      'GET /api/food',
      'POST /api/food',
      'PUT /api/food/:id',
      'DELETE /api/food/:id',
      'GET /api/food/expiring',
      'GET /api/food/expired',
      'GET /api/food-direct-test'
    ]
  });
});

module.exports = app;