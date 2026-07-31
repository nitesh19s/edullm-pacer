/**
 * Request Logger Middleware
 *
 * Logs all incoming requests with timing information
 */

const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Log request
    const requestInfo = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
    };

    // Log when response finishes
    res.on('finish', () => {
        const duration = Date.now() - start;
        const logEntry = {
            ...requestInfo,
            statusCode: res.statusCode,
            duration: `${duration}ms`
        };

        // Color code by status
        const statusColor = res.statusCode >= 500 ? '\x1b[31m' : // Red for 5xx
                           res.statusCode >= 400 ? '\x1b[33m' : // Yellow for 4xx
                           res.statusCode >= 300 ? '\x1b[36m' : // Cyan for 3xx
                           '\x1b[32m'; // Green for 2xx

        const reset = '\x1b[0m';

        if (process.env.NODE_ENV !== 'production') {
            console.log(
                `${statusColor}${req.method}${reset} ${req.path} - ${statusColor}${res.statusCode}${reset} - ${duration}ms`
            );
        }
    });

    next();
};

module.exports = requestLogger;
