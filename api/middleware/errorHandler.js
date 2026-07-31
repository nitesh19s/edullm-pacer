/**
 * Global Error Handler Middleware
 *
 * Catches and formats all errors in a consistent JSON structure
 */

class APIError extends Error {
    constructor(message, statusCode = 500, details = null) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    // Default error values
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    let details = err.details || null;

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation Error';
        details = err.details || err.message;
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
    } else if (err.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Forbidden';
    } else if (err.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Resource Not Found';
    }

    // Log error (in production, use proper logging service)
    if (process.env.NODE_ENV === 'production') {
        console.error('[ERROR]', {
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method,
            statusCode,
            message,
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        });
    } else {
        console.error('Error:', err);
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        error: {
            message,
            statusCode,
            ...(details && { details }),
            ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
        }
    });
};

module.exports = errorHandler;
module.exports.APIError = APIError;
