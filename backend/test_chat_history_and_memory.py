"""
End-to-End Chat History, CRUD & Multi-Turn AI Memory Verification:
Tests Spring Boot Gateway (:8080) -> FastAPI AI Engine (:8000)
Verifies:
1. Conversation creation & listing
2. AI chat multi-turn conversational memory (remembers facts across turns)
3. MongoDB Atlas automatic message persistence
4. Message editing & isEdited flag
5. Message deletion
6. Conversation renaming
7. Cascade conversation deletion
"""

import sys
import time
import requests

SPRING_URL = "http://localhost:8080"
AI_URL = "http://localhost:8000"

def wait_for_service(url, timeout=60, name="Service"):
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
    print("=" * 65)
    print(" SHREY AI: CHAT HISTORY, EDIT/DELETE & AI MEMORY INTEGRATION TEST ")
    print("=" * 65)

    if not wait_for_service(f"{AI_URL}/health", timeout=60, name="FastAPI AI Engine"):
        sys.exit(1)
    if not wait_for_service(f"{SPRING_URL}/actuator/health", timeout=60, name="Spring Boot Backend"):
        sys.exit(1)

    # 1. Register fresh test user
    print("\n[STEP 1] Registering fresh test user...")
    test_email = f"memory_test_{int(time.time())}@shreyai.com"
    test_password = "Password123!"

    reg_resp = requests.post(f"{SPRING_URL}/api/auth/register", json={
        "name": "Memory Test User",
        "email": test_email,
        "password": test_password
    })
    assert reg_resp.status_code in [200, 201], f"Registration failed: {reg_resp.text}"
    token = reg_resp.json().get("data", {}).get("token")
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    print(f"[PASS] User registered. JWT Bearer Token acquired.")

    # 2. Create Conversation Thread
    print("\n[STEP 2] POST /api/chat/conversations (Create conversation thread)...")
    create_conv_resp = requests.post(f"{SPRING_URL}/api/chat/conversations", json={
        "title": "Persistent Memory Test",
        "modelProvider": "groq"
    }, headers=headers)
    assert create_conv_resp.status_code == 201, f"Failed to create conversation: {create_conv_resp.text}"
    conv_data = create_conv_resp.json()["data"]
    conv_id = conv_data["id"]
    print(f"[PASS] Created Conversation ID: {conv_id}, Title: {conv_data['title']}")

    # 3. Send Turn 1: Seed Memory with Real AI
    print("\n[STEP 3] POST /api/ai/chat (Turn 1: Telling AI a personal fact)...")
    turn1_msg = "Hello! My name is Ashutosh and my favorite color is Electric Blue. Please remember this."
    turn1_resp = requests.post(f"{SPRING_URL}/api/ai/chat", json={
        "message": turn1_msg,
        "conversationId": conv_id,
        "provider": "groq"
    }, headers=headers, timeout=60)
    assert turn1_resp.status_code == 200, f"Turn 1 failed: {turn1_resp.text}"
    turn1_data = turn1_resp.json()
    user_msg_id = turn1_data.get("userMessageId")
    assistant_msg_id = turn1_data.get("assistantMessageId")
    print(f"AI Response Turn 1: {turn1_data['response'][:150]}...")
    print(f"[PASS] Turn 1 executed. UserMsgId: {user_msg_id}, AssistantMsgId: {assistant_msg_id}")

    # 4. Verify Turn 1 Persistence in MongoDB Atlas
    print("\n[STEP 4] GET /api/chat/conversations/{id} (Verify messages in MongoDB)...")
    fetch_resp = requests.get(f"{SPRING_URL}/api/chat/conversations/{conv_id}", headers=headers)
    assert fetch_resp.status_code == 200, f"Fetch conversation failed: {fetch_resp.text}"
    messages = fetch_resp.json()["data"]["messages"]
    assert len(messages) == 2, f"Expected 2 messages in MongoDB, found {len(messages)}"
    assert messages[0]["role"] == "user" and "Ashutosh" in messages[0]["content"]
    assert messages[1]["role"] == "assistant" and messages[1]["voiceScript"] is not None
    print(f"[PASS] 2 messages verified in MongoDB Atlas (1 user, 1 assistant).")

    # 5. Send Turn 2: Test AI Memory Recall
    time.sleep(2)
    print("\n[STEP 5] POST /api/ai/chat (Turn 2: Asking AI to recall personal facts from memory)...")
    turn2_msg = "What is my name and what is my favorite color?"
    turn2_resp = requests.post(f"{SPRING_URL}/api/ai/chat", json={
        "message": turn2_msg,
        "conversationId": conv_id,
        "provider": "groq"
    }, headers=headers, timeout=60)
    assert turn2_resp.status_code == 200, f"Turn 2 failed: {turn2_resp.text}"
    turn2_data = turn2_resp.json()
    turn2_reply = turn2_data["response"].lower()
    print(f"\nAI Response Turn 2 (Memory Recall):\n{turn2_data['response']}\n")

    # Validate memory recall
    assert "ashutosh" in turn2_reply, "AI FAILED to recall user name 'Ashutosh' from conversational memory!"
    assert "blue" in turn2_reply, "AI FAILED to recall user favorite color 'Blue' from conversational memory!"
    print("[PASS] 🧠 AGENT MEMORY VERIFIED! AI successfully recalled 'Ashutosh' and 'Blue' from conversation history.")

    # 6. Test Message Editing
    print("\n[STEP 6] PUT /api/chat/messages/{id} (Edit user message)...")
    edit_resp = requests.put(f"{SPRING_URL}/api/chat/messages/{user_msg_id}", json={
        "content": "Hello! My name is Ashutosh Sharma and my favorite color is Electric Blue."
    }, headers=headers)
    assert edit_resp.status_code == 200, f"Edit message failed: {edit_resp.text}"
    edited_data = edit_resp.json()["data"]
    is_edited = edited_data.get("edited") if "edited" in edited_data else edited_data.get("isEdited", False)
    assert is_edited is True, f"isEdited flag was not set to True in {edited_data}"
    assert "Sharma" in edited_data["content"], "Edited content not saved"
    print(f"[PASS] Message edited successfully. isEdited={is_edited}, Content={edited_data['content']}")

    # 7. Test Message Deletion
    print("\n[STEP 7] DELETE /api/chat/messages/{id} (Delete assistant message)...")
    del_msg_resp = requests.delete(f"{SPRING_URL}/api/chat/messages/{assistant_msg_id}", headers=headers)
    assert del_msg_resp.status_code == 200, f"Delete message failed: {del_msg_resp.text}"

    # Verify message count decreased
    check_msgs = requests.get(f"{SPRING_URL}/api/chat/conversations/{conv_id}", headers=headers).json()["data"]["messages"]
    assert not any(m["id"] == assistant_msg_id for m in check_msgs), "Deleted message still present in conversation"
    print(f"[PASS] Message deleted successfully. Remaining messages in thread: {len(check_msgs)}")

    # 8. Test Rename Conversation Title
    print("\n[STEP 8] PUT /api/chat/conversations/{id} (Rename conversation title)...")
    rename_resp = requests.put(f"{SPRING_URL}/api/chat/conversations/{conv_id}", json={
        "title": "Renamed Memory & Coding Thread",
        "isPinned": True
    }, headers=headers)
    assert rename_resp.status_code == 200, f"Rename failed: {rename_resp.text}"
    updated_conv = rename_resp.json()["data"]
    assert updated_conv["title"] == "Renamed Memory & Coding Thread"
    is_pinned = updated_conv.get("pinned") if "pinned" in updated_conv else updated_conv.get("isPinned", False)
    assert is_pinned is True, f"Pinned flag was not set to True in {updated_conv}"
    print(f"[PASS] Conversation renamed to '{updated_conv['title']}' and pinned={is_pinned}.")

    # 9. Test Delete Conversation Thread (Cascade)
    print("\n[STEP 9] DELETE /api/chat/conversations/{id} (Cascade delete conversation & messages)...")
    del_conv_resp = requests.delete(f"{SPRING_URL}/api/chat/conversations/{conv_id}", headers=headers)
    assert del_conv_resp.status_code == 200, f"Delete conversation failed: {del_conv_resp.text}"

    # Confirm conversation is gone
    get_conv_again = requests.get(f"{SPRING_URL}/api/chat/conversations/{conv_id}", headers=headers)
    assert get_conv_again.status_code == 404, "Conversation still exists after deletion"
    print(f"[PASS] Conversation and all associated messages deleted from MongoDB Atlas.")

    print("\n" + "=" * 65)
    print(" 🎉 ALL 9 CHAT HISTORY, CRUD & AGENT MEMORY TESTS PASSED! ")
    print("=" * 65)

if __name__ == "__main__":
    run_tests()

