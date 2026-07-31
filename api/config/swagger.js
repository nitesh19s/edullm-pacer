/**
 * Swagger/OpenAPI Configuration
 *
 * API documentation specification
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'EduLLM Platform API',
            version: '1.0.0',
            description: 'REST API for EduLLM Research Platform - Educational LLM experimentation and analytics',
            contact: {
                name: 'API Support',
                email: 'support@edullm.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1',
                description: 'Development server'
            },
            {
                url: 'https://api.edullm.com/v1',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'API key for authentication'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'object',
                            properties: {
                                message: { type: 'string' },
                                statusCode: { type: 'integer' },
                                details: { type: 'object' }
                            }
                        }
                    }
                },
                Experiment: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        status: { type: 'string', enum: ['pending', 'running', 'completed', 'failed'] },
                        configuration: { type: 'object' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' }
                    }
                },
                ProgressionData: {
                    type: 'object',
                    properties: {
                        studentId: { type: 'string' },
                        interactions: { type: 'array' },
                        conceptMastery: { type: 'object' },
                        metrics: { type: 'object' }
                    }
                }
            }
        },
        security: [
            {
                ApiKeyAuth: []
            }
        ],
        tags: [
            {
                name: 'Health',
                description: 'Health check endpoints'
            },
            {
                name: 'Experiments',
                description: 'Experiment management endpoints'
            },
            {
                name: 'Research',
                description: 'Research features endpoints (progression, gaps, cross-subject)'
            },
            {
                name: 'Vector',
                description: 'Vector database operations'
            },
            {
                name: 'RAG',
                description: 'RAG chat endpoints'
            },
            {
                name: 'Analytics',
                description: 'Analytics and reporting endpoints'
            }
        ]
    },
    apis: ['./routes/*.js'] // Path to route files with JSDoc comments
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
