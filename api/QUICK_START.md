# EduLLM Backend API - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env file
nano .env
```

Set your API key:
```env
API_KEY=your-secure-api-key-123
```

### Step 3: Start the Server

```bash
npm run dev
```

You should see:
```
╔═══════════════════════════════════════════════════════════════╗
║   🎓 EduLLM Platform API Server                              ║
║   Version: v1                                                 ║
║   Port: 3000                                                  ║
║   Environment: development                                    ║
║   API Documentation: http://localhost:3000/api/v1/docs        ║
║   Health Check: http://localhost:3000/health                  ║
╚═══════════════════════════════════════════════════════════════╝
```

### Step 4: Test the API

Open your browser and visit:
- **API Docs**: http://localhost:3000/api/v1/docs
- **Health Check**: http://localhost:3000/health

## 📝 Try Your First API Call

### Using curl:

```bash
# Create an experiment
curl -X POST http://localhost:3000/api/v1/experiments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-secure-api-key-123" \
  -d '{
    "name": "My First Experiment",
    "description": "Testing the API",
    "configuration": {
      "provider": "openai",
      "model": "gpt-3.5-turbo",
      "temperature": 0.7
    }
  }'
```

### Using JavaScript (fetch):

```javascript
const response = await fetch('http://localhost:3000/api/v1/experiments', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-secure-api-key-123'
  },
  body: JSON.stringify({
    name: 'My First Experiment',
    description: 'Testing the API',
    configuration: {
      provider: 'openai',
      model: 'gpt-3.5-turbo',
      temperature: 0.7
    }
  })
});

const data = await response.json();
console.log(data);
```

## 🎯 Common Use Cases

### 1. Track Student Learning

```bash
curl -X POST http://localhost:3000/api/v1/research/progression/track \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "studentId": "student_001",
    "conceptId": "math_001",
    "conceptName": "Quadratic Equations",
    "subject": "Mathematics",
    "success": true,
    "confidence": 0.85
  }'
```

### 2. Chat with RAG

```bash
curl -X POST http://localhost:3000/api/v1/rag/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "message": "Explain photosynthesis",
    "context": {
      "subject": "Biology",
      "grade": 10
    }
  }'
```

### 3. Analyze Curriculum Gaps

```bash
curl -X POST http://localhost:3000/api/v1/research/gaps/analyze \
  -H "Content-Type: application/json" \
  -H "X-API-Key": "your-api-key" \
  -d '{
    "studentId": "student_001",
    "targetGrade": 10,
    "targetSubject": "Mathematics"
  }'
```

### 4. Generate Analytics Report

```bash
curl -X POST http://localhost:3000/api/v1/analytics/reports/generate \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "type": "summary"
  }'
```

## 🐳 Docker Quick Start

### Build and Run with Docker

```bash
# Build image
docker build -t edullm-api .

# Run container
docker run -p 3000:3000 \
  -e API_KEY=your-api-key \
  -e NODE_ENV=development \
  edullm-api
```

### Using Docker Compose

```bash
# Start API server only
docker-compose up

# Start with ChromaDB
docker-compose --profile with-chromadb up
```

## 🔧 Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000
lsof -i :3000
kill -9 <PID>

# Or use a different port
PORT=3001 npm run dev
```

### Authentication Errors

If you see "API key is required":
1. Check you're sending the `X-API-Key` header
2. Verify the API key matches your `.env` file
3. In development without `.env`, authentication is bypassed (warning shown)

### CORS Errors

Add your frontend origin to `.env`:
```env
ALLOWED_ORIGINS=http://localhost:8000,http://localhost:3000
```

## 📚 Next Steps

1. **Explore API Documentation**: Visit http://localhost:3000/api/v1/docs
2. **Try All Endpoints**: Use the interactive Swagger UI
3. **Integrate with Frontend**: Connect your EduLLM frontend
4. **Add Real Database**: Replace in-memory storage with PostgreSQL/MongoDB
5. **Deploy to Production**: Follow deployment guide in README.md

## 💡 Tips

- Use Swagger UI for interactive testing
- Check `/health/detailed` for system information
- Monitor logs in console for debugging
- Rate limit is 100 requests/15min by default
- All endpoints except `/health` require API key

## 🎓 Example Workflow

```bash
# 1. Create an experiment
EXPERIMENT_ID=$(curl -X POST http://localhost:3000/api/v1/experiments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"name":"Test","description":"API Test","configuration":{"provider":"openai","model":"gpt-3.5-turbo"}}' \
  | jq -r '.data.id')

# 2. Create an experiment run
curl -X POST http://localhost:3000/api/v1/experiments/$EXPERIMENT_ID/runs \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"testCases":[{"input":"test","expected":"result"}]}'

# 3. Get experiment stats
curl http://localhost:3000/api/v1/experiments/$EXPERIMENT_ID/stats \
  -H "X-API-Key: your-api-key"
```

## 📞 Support

- **Documentation**: http://localhost:3000/api/v1/docs
- **Health Check**: http://localhost:3000/health
- **GitHub Issues**: Report bugs and feature requests

Happy coding! 🚀
