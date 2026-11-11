# Shrey AI — Python AI Microservice API Reference

> **Base URL:** `http://localhost:8000` (Direct) or `http://localhost:8080/api/ai` (Via Spring Boot Gateway Proxy)  
> **Architecture:** FastAPI · LangChain 0.3 · LangGraph ReAct Agent · ChromaDB ONNX Vector Store  
> **Supported LLM Providers:** Groq (`qwen/qwen3.8-27b`), OpenRouter (`meta-llama/llama-3.1-8b-instruct:free`), Google Gemini  

---

## 🚀 Running the AI Service

To run the FastAPI server:

```bash
# Navigate to Ai directory
cd c:\Users\Dell\Desktop\projects\shrey_Ai\Ai

# Run server with UV on port 8000
.\.venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📋 Endpoints Overview

| Method | Endpoint | Description | Auth Required? |
|---|---|---|:---:|
| `GET` | `/` | Service root and metadata | No |
| `GET` | `/health` | Health probe | No |
| `GET` | `/ai/status` | Active LLM providers, tool count, and status | No |
| `POST` | `/ai/chat` | Primary agent chat (executes tools, returns text + voice script) | Optional / Via Gateway |
| `POST` | `/ai/rag/ingest` | Ingest and chunk text documents into ChromaDB | Optional |
| `POST` | `/ai/rag/query` | Semantic similarity query from ChromaDB | Optional |

---

## 🛠 1. Chat & Agent Execution (`POST /ai/chat`)

Processes user message or speech transcript, passes it to the `ChatPipeline`, executes any necessary desktop or web tools, and returns both markdown text and speech-ready text.

- **Method:** `POST`
- **Path:** `/ai/chat`
- **Headers:** `Content-Type: application/json`

### Request Body:
```json
{
  "message": "What is my current CPU and RAM usage?",
  "thread_id": "session-user-123", // Optional: Conversation memory session ID
  "provider": "groq",               // Optional: "groq", "openrouter", or "gemini"
  "include_voice_script": true     // Optional: Generates clean spoken text for TTS
}
```

### Response (200 OK):
```json
{
  "response": "Here is your current system snapshot:\n- **CPU Usage:** 55.5%\n- **RAM Usage:** 83.0% (6.31 GB / 7.61 GB)\n- **Disk Storage:** 81.9% used\n- **Battery:** 100% (Plugged In)",
  "voice_script": "Here is your current system snapshot. CPU Usage is 55.5 percent, RAM Usage is 83.0 percent, and battery is at 100 percent.",
  "tools_executed": [
    "get_system_info"
  ],
  "thread_id": "session-user-123",
  "provider": "groq",
  "status": "success"
}
```

---

## 📚 2. RAG Knowledge Ingestion (`POST /ai/rag/ingest`)

Chunks text documents using `RecursiveCharacterTextSplitter` and embeds them into local ChromaDB with ONNX embeddings.

- **Method:** `POST`
- **Path:** `/ai/rag/ingest`
- **Headers:** `Content-Type: application/json`

### Request Body:
```json
{
  "text": "Shrey AI features an intelligent voice assistant architecture designed by Aryan, Arpit, and Ashutosh.",
  "source": "architecture.md",
  "metadata": {
    "category": "system_design",
    "author": "Ashutosh"
  }
}
```

### Response (200 OK):
```json
{
  "status": "success",
  "chunks_ingested": 1,
  "source": "architecture.md"
}
```

---

## 🔍 3. RAG Semantic Query (`POST /ai/rag/query`)

Performs cosine similarity search against the ChromaDB vector database.

- **Method:** `POST`
- **Path:** `/ai/rag/query`
- **Headers:** `Content-Type: application/json`

### Request Body:
```json
{
  "query": "Who built Shrey AI?",
  "top_k": 3
}
```

### Response (200 OK):
```json
{
  "query": "Who built Shrey AI?",
  "matches": [
    {
      "content": "Shrey AI features an intelligent voice assistant architecture designed by Aryan, Arpit, and Ashutosh.",
      "metadata": {
        "author": "Ashutosh",
        "category": "system_design",
        "chunk_index": 0,
        "source": "architecture.md"
      },
      "score": 0.4549
    }
  ]
}
```

---

## ⚡ 4. Service Probes

### 4.1 Root Metadata
- **Path:** `GET /`
```json
{
  "status": "online",
  "service": "Shrey AI Engine",
  "version": "1.0.0",
  "creators": ["Aryan", "Arpit", "Ashutosh"],
  "architecture": "Class-based ReAct Agent & Multi-Modal Pipeline"
}
```

### 4.2 Health Check
- **Path:** `GET /health`
```json
{
  "status": "ok",
  "service": "shrey-ai-service"
}
```

### 4.3 AI Status Probe
- **Path:** `GET /ai/status`
```json
{
  "status": "ready",
  "name": "Shrey AI",
  "creators": ["Aryan", "Arpit", "Ashutosh"],
  "default_provider": "groq",
  "providers_configured": {
    "groq": true,
    "gemini": true,
    "openrouter": true,
    "tavily": true
  },
  "voice": {
    "stt": "gemini",
    "tts": "gemini",
    "text_reply_enabled": true
  },
  "workflow": "active"
}
```

---

## 💻 Frontend Client Sample (Axios + TypeScript)

```typescript
import axios from 'axios';

const aiClient = axios.create({
  baseURL: 'http://localhost:8000', // Or http://localhost:8080/api/ai through gateway
  headers: {
    'Content-Type': 'application/json'
  }
});

export interface ChatResponse {
  response: string;
  voice_script: string;
  tools_executed: string[];
  thread_id: string;
  provider: string;
  status: string;
}

export async function sendMessageToShrey(message: string, threadId = 'default'): Promise<ChatResponse> {
  const { data } = await aiClient.post<ChatResponse>('/ai/chat', {
    message,
    thread_id: threadId,
    include_voice_script: true
  });
  return data;
}
```
