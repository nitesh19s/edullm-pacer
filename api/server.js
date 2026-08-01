/**
 * EduLLM Platform - REST API Server
 *
 * Main Express server providing REST API endpoints for:
 * - Experiment Management
 * - Research Features (Progression, Gaps, Cross-Subject Analytics)
 * - Vector Database Operations
 * - RAG Chat Interface
 * - Analytics & Reporting
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Import routes
const experimentsRoutes = require('./routes/experiments');
const researchRoutes = require('./routes/research');
const vectorRoutes = require('./routes/vector');
const ragRoutes = require('./routes/rag');
const analyticsRoutes = require('./routes/analytics');
const healthRoutes = require('./routes/health');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const validateApiKey = require('./middleware/apiKeyValidator');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;
const API_VERSION = 'v1';

// ==================== MIDDLEWARE ====================

// Security middleware
app.use(helmet({
    contentSecurityPolicy: false, // Allow frontend to load resources
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : ['http://localhost:8000', 'http://localhost:3000', 'http://127.0.0.1:8000', 'http://localhost:5500', 'http://localhost:8080', 'http://127.0.0.1:8080'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    credentials: true,
    maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// Custom request logger
app.use(requestLogger);

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.RATE_LIMIT || 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(`/api/${API_VERSION}`, limiter);

// ==================== ROUTES ====================

// Health check (no authentication required)
app.use('/health', healthRoutes);

// Serve frontend static files with no-cache headers
const path = require('path');
const FRONTEND_DIR = process.env.FRONTEND_DIR || path.resolve(__dirname, '../frontend');
app.use(express.static(FRONTEND_DIR, {
    etag: false,
    lastModified: false,
    setHeaders: (res) => {
        res.setHeader('Cache-Control', 'no-store');
    }
}));

// API documentation redirect (only hit if no static file matches)
app.get('/api', (req, res) => {
    res.json({
        name: 'EduLLM Platform API',
        version: API_VERSION,
        status: 'operational',
        documentation: `/api/${API_VERSION}/docs`,
        endpoints: {
            health: '/health',
            experiments: `/api/${API_VERSION}/experiments`,
            research: `/api/${API_VERSION}/research`,
            vector: `/api/${API_VERSION}/vector`,
            rag: `/api/${API_VERSION}/rag`,
            analytics: `/api/${API_VERSION}/analytics`
        }
    });
});

// API routes with authentication
app.use(`/api/${API_VERSION}/experiments`, validateApiKey, experimentsRoutes);
app.use(`/api/${API_VERSION}/research`, validateApiKey, researchRoutes);
app.use(`/api/${API_VERSION}/vector`, validateApiKey, vectorRoutes);
app.use(`/api/${API_VERSION}/rag`, validateApiKey, ragRoutes);
app.use(`/api/${API_VERSION}/analytics`, validateApiKey, analyticsRoutes);

// API Documentation (Swagger)
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use(`/api/${API_VERSION}/docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.path
    });
});

// Global error handler
app.use(errorHandler);

// ==================== SERVER STARTUP ====================

// Graceful shutdown handler
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🎓 EduLLM Platform API Server                              ║
║                                                               ║
║   Version: ${API_VERSION.padEnd(51)}║
║   Port: ${String(PORT).padEnd(54)}║
║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(46)}║
║                                                               ║
║   API Documentation: http://localhost:${PORT}/api/${API_VERSION}/docs        ║
║   Health Check: http://localhost:${PORT}/health                   ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
    `);
});

// Handle server errors
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        process.exit(1);
    } else {
        console.error('❌ Server error:', error);
        process.exit(1);
    }
});

module.exports = app;
