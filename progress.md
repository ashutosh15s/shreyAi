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
| **Phase 3** | **AI Service (FastAPI)** | ✅ **CORE READY** | UV, Python 3.11, LangGraph ReAct Agent, Claude-Code Prompts, Tavily Search, Desktop Tools |
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

### 8. AI Service & Agent Core (`Ai/`)
- [x] Installed standalone **`uv`** and provisioned **CPython 3.11.18** virtual environment in `Ai/.venv`.
- [x] Installed all 158 production packages (`fastapi`, `uvicorn`, `langchain`, `langgraph`, `google-genai`, `langchain-groq`, `langchain-openai`, `tavily-python`, `chromadb`, `sentence-transformers`, `pyautogui`, `psutil`).
- [x] **Claude-Code Grade System Prompt Architecture ([`Ai/agent/prompts.py`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/Ai/agent/prompts.py)):**
  - **Persona:** Shrey AI, elite desktop companion.
  - **Creators:** Explicitly and warmly credits **Aryan, Arpit, and Ashutosh**.
  - **Dual Modality:** Natural conversational speech for STT/TTS and structured markdown for text chat.
  - **Live Search Mandate:** Proactively executes Tavily search on current events or time-sensitive queries.
- [x] **Agent Tools Suite ([`Ai/agent/tools.py`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/Ai/agent/tools.py)):**
  - `tavily_search`: Real-time web search with titles, snippets, and source URLs.
  - `get_system_info`: CPU, RAM, disk storage, and battery telemetry via `psutil`.
  - `clipboard_read` & `clipboard_write`: Windows clipboard inspection and copying via `pyperclip`.
  - `take_screenshot`: Full-screen capture saved locally via `pyautogui`.
  - `read_local_file`: Safe local file reading.
- [x] **LangGraph ReAct Agent ([`Ai/agent/graph.py`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/Ai/agent/graph.py)):**
  - Multi-provider dynamic LLM loader (Groq, OpenRouter, Gemini).
  - Conversational persistence using `MemorySaver` checkpointer.
- [x] **FastAPI Application ([`Ai/main.py`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/Ai/main.py)):**
  - Endpoints: `POST /ai/chat`, `GET /health`, `GET /ai/status`, `GET /`.
- [x] **Spring Boot AI Proxy Gateway ([`AiProxyController.java`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/src/main/java/com/shreyai/controller/AiProxyController.java)):**
  - Reverse proxies `POST /api/ai/chat` to FastAPI `:8000/ai/chat` with JWT verification, Bucket4j rate limits, and audit logs.

---

## 🎯 Next Steps

1. **Frontend Authentication & Chat Wiring**:
   - Connect the React client (Login, Register, Profile, Voice Chat) in `frontend/` to the backend routes documented in [`backend/api.md`](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/api.md).
2. **Voice Integration**:
   - Chromium built-in `SpeechRecognition` (STT) and `speechSynthesis` (TTS) in Electron, plus Gemini voice streaming option.

