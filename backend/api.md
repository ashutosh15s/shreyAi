# Shrey AI — Backend API Reference & Contract

> **Base URL:** `http://localhost:8080` (Configurable via `VITE_API_BASE_URL=http://localhost:8080/api`)  
> **Auth Strategy:** Stateless JWT Bearer Token (`Authorization: Bearer <accessToken>`)  
> **Refresh Strategy:** Token rotation with MongoDB revocation and token blacklisting on logout.  
> **AI Architecture:** Single Gateway pattern — Frontend interacts exclusively with Spring Boot on port `8080`.

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
  "name": "Ashutosh Sharma",
  "email": "ashutosh@example.com",
  "password": "Password123!",
  "role": "ROLE_USER" // Optional: "ROLE_USER" or "ROLE_ADMIN". Defaults to ROLE_USER.
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
    "id": "6732...34",
    "name": "Ashutosh Sharma",
    "email": "ashutosh@example.com",
    "role": "ROLE_USER",
    "expiresIn": 86400000
  },
  "timestamp": "2026-11-11T13:26:16.304Z"
}
```

### 1.2 User Login
- **Method:** `POST`
- **Path:** `/api/auth/login`
- **Access:** Public
- **Headers:** `Content-Type: application/json`

**Request Body:**
```json
{
  "email": "ashutosh@example.com",
  "password": "Password123!"
}
```

**Success Response (`200 OK`):** Same payload as register.

### 1.3 Refresh Access Token
- **Method:** `POST`
- **Path:** `/api/auth/refresh`
- **Access:** Public

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

**Success Response (`200 OK`):** Rotates the refresh token and returns a new access token.

### 1.4 Logout & Session Revocation
- **Method:** `POST`
- **Path:** `/api/auth/logout`
- **Access:** Authenticated (or Public with refresh token)
- **Headers:** `Authorization: Bearer <accessToken>`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiJ9..."
}
```

---

## 👤 2. User Profile APIs (`/api/auth`)

### 2.1 Get Current User (`GET /api/auth/me`)
- **Headers:** `Authorization: Bearer <accessToken>`
- Returns user profile including name, email, role, and account creation dates.

### 2.2 Update Profile (`PUT /api/auth/profile`)
- **Headers:** `Authorization: Bearer <accessToken>`
- Allows updating `name` and `email`.

### 2.3 Change Password (`POST /api/auth/change-password`)
- **Headers:** `Authorization: Bearer <accessToken>`
- Requires `oldPassword` and `newPassword`. Invalids all previous sessions.

---

## 💬 3. Chat History & Conversation CRUD APIs (`/api/chat`)

All `/api/chat/**` routes require standard JWT authentication (`Authorization: Bearer <accessToken>`).

### 3.1 Get All Conversations
Returns all conversation threads belonging to the current user, ordered by `updatedAt` descending.
- **Method:** `GET`
- **Path:** `/api/chat/conversations`
- **Access:** Authenticated

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Conversations retrieved successfully",
  "data": [
    {
      "id": "6af49969fd141a699fb1297a",
      "userId": "6af4987290d40a180984af96",
      "title": "React & Desktop Automation",
      "isPinned": true,
      "modelProvider": "groq",
      "createdAt": "2026-11-11T16:20:00Z",
      "updatedAt": "2026-11-11T16:35:00Z"
    }
  ]
}
```

### 3.2 Create New Conversation
Explicitly creates a new conversation thread.
- **Method:** `POST`
- **Path:** `/api/chat/conversations`
- **Access:** Authenticated

**Request Body:**
```json
{
  "title": "Code Review Discussion", // Optional, defaults to "New Chat"
  "modelProvider": "groq"              // Optional: "groq", "openrouter", or "gemini"
}
```

**Success Response (`201 Created`):** Returns the created `Conversation` object.

### 3.3 Get Conversation Details & Message History
Fetches a conversation and its complete chronological message log.
- **Method:** `GET`
- **Path:** `/api/chat/conversations/{conversationId}`
- **Access:** Authenticated

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Conversation and messages retrieved",
  "data": {
    "conversation": {
      "id": "6af49969fd141a699fb1297a",
      "title": "React & Desktop Automation",
      "isPinned": false,
      "modelProvider": "groq"
    },
    "messages": [
      {
        "id": "msg_001",
        "conversationId": "6af49969fd141a699fb1297a",
        "userId": "usr_001",
        "role": "user",
        "content": "What is my CPU usage right now?",
        "isEdited": false,
        "timestamp": "2026-11-11T16:20:01Z"
      },
      {
        "id": "msg_002",
        "conversationId": "6af49969fd141a699fb1297a",
        "userId": "usr_001",
        "role": "assistant",
        "content": "Your current CPU usage is **42.1%**.",
        "voiceScript": "Your current CPU usage is 42.1 percent.",
        "provider": "groq",
        "toolsUsed": ["get_system_info"],
        "isEdited": false,
        "timestamp": "2026-11-11T16:20:03Z"
      }
    ]
  }
}
```

### 3.4 Update Conversation (Rename / Pin)
- **Method:** `PUT`
- **Path:** `/api/chat/conversations/{conversationId}`
- **Access:** Authenticated

**Request Body:**
```json
{
  "title": "New Conversation Title", // Optional
  "isPinned": true                    // Optional: boolean
}
```

### 3.5 Delete Conversation (Cascade)
Deletes the conversation and **permanently cascades deletion** to all associated messages in MongoDB Atlas.
- **Method:** `DELETE`
- **Path:** `/api/chat/conversations/{conversationId}`
- **Access:** Authenticated

### 3.6 Edit Message
Allows user to edit their previously sent message. Sets `isEdited: true` and records `editedAt`.
- **Method:** `PUT`
- **Path:** `/api/chat/messages/{messageId}`
- **Access:** Authenticated

**Request Body:**
```json
{
  "content": "Updated message text here"
}
```

**Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Message edited successfully",
  "data": {
    "id": "msg_001",
    "content": "Updated message text here",
    "isEdited": true,
    "editedAt": "2026-11-11T16:25:00Z"
  }
}
```

### 3.7 Delete Message
Deletes a single message from the thread.
- **Method:** `DELETE`
- **Path:** `/api/chat/messages/{messageId}`
- **Access:** Authenticated

---

## 🤖 4. AI Gateway & Agent Execution APIs (`/api/ai`)

All AI executions pass through Spring Boot, enforcing Bucket4j rate limits, session security, and MongoDB Atlas persistence.

### 4.1 Chat with Shrey AI (With Persistent Memory & Tool Execution)
- **Method:** `POST`
- **Path:** `/api/ai/chat`
- **Access:** Authenticated
- **Headers:** `Authorization: Bearer <accessToken>`, `Content-Type: application/json`

**Request Body:**
```json
{
  "message": "What's the weather in Tokyo and launch Notepad for me?",
  "conversationId": "6af49969fd141a699fb1297a", // Optional. If omitted, auto-creates a new conversation.
  "provider": "groq",                             // Optional: "groq", "openrouter", or "gemini"
  "include_voice_script": true                    // Optional: Generates TTS-cleaned text (default: true)
}
```

**Response (`200 OK`):**
```json
{
  "response": "The weather in Tokyo is currently **14°C, Sunny**. I have also launched **Notepad** for you.",
  "voice_script": "The weather in Tokyo is currently 14 degrees Celsius and Sunny. I have also launched Notepad for you.",
  "tools_executed": [
    "get_weather",
    "launch_application"
  ],
  "conversationId": "6af49969fd141a699fb1297a",
  "userMessageId": "6af49969fd141a699fb1297c",
  "assistantMessageId": "6af4996cfd141a699fb1297d",
  "thread_id": "6af49969fd141a699fb1297a",
  "provider": "groq",
  "status": "success"
}
```

> [!TIP]
> **Automatic Memory Context:** When you pass a `conversationId`, Spring Boot automatically fetches the recent prior conversation turns from MongoDB Atlas and seeds them into the agent's context. The AI remembers names, facts, and instructions from previous turns.

### 4.2 Ingest Knowledge into ChromaDB Vector Store
- **Method:** `POST`
- **Path:** `/api/ai/rag/ingest`
- **Access:** Authenticated

**Request Body:**
```json
{
  "text": "Shrey AI was created by Aryan, Arpit, and Ashutosh. It features full desktop automation.",
  "source": "shrey_manual.pdf",
  "metadata": { "category": "system" }
}
```

### 4.3 Query Knowledge Base Semantically
- **Method:** `POST`
- **Path:** `/api/ai/rag/query`
- **Access:** Authenticated

**Request Body:**
```json
{
  "query": "Who created Shrey AI?",
  "top_k": 3
}
```

### 4.4 AI Service Health Probe
- **Method:** `GET`
- **Path:** `/api/ai/health`
- **Access:** Public

### 4.5 AI Service Status Probe
- **Method:** `GET`
- **Path:** `/api/ai/status`
- **Access:** Public

---

## 📜 5. Audit Logging APIs (`/api/audit-logs`)

- `GET /api/audit-logs/my` — Returns current user's action audit trail (e.g. `USER_REGISTER`, `AI_CHAT_COMPLETED`, `CONVERSATION_CREATED`, `MESSAGE_EDITED`).
- `GET /api/audit-logs` — System-wide logs (Admin only, paginated).

---

## 💻 Full Frontend Client Integration (Axios + TypeScript)

Use this complete service module in your React/Electron frontend (`frontend/src/renderer/src/api/`):

```typescript
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('shrey_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh token on 401
apiClient.interceptors.response.use(
  (res) => res,
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
          return apiClient(originalRequest);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Types
export interface Conversation {
  id: string;
  userId: string;
  title: string;
  isPinned: boolean;
  modelProvider: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  voiceScript?: string;
  provider?: string;
  toolsUsed?: string[];
  isEdited: boolean;
  timestamp: string;
  editedAt?: string;
}

export interface ChatApiResponse {
  response: string;
  voice_script: string;
  tools_executed: string[];
  conversationId: string;
  userMessageId: string;
  assistantMessageId: string;
  provider: string;
  status: string;
}

// API Functions
export const ChatAPI = {
  // 1. Send Message to AI
  sendMessage: async (message: string, conversationId?: string, provider = 'groq') => {
    const res = await apiClient.post<ChatApiResponse>('/ai/chat', {
      message,
      conversationId,
      provider,
      include_voice_script: true,
    });
    return res.data;
  },

  // 2. Conversation Management
  getConversations: async () => {
    const res = await apiClient.get<{ success: boolean; data: Conversation[] }>('/chat/conversations');
    return res.data.data;
  },

  createConversation: async (title = 'New Chat', modelProvider = 'groq') => {
    const res = await apiClient.post<{ success: boolean; data: Conversation }>('/chat/conversations', {
      title,
      modelProvider,
    });
    return res.data.data;
  },

  getConversationDetails: async (conversationId: string) => {
    const res = await apiClient.get<{ success: boolean; data: { conversation: Conversation; messages: ChatMessage[] } }>(
      `/chat/conversations/${conversationId}`
    );
    return res.data.data;
  },

  updateConversation: async (conversationId: string, title?: string, isPinned?: boolean) => {
    const res = await apiClient.put<{ success: boolean; data: Conversation }>(`/chat/conversations/${conversationId}`, {
      title,
      isPinned,
    });
    return res.data.data;
  },

  deleteConversation: async (conversationId: string) => {
    const res = await apiClient.delete(`/chat/conversations/${conversationId}`);
    return res.data;
  },

  // 3. Message CRUD
  editMessage: async (messageId: string, content: string) => {
    const res = await apiClient.put<{ success: boolean; data: ChatMessage }>(`/chat/messages/${messageId}`, { content });
    return res.data.data;
  },

  deleteMessage: async (messageId: string) => {
    const res = await apiClient.delete(`/chat/messages/${messageId}`);
    return res.data;
  },
};
```
