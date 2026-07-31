/**
 * Health Check Routes
 *
 * Endpoints for monitoring API health and status
 */

const express = require('express');
const router  = express.Router();
const os      = require('os');
const ollama  = require('../services/ollama');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 */
router.get('/', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check with system info
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: Detailed health information
 */
router.get('/detailed', (req, res) => {
    const memoryUsage = process.memoryUsage();

    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        system: {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            loadAverage: os.loadavg()
        },
        process: {
            nodeVersion: process.version,
            pid: process.pid,
            memory: {
                rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`
            }
        },
        environment: {
            nodeEnv: process.env.NODE_ENV || 'development',
            analyticsEnabled: process.env.ENABLE_ANALYTICS === 'true',
            experimentsEnabled: process.env.ENABLE_EXPERIMENTS === 'true',
            researchFeaturesEnabled: process.env.ENABLE_RESEARCH_FEATURES === 'true'
        }
    });
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness check (for Kubernetes/Docker)
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is ready to accept requests
 *       503:
 *         description: API is not ready
 */
router.get('/ready', async (req, res) => {
    const ollamaUp = await ollama.isAvailable();

    const checks = {
        server: true,
        ollama: ollamaUp
    };

    const isReady = Object.values(checks).every(Boolean);

    res.status(isReady ? 200 : 503).json({
        status:    isReady ? 'ready' : 'not ready',
        checks,
        timestamp: new Date().toISOString()
    });
});

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness check (for Kubernetes/Docker)
 *     tags: [Health]
 *     security: []
 *     responses:
 *       200:
 *         description: API is alive
 */
router.get('/live', (req, res) => {
    res.json({
        status: 'alive',
        timestamp: new Date().toISOString()
    });
});

module.exports = router;
