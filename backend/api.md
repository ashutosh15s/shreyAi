# Shrey AI — Backend API Reference & Contract

> **Base URL:** `http://localhost:8080` (Configurable via `VITE_API_BASE_URL=http://localhost:8080/api`)  
> **Auth Strategy:** Stateless JWT Bearer Token (`Authorization: Bearer <accessToken>`)  
> **Refresh Strategy:** Token rotation with MongoDB revocation and token blacklisting on logout.

---

## 📋 Standard Response Envelope

Every endpoint in the system returns data wrapped in a uniform response structure:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-11-11T13:26:16.304Z"
}
```

In case of error:
```json
{
  "success": false,
  "message": "Description of the error",
  "data": null,
  "timestamp": "2026-11-11T13:26:16.304Z"
}
```

---

## 🔐 1. Authentication & Session APIs (`/api/auth`)

### 1.1 Register User
- **Method:** `POST`
- **Path:** `/api/auth/register`
- **Access:** Public
- **Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "role": "ROLE_USER" // Optional: "ROLE_USER" or "ROLE_ADMIN". Defaults to ROLE_USER (or ROLE_ADMIN for the first user).
}
```

**Success Response (`201 Created`):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "id": "6af46cf6da258462068413b9",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "ROLE_USER",
    "expiresIn": 86400000
  },
  "timestamp": "2026-11-11T13:26:16.304Z"
}
```

---

### 1.2 Login
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Access:** Public
- **Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "email": "jane@example.com",
  "password": "Password123!"
}
```

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...",
    "tokenType": "Bearer",
    "id": "6af46cf6da258462068413b9",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "ROLE_USER",
    "expiresIn": 86400000
  },
  "timestamp": "2026-11-11T13:26:16.304Z"
}
```

---

### 1.3 Refresh Access Token
- **Method:** `POST`
- **Path:** `/api/auth/refresh`
- **Access:** Public
- **Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9...newAccessToken...",
    "refreshToken": "eyJhbGciOiJIUzI1NiJ9...newRotatedRefreshToken...",
    "tokenType": "Bearer",
    "id": "6af46cf6da258462068413b9",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "ROLE_USER",
    "expiresIn": 86400000
  },
  "timestamp": "2026-11-11T13:26:16.304Z"
}
```

---

### 1.4 Logout & Token Blacklist
- **Method:** `POST`
- **Path:** `/api/auth/logout`
- **Access:** Authenticated
- **Headers:**
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..." // Optional but recommended: also revokes the refresh session
}
```

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Logged out successfully, token blacklisted",
  "data": null,
  "timestamp": "2026-11-11T13:26:16.304Z"
}
```

> **Behavior:** The active access token is immediately recorded into the MongoDB `blacklisted_tokens` collection. Any further attempt to make requests using this token will be immediately rejected with `401 Unauthorized`.

---

### 1.5 Get Current Profile
- **Method:** `GET`
- **Path:** `/api/auth/me`
- **Access:** Authenticated
- **Headers:** `Authorization: Bearer <accessToken>`

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "id": "6af46cf6da258462068413b9",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "ROLE_USER",
    "enabled": true,
    "blacklisted": false,
    "createdAt": "2026-11-11T13:20:00.000Z",
    "updatedAt": "2026-11-11T13:25:00.000Z"
  },
  "timestamp": "2026-11-11T13:26:16.304Z"
}
```

---

### 1.6 Update Current Profile
- **Method:** `PUT`
- **Path:** `/api/auth/profile`
- **Access:** Authenticated
- **Headers:**
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`

**Request Body:**
```json
{
  "name": "Jane Smith"
}
```

---

### 1.7 Change Password
- **Method:** `POST`
- **Path:** `/api/auth/change-password`
- **Access:** Authenticated
- **Headers:**
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: application/json`

**Request Body:**
```json
{
  "currentPassword": "Password123!",
  "newPassword": "BrandNewPassword456!"
}
```

---

## 👥 2. User Administration APIs (`/api/users`)
*Requires `ROLE_ADMIN` authorization.*

### 2.1 List All Users (Paginated)
- **Method:** `GET`
- **Path:** `/api/users?page=0&size=10&sortBy=createdAt&direction=desc`
- **Access:** `ROLE_ADMIN`
- **Headers:** `Authorization: Bearer <adminToken>`

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Users retrieved successfully",
  "data": {
    "content": [
      {
        "id": "6af46cf6da258462068413b9",
        "name": "Jane Smith",
        "email": "jane@example.com",
        "role": "ROLE_USER",
        "enabled": true,
        "blacklisted": false,
        "createdAt": "2026-11-11T13:20:00Z"
      }
    ],
    "totalElements": 1,
    "totalPages": 1,
    "size": 10,
    "number": 0
  }
}
```

---

### 2.2 Get User by ID
- **Method:** `GET`
- **Path:** `/api/users/{id}`
- **Access:** `ROLE_ADMIN`

---

### 2.3 Update User Name / Details
- **Method:** `PUT`
- **Path:** `/api/users/{id}`
- **Access:** `ROLE_ADMIN`
- **Body:** `{"name": "Updated Name"}`

---

### 2.4 Update User Role
- **Method:** `PATCH`
- **Path:** `/api/users/{id}/role`
- **Access:** `ROLE_ADMIN`
- **Body:** `{"role": "ROLE_ADMIN"}` or `{"role": "ROLE_USER"}`

---

### 2.5 Blacklist / Unblacklist User
- **Method:** `PATCH`
- **Path:** `/api/users/{id}/blacklist`
- **Access:** `ROLE_ADMIN`
- **Headers:**
  - `Authorization: Bearer <adminToken>`
  - `Content-Type: application/json`

**Request Body:**
```json
{
  "blacklisted": true // Set false to unblacklist
}
```

> **Behavior:** When `blacklisted: true`, the user's account is locked, all active refresh sessions are revoked, and tokens are blacklisted immediately. Login attempts return `401 Unauthorized`.

---

### 2.6 Delete User
- **Method:** `DELETE`
- **Path:** `/api/users/{id}`
- **Access:** `ROLE_ADMIN`
- **Headers:** `Authorization: Bearer <adminToken>`

---

## 📜 3. Audit Logs APIs (`/api/audit-logs`)

### 3.1 Get Current User's Audit Trail
- **Method:** `GET`
- **Path:** `/api/audit-logs/my?page=0&size=20`
- **Access:** Authenticated
- **Headers:** `Authorization: Bearer <accessToken>`

### 3.2 Get System-Wide Audit Logs
- **Method:** `GET`
- **Path:** `/api/audit-logs?page=0&size=20`
- **Access:** `ROLE_ADMIN`
- **Headers:** `Authorization: Bearer <adminToken>`

---

## 🚦 4. Gateway & Rate-Limit Pre-flight APIs (`/api/gateway`)

### 4.1 Check Rate Limits per Provider
- **Method:** `POST`
- **Path:** `/api/gateway/rate-check?provider=groq`
- **Query Params:** `provider` (`groq`, `grok`, `gemini`, `openrouter`)
- **Access:** Authenticated
- **Headers:** `Authorization: Bearer <accessToken>`

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Rate limit check passed",
  "data": {
    "allowed": true,
    "provider": "groq",
    "userId": "6af46cf6da258462068413b9"
  }
}
```

**Rate Limit Exceeded (`429 Too Many Requests`):**
```json
{
  "success": false,
  "message": "Rate limit exceeded for provider 'groq'. Please try again in 42 seconds.",
  "data": null
}
```
*Includes HTTP Header:* `Retry-After: 42`

---

### 4.2 Gateway Status Check
- **Method:** `GET`
- **Path:** `/api/gateway/status`
- **Access:** Authenticated
- **Headers:** `Authorization: Bearer <accessToken>`

---

## 🩺 5. Actuator Health Probe

- **Method:** `GET`
- **Path:** `/actuator/health`
- **Access:** Public

```json
{
  "status": "UP"
}
```

---

## 🤖 5. AI Service & Chat Gateway APIs (`/api/ai`)

### 5.1 Chat with Shrey AI
- **Method:** `POST`
- **Path:** `/api/ai/chat`
- **Access:** Authenticated (Any role)
- **Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: application/json`

**Request Body:**
```json
{
  "message": "What is the latest score in the Champions League and summarize it for me?",
  "thread_id": "session-user-123", // Optional: conversation thread ID for memory
  "provider": "openrouter" // Optional: "groq", "openrouter", or "gemini"
}
```

**Response (200 OK):**
```json
{
  "response": "Real Madrid defeated Manchester City 3-2 in an exhilarating quarterfinal match...",
  "tools_used": ["tavily_search"],
  "thread_id": "session-user-123",
  "provider": "openrouter"
}
```

### 5.2 AI Service Health Probe
- **Method:** `GET`
- **Path:** `/api/ai/health`
- **Access:** Public

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "shrey-ai-service"
}
```

### 5.3 AI Service Status Probe
- **Method:** `GET`
- **Path:** `/api/ai/status`
- **Access:** Public

**Response (200 OK):**
```json
{
  "status": "ready",
  "name": "Shrey AI",
  "creators": ["Aryan", "Arpit", "Ashutosh"],
  "default_provider": "groq",
  "providers_configured": {
    "groq": false,
    "gemini": false,
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

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shrey_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Handle Token Expiration & Refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('shrey_refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post('http://localhost:8080/api/auth/refresh', { refreshToken });
          const { token, refreshToken: newRefresh } = res.data.data;
          localStorage.setItem('shrey_token', token);
          localStorage.setItem('shrey_refresh_token', newRefresh);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

