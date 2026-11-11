# 🚀 Shrey AI — Services Startup Guide

All services can now be started using **simple standard `npm run dev` commands**, just like the frontend!

---

## ⚡ Super Short Commands: `npm run dev`

You can run `npm run dev` directly inside each folder:

| Service | Folder | Short Command | What It Runs |
|---|---|---|---|
| **Spring Boot Gateway** | `backend/` | `npm run dev` *(or just `dev`)* | `java -jar target/backend-0.0.1-SNAPSHOT.jar` (Port `8080`) |
| **Python AI Engine** | `Ai/` | `npm run dev` *(or just `dev`)* | Uvicorn FastAPI with live reload (Port `8000`) |
| **Electron UI Client** | `frontend/` | `npm run dev` | Vite + React + Electron dev server (Port `5173`) |

---

## 🌐 Running From the Root Project Directory

From the project root (`c:\Users\Dell\Desktop\projects\shrey_Ai`), you can start any service or everything together:

```powershell
# 1. Start Both Backend + AI Services in separate windows
npm run dev

# 2. Or start individual services directly from root:
npm run dev:backend     # Runs Spring Boot Gateway (:8080)
npm run dev:ai          # Runs FastAPI AI Microservice (:8000)
npm run dev:frontend    # Runs Electron React Frontend (:5173)
```

---

## 🛠️ Additional Helpful Commands

### In `backend/`:
* `npm run dev` — Instant fast startup (3s via pre-compiled JAR).
* `npm run dev:watch` — Development mode using Maven with auto-reload (`mvn spring-boot:run`).
* `npm run build` — Clean package the JAR (`mvn clean package -DskipTests`).
* `.\dev` — Even shorter Windows shortcut (runs `dev.cmd`).

### In `Ai/`:
* `npm run dev` — Starts FastAPI with `--reload`.
* `.\dev` — Even shorter Windows shortcut (runs `dev.cmd`).

---

## 🧪 Quick Health Checks

To verify all services are active:

```powershell
# Check AI microservice
curl http://localhost:8000/health

# Check Spring Boot gateway
curl http://localhost:8080/actuator/health

# Check Spring Boot -> AI proxy forwarding
curl http://localhost:8080/api/ai/status
```

---

## 🛑 How to Stop All Services

To shut down any running background instances on ports `8000` and `8080`:

```powershell
Get-NetTCPConnection -LocalPort 8000, 8080 -ErrorAction SilentlyContinue | ForEach-Object {
    Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
```
