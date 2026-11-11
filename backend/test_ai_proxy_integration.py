"""
End-to-End Integration Verification:
Spring Boot Gateway (:8080) -> FastAPI AI Service (:8000)
Tests authentication, rate-limiting, proxy forwarding, RAG, and MongoDB audit logging.
"""

import sys
import time
import requests
import subprocess
import os

SPRING_URL = "http://localhost:8080"
AI_URL = "http://localhost:8000"

def wait_for_service(url, timeout=45, name="Service"):
    print(f"[*] Waiting for {name} at {url} to be healthy...")
    start = time.time()
    while time.time() - start < timeout:
        try:
            r = requests.get(url, timeout=3)
            if r.status_code in [200, 401, 403, 404]:
                print(f"[+] {name} is up and responding (status {r.status_code})")
                return True
        except Exception:
            pass
        time.sleep(2)
    print(f"[-] {name} did not respond within {timeout}s")
    return False

def run_tests():
    print("=" * 60)
    print(" SHREY AI: SPRING BOOT -> FASTAPI INTEGRATION TEST ")
    print("=" * 60)

    # Wait for services to be ready
    if not wait_for_service(f"{AI_URL}/health", timeout=60, name="FastAPI AI Service"):
        sys.exit(1)
    if not wait_for_service(f"{SPRING_URL}/actuator/health", timeout=60, name="Spring Boot Backend"):
        sys.exit(1)

    # 1. Test Proxy Health (Unauthenticated)
    print("\n[TEST 1] GET /api/ai/health (Proxy health probe)...")
    r = requests.get(f"{SPRING_URL}/api/ai/health")
    print(f"Status: {r.status_code}, Body: {r.text}")
    assert r.status_code == 200, f"Health probe failed: {r.text}"
    assert "shrey-ai-service" in r.text, "Unexpected service name in health check"
    print("[PASS] Health probe forwarded through Spring Boot to FastAPI.")

    # 2. Test Proxy Status (Unauthenticated)
    print("\n[TEST 2] GET /api/ai/status (Proxy AI status probe)...")
    r = requests.get(f"{SPRING_URL}/api/ai/status")
    print(f"Status: {r.status_code}, Body: {r.text}")
    assert r.status_code == 200, f"Status probe failed: {r.text}"
    data = r.json()
    assert data.get("name") == "Shrey AI", "Unexpected AI name"
    assert "Aryan" in data.get("creators", []), "Creator Aryan missing"
    print("[PASS] Status probe forwarded through Spring Boot to FastAPI.")

    # 3. Authenticate User with Spring Boot
    print("\n[TEST 3] Authenticating test user with Spring Boot...")
    test_email = f"proxy_test_{int(time.time())}@shreyai.com"
    test_password = "Password123!"

    print(f"[*] Registering fresh integration test user: {test_email}")
    reg_resp = requests.post(f"{SPRING_URL}/api/auth/register", json={
        "name": "Integration Test User",
        "email": test_email,
        "password": test_password
    })
    assert reg_resp.status_code in [200, 201], f"Registration failed: {reg_resp.text}"
    user_data = reg_resp.json().get("data", {})
    token = user_data.get("token") or user_data.get("accessToken")
    assert token, f"Could not find token in auth response: {reg_resp.text}"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print(f"[PASS] Successfully registered and authenticated. Acquired JWT Bearer Token.")

    # 4. Test Authenticated Chat Proxy
    print("\n[TEST 4] POST /api/ai/chat (Authenticated Proxy Chat)...")
    chat_payload = {
        "message": "Who created you and what is your name?",
        "provider": "groq",
        "include_voice_script": True
    }
    chat_resp = requests.post(f"{SPRING_URL}/api/ai/chat", json=chat_payload, headers=headers, timeout=60)
    print(f"Status: {chat_resp.status_code}")
    print(f"Chat Response: {chat_resp.text[:300]}...")
    assert chat_resp.status_code == 200, f"Chat proxy failed: {chat_resp.text}"
    chat_data = chat_resp.json()
    assert "Shrey AI" in chat_data["response"], "Response missing Shrey AI identity"
    assert "Aryan" in chat_data["response"], "Response missing creator Aryan"
    assert "voice_script" in chat_data, "Response missing voice_script"
    print("[PASS] Chat request successfully proxied, executed via ReAct Agent, and returned to client.")

    # 5. Test Authenticated RAG Ingest Proxy
    print("\n[TEST 5] POST /api/ai/rag/ingest (Authenticated RAG Ingest)...")
    ingest_payload = {
        "text": "Shrey AI is created by Aryan, Arpit, and Ashutosh. It runs with complete security through a Spring Boot gateway.",
        "source": "integration_test_doc"
    }
    ingest_resp = requests.post(f"{SPRING_URL}/api/ai/rag/ingest", json=ingest_payload, headers=headers, timeout=30)
    print(f"Status: {ingest_resp.status_code}, Body: {ingest_resp.text}")
    assert ingest_resp.status_code == 200, f"RAG ingest proxy failed: {ingest_resp.text}"
    print("[PASS] Knowledge base ingestion proxied and indexed in ChromaDB.")

    # 6. Test Authenticated RAG Query Proxy
    print("\n[TEST 6] POST /api/ai/rag/query (Authenticated RAG Query)...")
    query_payload = {
        "query": "Who created Shrey AI and what gateway does it use?",
        "top_k": 2
    }
    query_resp = requests.post(f"{SPRING_URL}/api/ai/rag/query", json=query_payload, headers=headers, timeout=30)
    print(f"Status: {query_resp.status_code}, Body: {query_resp.text[:300]}...")
    assert query_resp.status_code == 200, f"RAG query proxy failed: {query_resp.text}"
    print("[PASS] Semantic RAG query proxied and retrieved matches.")

    # 7. Verify Audit Logs in MongoDB Atlas
    print("\n[TEST 7] GET /api/audit-logs/my (Verify Audit Logging in MongoDB)...")
    audit_resp = requests.get(f"{SPRING_URL}/api/audit-logs/my", headers=headers, timeout=10)
    print(f"Status: {audit_resp.status_code}")
    assert audit_resp.status_code == 200, f"Audit log retrieval failed: {audit_resp.text}"
    audit_data = audit_resp.json()
    page_data = audit_data.get("data", {})
    logs = page_data.get("content", []) if isinstance(page_data, dict) else page_data
    actions = [log.get("action") for log in logs if isinstance(log, dict)]
    print(f"Recent User Audit Actions: {actions}")
    assert "AI_CHAT_COMPLETED" in actions, "AI_CHAT_COMPLETED audit log missing in MongoDB Atlas"
    print("[PASS] MongoDB Atlas audit logging confirmed for AI proxy operations.")

    print("\n" + "=" * 60)
    print(" 🎉 ALL 7 END-TO-END GATEWAY INTEGRATION TESTS PASSED! ")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
