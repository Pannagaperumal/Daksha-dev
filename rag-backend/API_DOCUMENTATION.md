# API Documentation

## Overview

The AI PDF Chatbot API is built on LangGraph and provides endpoints for document ingestion and retrieval-based question answering. The API follows RESTful principles and supports real-time streaming through Server-Sent Events (SSE).

## Base URL

```
Development: http://localhost:2024
Production: https://api.yourdomain.com
```

## Authentication

The API supports two authentication methods:

1. **API Key Authentication**
   ```bash
   curl -H "X-API-Key: your-api-key" http://localhost:2024/threads
   ```

2. **Bearer Token Authentication**
   ```bash
   curl -H "Authorization: Bearer your-jwt-token" http://localhost:2024/threads
   ```

## Core Concepts

### Threads

Threads maintain conversation context across multiple interactions. Each thread has a unique ID and can store multiple messages and state information.

### Graphs

The system uses two main graphs:

1. **Ingestion Graph** (`ingestion_graph`): Processes and indexes documents
2. **Retrieval Graph** (`retrieval_graph`): Answers questions based on indexed documents

### Runs

A run represents a single execution of a graph within a thread context.

## API Endpoints

### Thread Management

#### Create Thread

```http
POST /threads
```

**Request Body:**
```json
{
  "metadata": {
    "user": "john_doe",
    "session": "session-123"
  }
}
```

**Response:**
```json
{
  "thread_id": "thread_abc123",
  "created_at": "2024-01-15T10:30:00Z",
  "metadata": {
    "user": "john_doe",
    "session": "session-123"
  }
}
```

#### List Threads

```http
GET /threads?limit=100&offset=0
```

#### Get Thread

```http
GET /threads/{threadId}
```

#### Delete Thread

```http
DELETE /threads/{threadId}
```

### Document Ingestion

#### Ingest Documents

```http
POST /threads/{threadId}/runs
```

**Request Body:**
```json
{
  "assistant_id": "ingestion_graph",
  "input": {
    "docs": [
      {
        "pageContent": "This is the document content...",
        "metadata": {
          "source": "document.pdf",
          "page": 1,
          "title": "Sample Document"
        }
      }
    ]
  },
  "config": {
    "configurable": {
      "retriever_provider": "supabase",
      "model_provider": "openai"
    }
  }
}
```

**Response:**
```json
{
  "run_id": "run_xyz789",
  "thread_id": "thread_abc123",
  "status": "completed",
  "result": {
    "documents_indexed": 5,
    "chunks_created": 25,
    "embedding_model": "text-embedding-ada-002",
    "vector_store": "supabase"
  }
}
```

### Question Answering

#### Ask a Question

```http
POST /threads/{threadId}/runs
```

**Request Body:**
```json
{
  "assistant_id": "retrieval_graph",
  "input": {
    "query": "What is the main topic of the document?"
  },
  "config": {
    "configurable": {
      "model_provider": "openai",
      "model_name": "gpt-4-turbo-preview",
      "temperature": 0.7,
      "k": 4
    }
  },
  "stream_mode": ["messages", "updates"]
}
```

**Streaming Response (SSE):**
```
data: {"type": "message", "content": "Based on the documents..."}

data: {"type": "sources", "sources": [...]}

data: {"type": "complete", "answer": "..."}
```

### State Management

#### Get Thread State

```http
GET /threads/{threadId}/state
```

**Response:**
```json
{
  "thread_id": "thread_abc123",
  "messages": [
    {
      "id": "msg_1",
      "type": "human",
      "content": "What is machine learning?",
      "timestamp": "2024-01-15T10:30:00Z"
    },
    {
      "id": "msg_2",
      "type": "ai",
      "content": "Machine learning is...",
      "timestamp": "2024-01-15T10:30:05Z"
    }
  ],
  "values": {
    "context": "...",
    "retrieved_docs": [...]
  }
}
```

## Configuration Options

### Model Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `model_provider` | string | `openai` | LLM provider (openai, anthropic, azure) |
| `model_name` | string | `gpt-4-turbo-preview` | Model identifier |
| `temperature` | number | `0.7` | Generation temperature (0-2) |
| `max_tokens` | number | `1000` | Maximum tokens to generate |

### Retriever Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `retriever_provider` | string | `supabase` | Vector store provider |
| `k` | integer | `4` | Number of documents to retrieve |
| `filter` | object | `{}` | Metadata filters for retrieval |
| `similarity_threshold` | number | `0.7` | Minimum similarity score |

## Error Handling

The API returns standard HTTP status codes:

| Status Code | Description |
|-------------|-------------|
| `200` | Success |
| `201` | Created |
| `204` | No Content |
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Missing or invalid authentication |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error |

**Error Response Format:**
```json
{
  "error": "Invalid input",
  "code": "INVALID_INPUT",
  "details": {
    "field": "query",
    "message": "Query cannot be empty"
  }
}
```

## Rate Limiting

- **Default Limits:**
  - 100 requests per minute per API key
  - 1000 requests per hour per API key
  - 10 concurrent requests per API key

- **Headers:**
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

## Streaming with Server-Sent Events

For real-time responses, use the streaming endpoint:

```javascript
const eventSource = new EventSource(
  'http://localhost:2024/threads/thread_123/runs/stream',
  {
    headers: {
      'X-API-Key': 'your-api-key'
    }
  }
);

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Received:', data);
};

eventSource.onerror = (error) => {
  console.error('Stream error:', error);
};
```

## Code Examples

### Python Example

```python
import requests
import json

# Create a thread
response = requests.post(
    "http://localhost:2024/threads",
    headers={"X-API-Key": "your-api-key"},
    json={"metadata": {"user": "john_doe"}}
)
thread = response.json()
thread_id = thread["thread_id"]

# Ingest documents
docs = [
    {
        "pageContent": "AI is transforming industries...",
        "metadata": {"source": "ai_report.pdf", "page": 1}
    }
]

response = requests.post(
    f"http://localhost:2024/threads/{thread_id}/runs",
    headers={"X-API-Key": "your-api-key"},
    json={
        "assistant_id": "ingestion_graph",
        "input": {"docs": docs}
    }
)

# Ask a question
response = requests.post(
    f"http://localhost:2024/threads/{thread_id}/runs",
    headers={"X-API-Key": "your-api-key"},
    json={
        "assistant_id": "retrieval_graph",
        "input": {"query": "How is AI transforming industries?"}
    }
)

answer = response.json()
print(answer["result"]["answer"])
```

### JavaScript/TypeScript Example

```typescript
import { LangGraphClient } from '@langchain/langgraph-sdk';

const client = new LangGraphClient({
  apiUrl: 'http://localhost:2024',
  apiKey: 'your-api-key'
});

async function askQuestion() {
  // Create a thread
  const thread = await client.createThread({
    metadata: { user: 'john_doe' }
  });

  // Ingest documents
  await client.runs.wait(
    thread.thread_id,
    'ingestion_graph',
    {
      input: {
        docs: [
          {
            pageContent: 'AI is transforming industries...',
            metadata: { source: 'ai_report.pdf', page: 1 }
          }
        ]
      }
    }
  );

  // Ask a question with streaming
  const stream = await client.runs.stream(
    thread.thread_id,
    'retrieval_graph',
    {
      input: { query: 'How is AI transforming industries?' },
      streamMode: ['messages', 'updates']
    }
  );

  for await (const chunk of stream) {
    console.log('Received:', chunk);
  }
}

askQuestion().catch(console.error);
```

### cURL Examples

```bash
# Create a thread
curl -X POST http://localhost:2024/threads \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"metadata": {"user": "john_doe"}}'

# Ingest a document
curl -X POST http://localhost:2024/threads/thread_abc123/runs \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "assistant_id": "ingestion_graph",
    "input": {
      "docs": [{
        "pageContent": "Sample content...",
        "metadata": {"source": "doc.pdf"}
      }]
    }
  }'

# Ask a question
curl -X POST http://localhost:2024/threads/thread_abc123/runs \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "assistant_id": "retrieval_graph",
    "input": {"query": "What is the main topic?"}
  }'
```

## Best Practices

1. **Thread Management**
   - Create a new thread for each user session
   - Clean up old threads periodically
   - Use thread metadata to store user context

2. **Document Ingestion**
   - Batch documents when possible
   - Include meaningful metadata for better retrieval
   - Chunk large documents appropriately

3. **Query Optimization**
   - Be specific with queries
   - Use appropriate k values (4-6 typically works well)
   - Adjust temperature based on use case

4. **Error Handling**
   - Implement exponential backoff for retries
   - Handle streaming errors gracefully
   - Log errors for debugging

5. **Performance**
   - Use streaming for better UX
   - Cache frequently accessed data
   - Monitor API usage and optimize accordingly

## Viewing API Documentation

To view the interactive API documentation:

1. Install express dependency:
   ```bash
   npm install express
   ```

2. Add a script to package.json:
   ```json
   "scripts": {
     "docs": "npx tsx src/docs-server.ts"
   }
   ```

3. Run the documentation server:
   ```bash
   npm run docs
   ```

4. Open your browser to http://localhost:3001

The interactive documentation includes:
- Complete API reference with Swagger UI
- Try-it-out functionality for testing endpoints
- Schema definitions and examples
- Authentication configuration

## Support

For issues and questions:
- GitHub Issues: [https://github.com/mayooear/ai-pdf-chatbot-langchain/issues](https://github.com/mayooear/ai-pdf-chatbot-langchain/issues)
- Documentation: This file and the interactive Swagger UI
- LangGraph Documentation: [https://langchain-ai.github.io/langgraph/](https://langchain-ai.github.io/langgraph/)