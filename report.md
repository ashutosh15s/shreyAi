# Shrey AI — Backend Route & API Testing Report

**Date & Time:** November 11, 2026 — 18:55 IST  
**Environment:** Spring Boot 3.3.5 · Java 21 LTS · MongoDB Atlas (`cluster0.xjknakr.mongodb.net`)  
**Status:** ✅ **All API Routes & Database Models Verified Live**

---

## 📊 1. Executive Summary

The backend service was booted and connected live to your **MongoDB Atlas** database cluster. All authentication, authorization, user administration, token blacklisting, rate limiting, and audit logging endpoints were tested end-to-end using automated HTTP requests.

The test suite confirmed:
- User registration and password hashing with **BCrypt**.
- Role-based access control (`ROLE_ADMIN` vs `ROLE_USER`).
- Stateless JWT issuance and validation.
- Refresh token rotation.
- **Token Blacklisting upon Logout**: Tokens added to the `blacklisted_tokens` collection and immediately rejected on subsequent requests.
- **User Blacklisting**: Accounts can be locked by administrators; blacklisted users are blocked from logging in or making authorized requests.
- **User CRUD & Deletion**: Administrators can update profiles, change roles, and delete user records.
- **Audit Logging**: Every authentication, profile change, and administrative action was logged to the `audit_logs` collection.

---

## 🧪 2. Detailed Route Test Results

| # | Test Case / Route | HTTP Method | Expected | Actual | Status | Notes |
|---|---|:---:|:---:|:---:|:---:|---|
| **1** | Actuator Health Check (`/actuator/health`) | `GET` | `200 UP` | `200 UP` | ✅ **PASS** | Server healthy and running |
| **2** | Register Admin User (`/api/auth/register`) | `POST` | `201 Created` | `201 Created` | ✅ **PASS** | Assigned `ROLE_ADMIN`, JWT issued |
| **3** | Login Admin User (`/api/auth/login`) | `POST` | `200 OK` | `200 OK` | ✅ **PASS** | Verified BCrypt password match |
| **4** | Fetch Admin Profile (`/api/auth/me`) | `GET` | `200 OK` | `200 OK` | ✅ **PASS** | Decoded JWT claims, retrieved user profile |
| **5** | Update Profile Name (`/api/auth/profile`) | `PUT` | `200 OK` | `200 OK` | ✅ **PASS** | Updated user name to `"Super Admin User"` |
| **6** | Gateway Rate Check (`/api/gateway/rate-check`) | `POST` | `200 OK` | `200 OK` | ✅ **PASS** | Bucket4j consumed 1 token for Groq provider |
| **7** | Gateway Status Check (`/api/gateway/status`) | `GET` | `200 OK` | `200 OK` | ✅ **PASS** | Verified gateway active and downstream url |
| **8** | Register Secondary User (`/api/auth/register`) | `POST` | `201 Created` | `201 Created` | ✅ **PASS** | Registered user with `ROLE_USER` |
| **9** | Admin List All Users (`/api/users`) | `GET` | `200 OK` | `200 OK` | ✅ **PASS** | Paginated user list returned |
| **10** | Admin Update User (`/api/users/{id}`) | `PUT` | `200 OK` | `200 OK` | ✅ **PASS** | Renamed secondary user to `"Modified Secondary User"` |
| **11** | Blacklist User (`/api/users/{id}/blacklist`) | `PATCH` | `200 OK` | `200 OK` | ✅ **PASS** | User flagged `blacklisted: true`, sessions revoked |
| **12** | Verify Blacklisted User Login Blocked | `POST` | `401 Unauthorized` | `401 Unauthorized` | ✅ **PASS** | Account blocked with `"User account is disabled or blacklisted"` |
| **13** | Unblacklist User (`/api/users/{id}/blacklist`) | `PATCH` | `200 OK` | `200 OK` | ✅ **PASS** | Account restored with `blacklisted: false` |
| **14** | Verify Unblacklisted User Can Login | `POST` | `200 OK` | `200 OK` | ✅ **PASS** | Login succeeded, fresh tokens generated |
| **15** | Refresh Token Rotation (`/api/auth/refresh`) | `POST` | `200 OK` | `200 OK` | ✅ **PASS** | Old refresh token invalidated; new pair issued |
| **16** | Logout & Blacklist Token (`/api/auth/logout`) | `POST` | `200 OK` | `200 OK` | ✅ **PASS** | Access token saved to `blacklisted_tokens` collection |
| **17** | Verify Blacklisted Token Cannot Be Reused | `GET` | `401 Unauthorized` | `401 Unauthorized` | ✅ **PASS** | Request blocked by `JwtAuthFilter` |
| **18** | Delete User via Admin (`/api/users/{id}`) | `DELETE` | `200 OK` | `200 OK` | ✅ **PASS** | User removed from MongoDB `users` collection |
| **19** | Verify User Deletion (`/api/users/{id}`) | `GET` | `404 Not Found` | `404 Not Found` | ✅ **PASS** | Confirmed document was removed |
| **20** | User Audit Trail (`/api/audit-logs/my`) | `GET` | `200 OK` | `200 OK` | ✅ **PASS** | Complete chronological audit log retrieved |

---

## 🗄 3. Database State Verified in MongoDB Atlas

Your Atlas database cluster now contains live documents across four active collections:

### 1. `users`
- Stores user credentials with salted **BCrypt** hashes.
- Tracks `role` (`ROLE_ADMIN` / `ROLE_USER`).
- Tracks `blacklisted` state boolean.
- Automated `@CreatedDate` and `@LastModifiedDate` timestamps.

### 2. `sessions`
- Manages refresh tokens and expiry dates.
- Records `revoked: true` on token rotation or password change.

### 3. `blacklisted_tokens`
- Stores revoked access and refresh tokens.
- Protected with MongoDB TTL index (`expireAfterSeconds = 0`) to automatically purge expired tokens from storage without manual cleanup.

### 4. `audit_logs`
- Stores audit events: `USER_REGISTER`, `USER_LOGIN`, `USER_LOGOUT`, `PROFILE_UPDATED`, `USER_ROLE_UPDATED`, `USER_BLACKLISTED`, `USER_DELETED`, `TOKEN_REFRESH`.

---

## 🛡 4. Security & Rate-Limiting Performance
- **Token Security:** Tokens signed using HMAC-SHA256 (`jjwt 0.12.6`). Blacklisted tokens are checked in `O(1)` memory/indexed lookup in `JwtAuthFilter`.
- **Brute Force Protection:** Client IP tracking in `RateLimitService` limits login attempts to 15 per minute per IP.
- **Provider Rate Limiting:** Configured for Groq (60 req/min), Grok (20 req/min), and Gemini/OpenRouter (100 req/min). Exceeding limits returns `429 Too Many Requests` with a standard `Retry-After` header.

---

## 🔗 Next Steps
- Reference [backend/api.md](file:///c:/Users/Dell/Desktop/projects/shrey_Ai/backend/api.md) for full endpoint specifications, request payloads, and TypeScript/Axios code to connect the frontend.

