# 🚀 Shrey AI — Services Startup Guide

This document lists the native, short startup commands for each component in **Shrey AI** using their respective standard tools:
* **AI Service** $\rightarrow$ **`uv`** (Python Fast Package & Environment Manager)
* **Backend** $\rightarrow$ **`java`** (Java 21 Virtual Machine / Spring Boot JAR)
* **Frontend** $\rightarrow$ **`npm`** (Node.js / Vite / Electron)

---

## ⚡ Short Commands Quick Summary

| Component | Directory | Short Native Command | Description |
|---|---|---|---|
| **Python AI Engine** | `Ai/` | `uv run main.py` | Runs FastAPI server with auto-reload on port `8000` |
| **Spring Boot Gateway** | `backend/` | `java -jar target/backend-0.0.1-SNAPSHOT.jar` | Runs Spring Boot 3.3.5 on port `8080` in ~3s |
| **Electron UI Client** | `frontend/` | `npm run dev` | Runs Vite + React + Electron dev window |

---

## 1. 🐍 Python AI Microservice (Port `8000`)
Powered by standalone **`uv`**, LangGraph ReAct agent, ChromaDB ONNX vector RAG, and Groq / OpenRouter / Gemini LLM providers.

### To Start:
```powershell
cd Ai
uv run main.py
```

*Alternative with uvicorn directly:*
```powershell
cd Ai
uv run uvicorn main:app --reload --port 8000
```

* **Health Check:** `http://localhost:8000/health`
* **Status Check:** `http://localhost:8000/ai/status`
* **Swagger Docs:** `http://localhost:8000/docs`

> [!NOTE]
> The AI microservice is private and downstream. The frontend communicates exclusively through the Spring Boot gateway on port `8080`.

---

## 2. ☕ Spring Boot Gateway Backend (Port `8080`)
Handles JWT authentication, security filters, MongoDB Atlas audit logging, Bucket4j rate-limiting, and AI proxy routing.

### To Start (Pre-compiled JAR):
```powershell
cd backend
java -jar target/backend-0.0.1-SNAPSHOT.jar
```

### To Recompile If Code Changes:
```powershell
cd backend
..\apache-maven-3.9.9\bin\mvn.cmd clean package -DskipTests
```

* **Gateway Health:** `http://localhost:8080/actuator/health`
* **AI Proxy Status:** `http://localhost:8080/api/ai/status`
* **AI Proxy Chat:** `POST http://localhost:8080/api/ai/chat` (JWT authenticated)

---

## 3. ⚛️ Desktop Electron Frontend (Port `5173`)
The client interface with voice input, animated audio waves, and Ace design system tokens.

### To Start:
```powershell
cd frontend
npm run dev
```

---

## 🖱️ One-Click All-in-One Startup

To launch both the Python AI engine (`uv`) and Spring Boot gateway (`java`) together in separate windows with one click:
* Double-click [`start_services.bat`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/start_services.bat) in the project root.

---

## 🛑 How to Stop Services

To shut down any running background instances on ports `8000` and `8080`:

```powershell
Get-NetTCPConnection -LocalPort 8000, 8080 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
```
