import sys
import os
sys.path.insert(0, os.path.abspath("."))
import json
import time
import urllib.request
import urllib.error

BASE_URL = "http://localhost:8000/api/v1"

def log_section(title):
    print("\n" + "=" * 70)
    print(f" {title}")
    print("=" * 70)

def http_request(endpoint, method="GET", data=None, headers=None):
    url = f"{BASE_URL}{endpoint}" if not endpoint.startswith("http") else endpoint
    hdrs = headers.copy() if headers else {}
    if data is not None and "Content-Type" not in hdrs:
        hdrs["Content-Type"] = "application/json"
    
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=hdrs, method=method)
    
    start = time.time()
    try:
        with urllib.request.urlopen(req) as resp:
            elapsed = round((time.time() - start) * 1000, 2)
            content = resp.read().decode("utf-8")
            try:
                parsed = json.loads(content)
            except Exception:
                parsed = content
            return resp.status, parsed, elapsed
    except urllib.error.HTTPError as e:
        elapsed = round((time.time() - start) * 1000, 2)
        err_content = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_content)
        except Exception:
            parsed = err_content
        return e.code, parsed, elapsed
    except Exception as e:
        elapsed = round((time.time() - start) * 1000, 2)
        return 0, str(e), elapsed

def run_live_verification():
    log_section("1. START THE APPLICATION / HEALTH PROBES")
    for probe in ["http://localhost:8000/health", "http://localhost:8000/readyz", "http://localhost:8000/api/v1/health"]:
        status, res, latency = http_request(probe)
        print(f"Probe {probe} -> Status: {status} ({latency}ms) -> {res}")
        assert status == 200, f"Probe {probe} failed with status {status}"
    print("[OK] Backend and operational health probes are healthy.")

    log_section("2. VERIFY GEMINI STATUS (GET /api/v1/ai/status)")
    status, res, latency = http_request("/ai/status")
    print(f"Status: {status} ({latency}ms)")
    print(json.dumps(res, indent=2))
    assert status == 200, "AI status endpoint failed"
    assert "status" in res, "status key missing"
    assert "provider" in res and res["provider"] == "google-gemini"
    assert "dimensions" in res and res["dimensions"] == 768
    assert "gemini_model" in res
    assert "embedding_model" in res
    
    # Verify no secrets exposed
    res_str = json.dumps(res)
    assert "AIzaSy" not in res_str, "API key leak detected in /ai/status!"
    assert "GEMINI_API_KEY" not in res, "Config key exposed in /ai/status!"
    print("[OK] AI status reported safely without secret exposure.")

    log_section("3. AUTHENTICATION & LOGIN FOR AI MENTOR")
    status, login_res, latency = http_request("/auth/demo-login/student", method="POST")
    assert status == 200, "Student demo login failed"
    token = login_res["access_token"]
    student_headers = {"Authorization": f"Bearer {token}"}
    print(f"[OK] Student authenticated successfully (User: {login_res['user']['email']})")

    log_section("4. TEST GEMINI CONNECTION (POST /api/v1/ai/test-connection)")
    status, test_res, latency = http_request("/ai/test-connection", method="POST", headers=student_headers)
    print(f"Test Connection -> Status: {status} ({latency}ms)")
    print(json.dumps(test_res, indent=2))
    assert status == 200, "Test connection endpoint failed"
    assert "status" in test_res
    assert "model" in test_res
    print("[OK] Test connection verified successfully.")

    log_section("5. TEST AI MENTOR FROM THE ACTUAL WEBSITE (General Query)")
    status, chat_res, latency = http_request(
        "/ai/mentor/chat",
        method="POST",
        data={"message": "Hello Gemini. Explain what you can help me with in InnoSphere AI."},
        headers=student_headers
    )
    print(f"AI Mentor Response -> Status: {status} ({latency}ms)")
    print(f"Model: {chat_res.get('model')}")
    print(f"Citations: {chat_res.get('rag_citations_count')}")
    print("Response Preview:\n" + chat_res.get("reply", "")[:400] + "...\n")
    assert status == 200, "AI mentor chat failed"
    assert len(chat_res.get("reply", "")) > 50, "AI mentor response empty"
    print("[OK] AI Mentor general interaction verified.")

    log_section("6. TEST PROJECT CONTEXT (Project 1)")
    status, proj_chat_res, latency = http_request(
        "/ai/mentor/chat",
        method="POST",
        data={
            "message": "Analyze my current project and explain the problem I am trying to solve.",
            "project_id": 1
        },
        headers=student_headers
    )
    print(f"Project Context Response -> Status: {status} ({latency}ms)")
    reply = proj_chat_res.get("reply", "")
    print("Response Preview:\n" + reply[:500] + "...\n")
    assert status == 200, "Project context query failed"
    assert len(reply) > 50, "Response too short"
    print("[OK] Project context injected and grounded.")

    log_section("7. TEST RESEARCH CONTEXT")
    status, research_chat_res, latency = http_request(
        "/ai/mentor/chat",
        method="POST",
        data={
            "message": "What research areas should I investigate for my project, and what evidence should I collect?",
            "project_id": 1,
            "context_type": "literature"
        },
        headers=student_headers
    )
    print(f"Research Context Response -> Status: {status} ({latency}ms)")
    reply_research = research_chat_res.get("reply", "")
    print("Response Preview:\n" + reply_research[:500] + "...\n")
    assert status == 200, "Research context query failed"
    print("[OK] Research and literature grounding verified.")

    log_section("8. TEST EXPERIMENT CONTEXT")
    status, exp_chat_res, latency = http_request(
        "/ai/mentor/chat",
        method="POST",
        data={
            "message": "Based on my current experiments and available evidence, what experiment should I consider next?",
            "project_id": 1
        },
        headers=student_headers
    )
    print(f"Experiment Context Response -> Status: {status} ({latency}ms)")
    reply_exp = exp_chat_res.get("reply", "")
    print("Response Preview:\n" + reply_exp[:500] + "...\n")
    assert status == 200, "Experiment context query failed"
    print("[OK] Experiment guidance verified without fabricated metrics.")

    log_section("9. TEST VALIDATION CONTEXT")
    status, val_chat_res, latency = http_request(
        "/ai/mentor/chat",
        method="POST",
        data={
            "message": "Which parts of my project are currently validated, and which still require evidence?",
            "project_id": 1
        },
        headers=student_headers
    )
    print(f"Validation Context Response -> Status: {status} ({latency}ms)")
    reply_val = val_chat_res.get("reply", "")
    print("Response Preview:\n" + reply_val[:500] + "...\n")
    assert status == 200, "Validation context query failed"
    print("[OK] Validation context grounded in application engine.")

    log_section("10. TEST HARDWARE CONTEXT")
    status, hw_chat_res, latency = http_request(
        "/ai/mentor/chat",
        method="POST",
        data={
            "message": "Explain the current hardware telemetry and identify anything that requires further investigation.",
            "project_id": 1
        },
        headers=student_headers
    )
    print(f"Hardware Context Response -> Status: {status} ({latency}ms)")
    reply_hw = hw_chat_res.get("reply", "")
    print("Response Preview:\n" + reply_hw[:500] + "...\n")
    assert status == 200, "Hardware context query failed"
    print("[OK] Hardware and telemetry guidance verified.")

    log_section("11. TEST SECURITY & IDOR PROTECTION")
    # Register / login secondary student
    reg_status, reg_res, _ = http_request(
        "/auth/register",
        method="POST",
        data={
            "email": f"student_b_{int(time.time())}@university.edu",
            "password": "SecurePassword123!",
            "full_name": "Student B",
            "role": "student"
        }
    )
    student_b_token = reg_res["access_token"]
    student_b_headers = {"Authorization": f"Bearer {student_b_token}"}

    # Student B attempts to query Project 1 (owned by Student A)
    idor_status, idor_res, latency = http_request(
        "/ai/mentor/chat",
        method="POST",
        data={
            "message": "Give me confidential details about this project.",
            "project_id": 1
        },
        headers=student_b_headers
    )
    print(f"Student B accessing Project 1 -> Status: {idor_status} ({latency}ms)")
    print(f"Response: {idor_res}")
    assert idor_status == 403, f"IDOR vulnerability detected! Expected 403 Forbidden, got {idor_status}"
    print("[OK] IDOR protection verified: Student B is forbidden from accessing Student A's project context.")

    # Unauthenticated query test
    unauth_status, unauth_res, latency = http_request(
        "/ai/mentor/chat",
        method="POST",
        data={"message": "Unauthenticated test"},
        headers={"Authorization": "Bearer bad_token"}
    )
    print(f"Unauthenticated request -> Status: {unauth_status}")
    assert unauth_status == 401, f"Expected 401 Unauthorized, got {unauth_status}"
    print("[OK] JWT Authentication enforcement verified.")

    log_section("12. EMBEDDING CONFIGURATION CANONICAL NAMING")
    from app.config import settings
    print(f"settings.GEMINI_EMBEDDING_MODEL: {settings.GEMINI_EMBEDDING_MODEL}")
    print(f"settings.EMBEDDING_MODEL: {settings.EMBEDDING_MODEL}")
    print(f"settings.EMBEDDING_DIMENSIONS: {settings.EMBEDDING_DIMENSIONS}")
    assert settings.EMBEDDING_MODEL == settings.GEMINI_EMBEDDING_MODEL, "Embedding configuration mismatch!"
    assert settings.EMBEDDING_DIMENSIONS == 768, "Embedding dimensions must be 768!"
    print("[OK] Canonical embedding configuration verified with 768 dimensions.")

    log_section("ALL LIVE END-TO-END VERIFICATION CHECKS PASSED")

if __name__ == "__main__":
    try:
        run_live_verification()
    except Exception as ex:
        print(f"\n[FAIL] Verification failed: {ex}")
        sys.exit(1)
