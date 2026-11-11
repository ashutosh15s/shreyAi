# 🚀 Shrey AI — Project Progress & Status Tracker

**Current Phase:** Phase 2 Complete (Backend Auth, Authorization, Security, Rate Limiting & Atlas Integration)  
**Last Updated:** November 11, 2026  
**Single Source of Truth:** [https://github.com/ashutosh15s/shreyAi](https://github.com/ashutosh15s/shreyAi) (`main` branch)

---

## 📌 Overall Milestones Progress

| Phase | Milestone | Status | Description |
|---|---|:---:|---|
| **Phase 1** | **Project Setup & Environment** | ✅ **DONE** | Java 21, Maven, Node.js, Electron scaffold, Git repo initialization |
| **Phase 2** | **Backend Auth & Gateway** | ✅ **DONE** | Spring Boot 3.3.5, JWT, MongoDB Atlas, Blacklisting, Rate Limits, 20 API Routes |
| **Phase 3** | **AI Service (FastAPI)** | ✅ **DONE & VERIFIED** | LangGraph ReAct Agent, 18 Desktop/Web Tools, ChromaDB ONNX RAG, Chat & RAG Pipelines |
| **Phase 4** | **Frontend UI & Voice (Electron)** | 🔄 **IN PROGRESS** | React + Vite, Ace Design System tokens, Voice Button, Chromium STT/TTS |
| **Phase 5** | **Full Integration & Packaging** | ⏳ **PENDING** | End-to-end voice chat, `electron-builder` Windows installer |

---

## 🛠 What Has Been Completed So Far

### 1. Git Repository & Infrastructure
- [x] Initialized Git repository on branch `main`.
- [x] Set remote origin to `https://github.com/ashutosh15s/shreyAi.git`.
- [x] Created root [`.gitignore`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/.gitignore) to exclude secrets (`.env`), build artifacts (`target/`, `node_modules/`, `dist/`), and caches.
- [x] Synced all commits directly to GitHub remote.

### 2. Environment & Tooling
- [x] Identified and linked **Java 21 LTS** (`Eclipse Adoptium Temurin 21.0.13`).
- [x] Configured **Apache Maven 3.9.9** portable build tool.
- [x] Verified **Node.js v26.13.0** and **npm 11.20.0**.

### 3. Spring Boot Backend Architecture (`backend/`)
- [x] Initialized Spring Boot 3.3.5 project with Java 21 in [`backend/pom.xml`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/pom.xml).
- [x] Configured dependencies:
  - `spring-boot-starter-web`: REST endpoints and CORS policies.
  - `spring-boot-starter-security`: Spring Security 6 stateless filter chain.
  - `spring-boot-starter-data-mongodb`: ODM connecting live to MongoDB Atlas.
  - `spring-boot-starter-validation`: Jakarta bean validation constraints.
  - `spring-boot-starter-actuator`: Health check probes.
  - `jjwt` (0.12.6): HMAC-SHA256 JWT access and refresh token management.
  - `bucket4j-core` (8.10.1): Token-bucket rate limiting.
- [x] Built pure-Java `.env` reader in [`BackendApplication.java`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/src/main/java/com/shreyai/BackendApplication.java) to automatically load variables without external dependencies.
- [x] Created [`backend/.env.example`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/.env.example) and [`backend/.env`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/.env).

### 4. Database Models & MongoDB Atlas Integration
Connected live to **MongoDB Atlas** (`cluster0.xjknakr.mongodb.net`) with active documents across collections:
- [x] **[`User`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/src/main/java/com/shreyai/model/User.java)** (`users` collection): Unique email, BCrypt password hash, role (`ROLE_USER` / `ROLE_ADMIN`), enabled status, and blacklisted status.
- [x] **[`Session`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/src/main/java/com/shreyai/model/Session.java)** (`sessions` collection): Refresh token sessions with revocation flags and expiration tracking.
- [x] **[`BlacklistedToken`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/src/main/java/com/shreyai/model/BlacklistedToken.java)** (`blacklisted_tokens` collection): Stores revoked tokens with a MongoDB TTL index (`expireAfterSeconds = 0`) for automatic expiration.
- [x] **[`AuditLog`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/src/main/java/com/shreyai/model/AuditLog.java)** (`audit_logs` collection): Full audit trail of registrations, logins, logouts, role changes, and blacklisting.
- [x] **[`RateLimitRecord`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/src/main/java/com/shreyai/model/RateLimitRecord.java)** (`rate_limits` collection): Tracks user/provider window counters.

### 5. Security & Rate-Limiting Features
- [x] **Stateless JWT Auth:** Access tokens (24h) and refresh tokens (7d) signed with HMAC-SHA256.
- [x] **Token Blacklisting on Logout:** Active tokens are saved to the blacklist model on `/api/auth/logout` and immediately blocked in [`JwtAuthFilter`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/src/main/java/com/shreyai/filter/JwtAuthFilter.java).
- [x] **User Blacklisting:** Admins can lock user accounts via `/api/users/{id}/blacklist`. Blacklisted users have all active sessions revoked and cannot log in or make authenticated requests.
- [x] **Bucket4j Rate Limiting:** Per-user, per-LLM provider limits (Groq: 60/min, Grok: 20/min, Gemini/OpenRouter: 100/min) + brute-force auth protection (15 attempts/min per IP). Returns `429 Too Many Requests` with `Retry-After` headers.
- [x] **CORS Configuration:** Enables secure cross-origin communication with the Electron frontend (`http://localhost:*`, `app://*`).

### 6. API Routes Implemented & Verified Live
All 20 endpoints tested against MongoDB Atlas via automated test runner [`backend/run_full_verification.ps1`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/run_full_verification.ps1):
- [x] `GET /actuator/health` — Service health probe.
- [x] `POST /api/auth/register` — User registration with role assignment.
- [x] `POST /api/auth/login` — Authentication and token generation.
- [x] `POST /api/auth/refresh` — Refresh token rotation.
- [x] `POST /api/auth/logout` — Session revocation and token blacklisting.
- [x] `GET /api/auth/me` — Current authenticated user profile.
- [x] `PUT /api/auth/profile` — Self-service profile updates.
- [x] `POST /api/auth/change-password` — Password rotation and session invalidation.
- [x] `GET /api/users` — Paginated user directory (Admin only).
- [x] `GET /api/users/{id}` — Fetch user by ID (Admin only).
- [x] `PUT /api/users/{id}` — Update user by ID (Admin only).
- [x] `PATCH /api/users/{id}/role` — Role modification (Admin only).
- [x] `PATCH /api/users/{id}/blacklist` — Account locking/unlocking (Admin only).
- [x] `DELETE /api/users/{id}` — User deletion (Admin only).
- [x] `GET /api/audit-logs/my` — User audit log history.
- [x] `GET /api/audit-logs` — System audit logs (Admin only).
- [x] `POST /api/gateway/rate-check` — LLM pre-flight rate check.
- [x] `GET /api/gateway/status` — Gateway health and downstream URL status.

### 7. Documentation & Reference Files
- [x] **[`backend/api.md`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/api.md)**: Full API contract, payloads, headers, response envelopes, AI proxy routes, and Axios TypeScript integration code.
- [x] **[`report.md`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/report.md)**: Live verification report detailing performance across all 20 tested endpoints.
- [x] **[`PLAN.md`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/PLAN.md)**: Master project architecture and design document.

### 8. AI Service & Agent Core (`Ai/`) — 100% Verified
- [x] Installed standalone **`uv`** package manager and provisioned **CPython 3.11.18** in `Ai/.venv`.
- [x] Removed bulky `sentence-transformers` & `torch`, migrating to ChromaDB's built-in ONNX runtime for lightweight vector embeddings.
- [x] **Claude-Code Grade System Prompt ([`Ai/agent/prompts.py`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/Ai/agent/prompts.py)):**
  - **Persona:** Shrey AI, elite desktop companion.
  - **Creators:** Explicitly and warmly credits **Aryan, Arpit, and Ashutosh**.
  - **Dual Modality:** Natural conversational speech for STT/TTS and structured markdown for text chat.
  - **Live Search Mandate:** Proactively executes Tavily search on current events or time-sensitive queries.
- [x] **Comprehensive Suite of 18 Agent Tools ([`Ai/agent/tools.py`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/Ai/agent/tools.py)):**
  - **Web & Live Data (Free / Zero-Key):** `tavily_search`, `fetch_web_page`, `get_weather`, `get_crypto_prices`, `get_hacker_news_stories`, `open_in_browser`.
  - **Desktop & OS Automation:** `launch_application`, `media_control`, `lock_workstation`, `create_desktop_note`, `empty_recycle_bin`.
  - **Diagnostics & Process Management:** `get_system_info`, `list_running_processes`, `kill_process`.
  - **Clipboard & Screen:** `clipboard_read`, `clipboard_write`, `take_screenshot`, `read_local_file`.
- [x] **Class-Based Architecture ([`Ai/agent/core.py`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/Ai/agent/core.py)):**
  - Built `ShreyAgent` class wrapping LangGraph ReAct agent, MemorySaver checkpointer, and speech-cleaning utilities.
- [x] **Class-Based Pipelines ([`Ai/pipeline/`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/Ai/pipeline/)):**
  - **`ChatPipeline`**: Sanitizes inputs, manages agent routing, and returns dual-modality output (`response` + `voice_script`).
  - **`RagPipeline`**: Text chunking, ONNX vector embedding, and ChromaDB similarity search.
- [x] **Automated Test Suite ([`Ai/test_ai_endpoints.py`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/Ai/test_ai_endpoints.py)):**
  - Verified 100% passing across all 6 microservice routes: `GET /`, `GET /health`, `GET /ai/status`, `POST /ai/rag/ingest`, `POST /ai/rag/query`, and `POST /ai/chat`.
  - Multi-provider live verification passed across all 3 providers:
    - **Groq (`qwen/qwen3.8-27b`)**: Responds in < 2s, executes OS tools and honors system prompt.
    - **OpenRouter (`openrouter/free`)**: Dynamic free routing, strictly honors Shrey AI identity and creators (**Aryan, Arpit, and Ashutosh**).
    - **Gemini (`gemini-3.8-flash` / `gemini-3.5-flash-lite`)**: Normalized multimodal parts, returns clean text and TTS voice script.
  - Live tool execution verified: Agent autonomously executed `get_system_info` tool and returned live CPU, RAM, disk, and battery analysis.
- [x] **Documentation Created ([`Ai/api.md`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/Ai/api.md)):** Complete microservice API reference, request/response models, and Axios TypeScript client.

### 9. How to Run the Services

#### 1. Start AI Service (Port 8000)
```powershell
cd c:\Users\Dell\Desktop\projects\shrey_Ai\Ai
.\.venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000 --reload
```

#### 2. Start Spring Boot Backend (Port 8080)
```powershell
cd c:\Users\Dell\Desktop\projects\shrey_Ai\backend
c:\Users\Dell\Desktop\projects\shrey_Ai\apache-maven-3.9.9\bin\mvn.cmd spring-boot:run
```

#### 3. Start Electron Frontend (Port 5173 / Electron Window)
```powershell
cd c:\Users\Dell\Desktop\projects\shrey_Ai\frontend
npm run dev
```

---

## 🎯 Next Steps

1. **Frontend Authentication & Chat UI Wiring**:
   - Connect the React client (Login, Register, Voice Chat) in `frontend/` to the backend routes documented in [`backend/api.md`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/api.md) and [`Ai/api.md`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/Ai/api.md).
2. **Voice Integration**:
   - Connect the animated `VoiceButton` to Chromium's built-in `SpeechRecognition` (STT) and `speechSynthesis` (TTS) in Electron.

