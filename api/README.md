# EduLLM Platform REST API

A comprehensive REST API backend for the EduLLM Research Platform, providing endpoints for experiment management, research analytics, vector operations, and RAG chat functionality.

## Features

- ✅ **Experiment Management** - CRUD operations for LLM experiments
- ✅ **Research Analytics** - Progression tracking, curriculum gaps, cross-subject analysis
- ✅ **Vector Database** - Document storage and similarity search
- ✅ **RAG Chat** - Retrieval-augmented generation chat interface
- ✅ **Analytics & Reporting** - Comprehensive analytics, baseline comparisons, A/B testing
- ✅ **API Documentation** - Interactive Swagger/OpenAPI documentation
- ✅ **Security** - API key authentication, rate limiting, CORS, helmet
- ✅ **Health Checks** - Kubernetes/Docker ready health endpoints

## Quick Start

### Installation

```bash
cd backend
npm install
```

### Configuration

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
NODE_ENV=development
PORT=3000
API_KEY=your-secure-api-key-here
ALLOWED_ORIGINS=http://localhost:8000
```

### Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start at `http://localhost:3000`

### API Documentation

Once the server is running, access interactive API documentation at:
```
http://localhost:3000/api/v1/docs
```

## API Endpoints Overview

### Health Check
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system information
- `GET /health/ready` - Kubernetes readiness probe
- `GET /health/live` - Kubernetes liveness probe

### Experiments (`/api/v1/experiments`)
- `GET /experiments` - List all experiments
- `POST /experiments` - Create new experiment
- `GET /experiments/:id` - Get experiment details
- `PUT /experiments/:id` - Update experiment
- `DELETE /experiments/:id` - Delete experiment
- `POST /experiments/:id/runs` - Create experiment run
- `GET /experiments/:id/runs` - Get experiment runs
- `GET /experiments/:id/stats` - Get experiment statistics

### Research Features (`/api/v1/research`)

**Progression Tracking:**
- `POST /research/progression/track` - Track learning interaction
- `GET /research/progression/:studentId` - Get progression data
- `GET /research/progression/:studentId/analytics` - Get analytics

**Curriculum Gaps:**
- `POST /research/gaps/analyze` - Analyze curriculum gaps
- `GET /research/gaps/:studentId` - Get gap analysis history

**Cross-Subject Analytics:**
- `POST /research/cross-subject/analyze` - Analyze cross-subject performance
- `GET /research/cross-subject/:studentId` - Get analysis history

**General:**
- `GET /research/students` - List all students

### Vector Database (`/api/v1/vector`)
- `GET /vector/collections` - List all collections
- `POST /vector/collections` - Create collection
- `DELETE /vector/collections/:id` - Delete collection
- `POST /vector/collections/:id/documents` - Add documents
- `GET /vector/collections/:id/documents` - Get documents
- `POST /vector/collections/:id/query` - Query for similar documents
- `GET /vector/stats` - Get statistics

### RAG Chat (`/api/v1/rag`)
- `POST /rag/chat` - Send chat message
- `GET /rag/sessions` - List all sessions
- `GET /rag/sessions/:sessionId` - Get session history
- `DELETE /rag/sessions/:sessionId` - Delete session
- `POST /rag/retrieve` - Retrieve context without LLM
- `GET /rag/stats` - Get usage statistics

### Analytics (`/api/v1/analytics`)

**Reports:**
- `GET /analytics/reports` - List all reports
- `POST /analytics/reports/generate` - Generate report
- `GET /analytics/reports/:id` - Get report details

**Baseline Comparisons:**
- `POST /analytics/baseline/create` - Create baseline
- `POST /analytics/baseline/compare` - Compare to baseline
- `GET /analytics/baseline` - List all baselines

**A/B Testing:**
- `POST /analytics/ab-tests` - Create A/B test
- `GET /analytics/ab-tests` - List all tests
- `GET /analytics/ab-tests/:id` - Get test details
- `POST /analytics/ab-tests/:id/run` - Run test

**Dashboard:**
- `GET /analytics/dashboard` - Get dashboard summary

## Authentication

All API endpoints (except `/health`) require an API key.

### Using API Key

Include the API key in the request header:

```bash
curl -H "X-API-Key: your-api-key-here" \
  http://localhost:3000/api/v1/experiments
```

Or using the Authorization header:

```bash
curl -H "Authorization: Bearer your-api-key-here" \
  http://localhost:3000/api/v1/experiments
```

### Development Mode

In development mode without an `API_KEY` set in `.env`, authentication is bypassed with a warning.

## Example Usage

### 1. Create an Experiment

```bash
curl -X POST http://localhost:3000/api/v1/experiments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "GPT-4 RAG Test",
    "description": "Testing GPT-4 with RAG pipeline",
    "configuration": {
      "provider": "openai",
      "model": "gpt-4",
      "temperature": 0.7,
      "maxTokens": 1000
    }
  }'
```

### 2. Track Learning Interaction

```bash
curl -X POST http://localhost:3000/api/v1/research/progression/track \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "studentId": "student_001",
    "conceptId": "algebra_001",
    "conceptName": "Linear Equations",
    "subject": "Mathematics",
    "grade": 10,
    "difficulty": 5,
    "success": true,
    "responseTime": 1200,
    "confidence": 0.85
  }'
```

### 3. Query Vector Database

```bash
curl -X POST http://localhost:3000/api/v1/vector/collections/collection-id/query \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "query": "quadratic equations",
    "topK": 5
  }'
```

### 4. Chat with RAG

```bash
curl -X POST http://localhost:3000/api/v1/rag/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "message": "Explain quadratic equations",
    "context": {
      "subject": "Mathematics",
      "grade": 10,
      "topic": "Algebra"
    }
  }'
```

### 5. Generate Analytics Report

```bash
curl -X POST http://localhost:3000/api/v1/analytics/reports/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "type": "summary"
  }'
```

## Response Format

All API responses follow a consistent format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "details": { ... }
  }
}
```

## Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid API key
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## Rate Limiting

Default rate limits:
- 100 requests per 15 minutes per IP
- Configurable via `RATE_LIMIT` environment variable

Rate limit headers are included in responses:
```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 1640000000
```

## CORS Configuration

Configure allowed origins in `.env`:

```env
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000,https://yourdomain.com
```

## Security Features

- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Prevent abuse
- **API Key Authentication** - Secure access control
- **Request Validation** - Joi schema validation
- **Error Handling** - Safe error responses

## Production Deployment

### Environment Variables

Set these in production:

```env
NODE_ENV=production
PORT=3000
API_KEY=your-production-api-key
JWT_SECRET=your-jwt-secret
ALLOWED_ORIGINS=https://yourdomain.com
RATE_LIMIT=1000
```

### Docker Deployment

```bash
# Build image
docker build -t edullm-api .

# Run container
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e API_KEY=your-api-key \
  edullm-api
```

### Kubernetes Deployment

Use the health endpoints for probes:

```yaml
livenessProbe:
  httpGet:
    path: /health/live
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

## Monitoring

Access detailed health information:

```bash
curl http://localhost:3000/health/detailed
```

Returns:
- System information (CPU, memory, load average)
- Process metrics
- Feature flags
- Uptime

## Development

### Project Structure

```
backend/
├── server.js           # Express server setup
├── package.json        # Dependencies
├── .env.example        # Environment template
├── routes/             # API route handlers
│   ├── health.js       # Health check endpoints
│   ├── experiments.js  # Experiment management
│   ├── research.js     # Research features
│   ├── vector.js       # Vector database
│   ├── rag.js          # RAG chat
│   └── analytics.js    # Analytics & reporting
├── middleware/         # Express middleware
│   ├── errorHandler.js # Global error handler
│   ├── requestLogger.js # Request logging
│   └── apiKeyValidator.js # Authentication
└── config/             # Configuration files
    └── swagger.js      # Swagger/OpenAPI spec
```

### Adding New Endpoints

1. Create route file in `routes/`
2. Import in `server.js`
3. Add route with `app.use()`
4. Add Swagger/JSDoc comments
5. Test endpoint

Example:

```javascript
/**
 * @swagger
 * /api/v1/custom:
 *   get:
 *     summary: Custom endpoint
 *     tags: [Custom]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/custom', (req, res) => {
    res.json({ success: true, data: 'Custom response' });
});
```

## Testing

Run tests:

```bash
npm test
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### API Key Issues

- Ensure `X-API-Key` header is included
- Check `.env` file has `API_KEY` set
- In development, authentication can be disabled (warning shown)

### CORS Errors

- Add your origin to `ALLOWED_ORIGINS` in `.env`
- Ensure frontend sends correct headers

## Support

For issues or questions:
- Check Swagger docs: `http://localhost:3000/api/v1/docs`
- Review logs in console
- Check health endpoint: `http://localhost:3000/health/detailed`

## License

MIT
