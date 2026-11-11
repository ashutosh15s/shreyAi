"""
Automated Route & Pipeline Verification for Shrey AI FastAPI Service.
Tests all endpoints: root, health, status, RAG ingestion, RAG query, and chat.
"""

import os
import sys
import json
from fastapi.testclient import TestClient

# Ensure current dir is in Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app

client = TestClient(app)


def test_endpoint(name: str, method: str, path: str, payload=None):
    print(f"\n========================================================")
    print(f"RUNNING TEST: {name}")
    print(f"Method: {method} | Path: {path}")
    if payload:
        print(f"Payload: {json.dumps(payload, indent=2)}")

    if method == "GET":
        response = client.get(path)
    elif method == "POST":
        response = client.post(path, json=payload)
    else:
        raise ValueError(f"Unsupported method: {method}")

    print(f"Status Code: {response.status_code}")
    try:
        data = response.json()
        print(f"Response Body:\n{json.dumps(data, indent=2)}")
    except Exception:
        print(f"Raw Response: {response.text}")

    assert response.status_code == 200, f"Expected 200 OK, got {response.status_code}"
    print(f"RESULT: PASS [OK]")
    return response.json()


def run_full_suite():
    print("STARTING SHREY AI SERVICE ENDPOINT VERIFICATION SUITE")
    print("=" * 56)

    # 1. Root
    test_endpoint("1. Root Endpoint", "GET", "/")

    # 2. Health
    test_endpoint("2. Health Check", "GET", "/health")

    # 3. AI Status
    test_endpoint("3. AI Status Probe", "GET", "/ai/status")

    # 4. RAG Ingest
    test_endpoint(
        "4. RAG Ingestion",
        "POST",
        "/ai/rag/ingest",
        {
            "text": "Shrey AI features an intelligent voice assistant architecture designed by Aryan, Arpit, and Ashutosh. It combines Electron on the desktop with Spring Boot and FastAPI.",
            "source": "architecture_overview.md",
            "metadata": {"category": "system_design", "version": "1.0.0"}
        }
    )

    # 5. RAG Semantic Query
    test_endpoint(
        "5. RAG Semantic Query",
        "POST",
        "/ai/rag/query",
        {
            "query": "Who designed Shrey AI and what are its components?",
            "top_k": 2
        }
    )

    # 6. Chat with Shrey AI (Text Chat)
    test_endpoint(
        "6. Chat Endpoint (Identity & Voice Script)",
        "POST",
        "/ai/chat",
        {
            "message": "Who created you and what is your name?",
            "thread_id": "test_session_001",
            "provider": "openrouter",
            "include_voice_script": True
        }
    )

    print("\n" + "=" * 56)
    print("ALL 6 ENDPOINTS VERIFIED SUCCESSFULLY!")


if __name__ == "__main__":
    run_full_suite()

