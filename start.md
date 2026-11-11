# 🚀 Shrey AI — Services Startup Guide

This document provides all commands to start the backend, AI microservice, and frontend for **Shrey AI**.

---

## ⚡ Quick Start: Automated Launchers

### Option 1: Start All Services via PowerShell
Open PowerShell in the project root (`c:\Users\Dell\Desktop\projects\shrey_Ai`) and run:
```powershell
# Starts AI Service (:8000), Spring Boot (:8080), and Frontend (:5173) in separate windows
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd Ai; .\.venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000 --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; java -jar target\backend-0.0.1-SNAPSHOT.jar"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
```

---

## 🖥️ Manual Startup: Service by Service

### 1. Python AI Microservice (Port `8000`)
Powers the LangGraph ReAct Agent, 18 Desktop/Web tools, ChromaDB ONNX RAG, and Groq/OpenRouter/Gemini LLMs.

```powershell
cd c:\Users\Dell\Desktop\projects\shrey_Ai\Ai
.\.venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000 --reload
```
* **Health Check:** `http://localhost:8000/health`
* **Status Check:** `http://localhost:8000/ai/status`
* **Swagger Docs:** `http://localhost:8000/docs`

> [!NOTE]
> The AI service runs strictly as a private downstream microservice. The frontend should **never** call port `8000` directly.

---

### 2. Spring Boot Gateway & Security Backend (Port `8080`)
Handles JWT authentication, user registration/login, MongoDB Atlas persistence, Bucket4j rate-limiting, audit logs, and reverse proxying to the AI engine.

#### Fast Start (Pre-compiled JAR):
```powershell
cd c:\Users\Dell\Desktop\projects\shrey_Ai\backend
java -jar target\backend-0.0.1-SNAPSHOT.jar
```

#### Development Mode (with Maven Auto-Reload):
```powershell
cd c:\Users\Dell\Desktop\projects\shrey_Ai\backend
c:\Users\Dell\Desktop\projects\shrey_Ai\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run
```
* **Health Check:** `http://localhost:8080/actuator/health`
* **AI Proxy Health:** `http://localhost:8080/api/ai/health`
* **AI Proxy Status:** `http://localhost:8080/api/ai/status`
* **AI Proxy Chat:** `POST http://localhost:8080/api/ai/chat` (Requires `Authorization: Bearer <token>`)

---

### 3. Electron + React Frontend (Port `5173` / Electron App Window)
The desktop voice and chat companion UI.

```powershell
cd c:\Users\Dell\Desktop\projects\shrey_Ai\frontend
npm run dev
```

---

## 🧪 Verification & Health Checking

To verify that both backend services are running and communicating properly:

```powershell
# 1. Check AI service direct probe
curl http://localhost:8000/health

# 2. Check Spring Boot gateway health
curl http://localhost:8080/actuator/health

# 3. Check Spring Boot -> AI service proxy forwarding
curl http://localhost:8080/api/ai/health
curl http://localhost:8080/api/ai/status
```

Expected output for `http://localhost:8080/api/ai/status`:
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

## 🛑 How to Stop Services

To terminate running background instances on ports `8000` and `8080`:

```powershell
# Kill processes on ports 8000 and 8080
Get-NetTCPConnection -LocalPort 8000, 8080 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
```
