/**
 * API Key Validator Middleware
 *
 * Validates API key from headers for secure endpoint access
 */

const { APIError } = require('./errorHandler');

const validateApiKey = (req, res, next) => {
    // Skip validation in development if API_KEY not set
    if (process.env.NODE_ENV === 'development' && !process.env.API_KEY) {
        console.warn('⚠️  API Key validation disabled in development mode');
        return next();
    }

    // Get API key from header
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

    if (!apiKey) {
        return next(new APIError('API key is required', 401, {
            hint: 'Include X-API-Key header with your API key'
        }));
    }

    // Validate API key
    const validApiKey = process.env.API_KEY;
    if (apiKey !== validApiKey) {
        return next(new APIError('Invalid API key', 403));
    }

    // API key is valid
    next();
};

module.exports = validateApiKey;
