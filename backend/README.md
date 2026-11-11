# Shrey AI — Backend Service

Spring Boot 3 + Java 21 authentication, authorization, rate-limiting, and API gateway service for Shrey AI.

---

## 🚀 Features

- **Authentication & Authorization**:
  - Stateless JWT authentication using JJWT 0.12.6.
  - Role-based access control (`ROLE_USER`, `ROLE_ADMIN`) with Spring Security 6.
  - BCrypt password hashing.
  - Refresh token rotation and session tracking in MongoDB.
  - User self-service profile update and secure password rotation.
- **Rate Limiting**:
  - Token-bucket algorithm via **Bucket4j 8.10.1**.
  - Per-user and per-LLM provider rate limits (Groq: 60/min, Grok: 20/min, Gemini/OpenRouter: 100/min).
  - Client-side pre-flight checks (`/api/gateway/rate-check`).
  - Auth brute-force protection (15 attempts/min per client IP).
  - Returns `429 Too Many Requests` with RFC `Retry-After` header.
- **MongoDB ODM**:
  - `users`: User identity, hashed passwords, roles, timestamps.
  - `sessions`: Active refresh tokens and revocation state.
  - `audit_logs`: Detailed audit trail for user and security actions.
  - `rate_limits`: Rate limit state tracking.
- **Actuator Health & Observability**:
  - `/actuator/health` and `/actuator/info`.

---

## 📡 API Endpoints

### 1. Authentication (`/api/auth`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account. First registered user receives `ROLE_ADMIN`. |
| `POST` | `/api/auth/login` | Public | Authenticate with email and password. Returns access and refresh tokens. |
| `POST` | `/api/auth/refresh` | Public | Rotate refresh token and issue new access token. |
| `POST` | `/api/auth/logout` | Authenticated | Revoke refresh token and invalidate session. |
| `GET` | `/api/auth/me` | Authenticated | Fetch current authenticated user's profile. |
| `PUT` | `/api/auth/profile` | Authenticated | Update user profile information (e.g. name). |
| `POST` | `/api/auth/change-password` | Authenticated | Change password and revoke all active sessions. |

### 2. User Administration (`/api/users`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/users` | `ROLE_ADMIN` | List paginated users. Query params: `page`, `size`, `sortBy`, `direction`. |
| `GET` | `/api/users/{id}` | `ROLE_ADMIN` | Retrieve user details by ID. |
| `PATCH` | `/api/users/{id}/role` | `ROLE_ADMIN` | Change user role (`ROLE_USER` / `ROLE_ADMIN`). |
| `DELETE` | `/api/users/{id}` | `ROLE_ADMIN` | Delete user account. |

### 3. Audit Logs (`/api/audit-logs`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/audit-logs/my` | Authenticated | View authenticated user's own action log history. |
| `GET` | `/api/audit-logs` | `ROLE_ADMIN` | View system-wide audit logs with pagination. |

### 4. Gateway & Rate Limits (`/api/gateway`)

| Method | Endpoint | Access | Description |
|---|---|---|---|
| `POST` | `/api/gateway/rate-check` | Authenticated | Verify rate limit availability for a provider (e.g. `?provider=groq`). |
| `GET` | `/api/gateway/status` | Authenticated | Inspect gateway configuration and target downstream AI service address. |

---

## 🛠 Configuration & Environment Variables

| Variable | Default Value | Description |
|---|---|---|
| `PORT` / `server.port` | `8080` | Port for the Spring Boot server |
| `MONGO_URI` | `mongodb://localhost:27017/shreyai` | MongoDB connection URI |
| `JWT_SECRET` | *(256-bit default string)* | HMAC-SHA256 secret key |
| `JWT_EXPIRATION` | `86400000` (24 hours) | Access token validity in ms |
| `JWT_REFRESH_EXPIRATION` | `604800000` (7 days) | Refresh token validity in ms |
| `AI_SERVICE_URL` | `http://localhost:8000` | Downstream FastAPI AI service base URL |

---

## 💻 Running the Backend

Ensure JDK 21 is installed.

```powershell
# Set JAVA_HOME if not in PATH:
$env:JAVA_HOME="C:\Program Files\Eclipse Adoptium\jdk-21.0.13.9-hotspot"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

# Run with Maven:
mvn clean spring-boot:run
```

