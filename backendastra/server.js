const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// Import database connection
const { connectToAstra, getDB } = require('./config/database'); // Add this line

// Import routes
const authRoutes = require('./routes/auth');
const progressRoutes = require('./routes/progress');
const announcementRoutes = require('./routes/announcements');
const sheetRoutes = require('./routes/sheets');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Security headers
app.use((req, res, next) => {
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  next();
});

// Debug middleware to log ALL requests
app.use('*', (req, res, next) => {
  // console.log(`📨 ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
  next();
});

// FIXED: Routes - All under /api prefix to match frontend
app.use('/api/auth', authRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/sheets', sheetRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Server is running properly'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'API routes are working',
    availableEndpoints: {
      auth: [
        'POST /api/auth/google/verify',
        'GET /api/auth/user', 
        'POST /api/auth/logout',
        'GET /api/auth/health'
      ],
      announcements: [
        'GET /api/announcements',
        'POST /api/announcements',
        'PUT /api/announcements/:id',
        'DELETE /api/announcements/:id'
      ],
      sheets: [
        'GET /api/sheets',
        'POST /api/sheets'
      ],
      progress: [
        'GET /api/progress/:userId',
        'POST /api/progress/toggle'
      ],
      admin: [
        'GET /api/admin/users'
      ]
    }
  });
});

// Test database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const db = getDB(); // Use the connected DB instance
    const collections = await db.listCollections();
    
    res.json({
      success: true,
      message: 'Database connection successful',
      collections: collections.map(c => c.name)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// 404 handler - MUST be after all routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    hint: 'Available endpoints at /api/health'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error handler:', err);
  
  const error = process.env.NODE_ENV === 'production' 
    ? { message: err.message }
    : { message: err.message, stack: err.stack };
    
  res.status(err.status || 500).json({ 
    success: false, 
    message: 'Internal server error',
    error
  });
});

// FIXED: Start server AFTER database connection
const startServer = async () => {
  try {
    // Connect to Astra DB first and create collections
    console.log('🔗 Connecting to Astra DB...');
    await connectToAstra();
    
    // Then start the server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 Client URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`📊 Database: Connected to Astra DB with collections ready`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;
