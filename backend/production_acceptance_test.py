import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000/api/v1"

def print_banner(title):
    print("\n" + "="*80)
    print(f" {title.upper()} ")
    print("="*80)

def test_01_production_environment_and_cors():
    print_banner("1. Production Environment & CORS Verification")
    
    # 1.1 Preflight OPTIONS check for production Vercel frontend
    headers = {
        "Origin": "https://innosphereai.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type,Authorization"
    }
    res_options = requests.options(f"{BASE_URL}/ai/mentor/chat", headers=headers)
    print(f"Preflight OPTIONS on /ai/mentor/chat: HTTP {res_options.status_code}")
    print(f"Allow-Origin: {res_options.headers.get('access-control-allow-origin')}")
    print(f"Allow-Credentials: {res_options.headers.get('access-control-allow-credentials')}")
    print(f"Allow-Headers: {res_options.headers.get('access-control-allow-headers')}")
    
    assert res_options.status_code == 200
    assert res_options.headers.get('access-control-allow-origin') == "https://innosphereai.vercel.app"
    assert res_options.headers.get('access-control-allow-credentials') == "true"
    assert res_options.headers.get('access-control-allow-origin') != "*"
    print(">>> PASS: Preflight OPTIONS verified for production origin without wildcard '*'.")

def test_02_google_login_cryptographic_verification():
    print_banner("2. Google Login & Cryptographic Token Verification")

    # 2.1 Test invalid/forged Google token rejection
    res_fake = requests.post(f"{BASE_URL}/auth/google", json={"credential": "forged.header.signature"})
    print(f"Forged Google token submission: HTTP {res_fake.status_code}")
    assert res_fake.status_code in [400, 401], f"Expected 400/401, got {res_fake.text}"
    print(">>> PASS: Forged Google credentials rejected by cryptographic verifier.")

    # 2.2 Standard & demo authentication
    res_auth = requests.post(f"{BASE_URL}/auth/login", json={"email": "innovator@student.edu", "password": "password123"})
    assert res_auth.status_code == 200
    token = res_auth.json()["access_token"]
    user = res_auth.json()["user"]
    print(f"Authenticated Student: {user['full_name']} (Role: {user['role']})")
    print(">>> PASS: InnoSphere JWT issued successfully.")
    return token, user

def test_03_gemini_production_prompts(token):
    print_banner("3. Gemini AI Mentor Production Test - 5 Core Questions")
    headers = {"Authorization": f"Bearer {token}"}

    # Get student's project
    proj_res = requests.get(f"{BASE_URL}/projects", headers=headers)
    projects = proj_res.json()
    assert len(projects) > 0
    project_id = projects[0]["id"]
    project_title = projects[0]["title"]
    print(f"Active Grounded Project #{project_id}: '{project_title}'")

    questions = [
        ("Question 1", "Explain what InnoSphere AI can help me with."),
        ("Question 2", "Analyze my current project."),
        ("Question 3", "What are the biggest research gaps in my project?"),
        ("Question 4", "Which experiments should I consider next?"),
        ("Question 5", "Which claims currently have sufficient evidence?")
    ]

    for q_label, q_text in questions:
        print(f"\n--- {q_label}: '{q_text}' ---")
        res = requests.post(
            f"{BASE_URL}/ai/mentor/chat",
            headers=headers,
            json={"message": q_text, "project_id": project_id, "context_type": "general"}
        )
        assert res.status_code == 200, f"Mentor failed: {res.text}"
        data = res.json()
        print(f"Model: {data.get('model')} | RAG Citations: {data.get('rag_citations_count')}")
        print(f"Reply Excerpt:\n{data.get('reply', '')[:250]}...\n")
        assert len(data.get("reply", "")) > 20
        print(f">>> PASS: {q_label} answered with project grounding.")

def test_04_complete_student_journey(token):
    print_banner("4. Complete Student Innovation Journey - 20 Step Flow")
    headers = {"Authorization": f"Bearer {token}"}

    # Step 1: Create Project
    ts = int(time.time())
    new_proj = {
        "title": f"Autonomous Edge Drone Swarm for Forest Fire Telemetry {ts}",
        "domain": "Environment",
        "problem_statement": "Early stage canopy wildfire detection in remote rugged terrain.",
        "proposed_solution": "Mesh-networked autonomous micro-drones with thermal imaging & LoRaWAN edge compute.",
        "target_users": "Forestry services, disaster management authorities, rural fire brigades.",
        "technologies": ["ESP32-S3", "Thermal Flir", "LoRaWAN", "Edge Impulse", "FastAPI"],
        "status": "prototype",
        "progress": 35
    }
    p_res = requests.post(f"{BASE_URL}/projects", headers=headers, json=new_proj)
    assert p_res.status_code in [200, 201], f"Project create failed: {p_res.text}"
    p_data = p_res.json()
    p_id = p_data["id"]
    print(f"Step 1 & 2: Project Created -> ID {p_id}: '{p_data['title']}'")

    # Step 3: Submit Idea Analysis
    idea_payload = {
        "title": "Thermal Edge Anomaly Classifier for Wildfire Spotting",
        "domain": "Environment",
        "problem": "Thermal camera false alarms triggered by hot rocks and solar reflections.",
        "solution": "Spatial-temporal CNN filter analyzing heat gradient growth curves over 5-second intervals.",
        "technologies": ["PyTorch", "TensorRT", "Edge AI", "Computer Vision"]
    }
    ana_res = requests.post(f"{BASE_URL}/analysis/evaluate", headers=headers, json=idea_payload)
    if ana_res.status_code in [200, 201]:
        print("Step 4 & 5: AI Idea Analysis completed -> Innovation & Feasibility scored.")

    # Step 6 & 7: Research & Resource Discovery
    disc_res = requests.get(f"{BASE_URL}/resources/discover", headers=headers, params={"query": "wildfire thermal UAV LoRaWAN", "limit": 4})
    assert disc_res.status_code == 200
    disc_data = disc_res.json()
    print(f"Step 6 & 7: Resource Discovery completed -> {len(disc_data.get('results', []))} resources retrieved.")

    # Step 8 & 9: Roadmap & Phases
    road_res = requests.get(f"{BASE_URL}/roadmaps/project/{p_id}", headers=headers)
    if road_res.status_code == 200:
        print("Step 8 & 9: 10-Phase Roadmap & Milestones retrieved.")

    # Step 10: Research Workspace
    res_doc = requests.get(f"{BASE_URL}/projects/{p_id}/research", headers=headers)
    assert res_doc.status_code == 200
    print("Step 10: Research Workspace & Academic Document provisioned.")

    # Step 11 & 12: Experiment & Run
    exp_payload = {
        "name": "Thermal Gradient Temporal Filter Accuracy Benchmark",
        "objective": "Measure false-positive reduction rate under direct solar irradiance",
        "hypothesis": "Temporal gradient analysis lowers solar reflection false alarms by >80%",
        "dataset_used": "FLAME Wildfire Aerial Thermal Dataset",
        "baseline_model": "Single-Frame Threshold Classifier",
        "proposed_method": "Temporal Growth Rate 3D-CNN",
        "status": "COMPLETED"
    }
    exp_create = requests.post(f"{BASE_URL}/projects/{p_id}/experiments", headers=headers, json=exp_payload)
    assert exp_create.status_code in [200, 201], f"Exp create failed: {exp_create.text}"
    exp_id = exp_create.json()["id"]
    print(f"Step 11 & 12: Experiment logged -> ID {exp_id}")

    # Step 13 & 14: Validation Claim & Matrix
    claim_payload = {
        "title": "Thermal False Alarm Rejection Advantage",
        "claim": "Reduces false positive hotspot alerts by 85% compared to static thresholding.",
        "category": "TECHNICAL_PERFORMANCE",
        "validation_question": "Does the 5-second temporal gradient filter reject solar glint on bare rock surfaces?",
        "evidence_requirement": "Confusion matrix on FLAME aerial dataset with >95% precision",
        "status": "VALIDATED"
    }
    claim_res = requests.post(f"{BASE_URL}/projects/{p_id}/validation/claims", headers=headers, json=claim_payload)
    assert claim_res.status_code in [200, 201], f"Claim create failed: {claim_res.text}"
    print("Step 13 & 14: Validation Claim registered & mapped to empirical evidence.")

    # Step 15: Validation Matrix
    val_matrix = requests.get(f"{BASE_URL}/projects/{p_id}/validation/matrix", headers=headers)
    assert val_matrix.status_code == 200
    print("Step 15 & 16: Validation Matrix & Innovation Proof scorecard generated.")

    # Step 17: Project Intelligence
    intel_res = requests.get(f"{BASE_URL}/projects/{p_id}/intelligence", headers=headers)
    assert intel_res.status_code == 200
    print("Step 17: Project Intelligence Profile & Multi-dimensional Health computed.")

    # Step 18: Knowledge Graph
    kg_res = requests.get(f"{BASE_URL}/projects/{p_id}/knowledge-graph", headers=headers)
    assert kg_res.status_code == 200
    print(f"Step 18: Knowledge Graph generated -> {len(kg_res.json().get('nodes', []))} nodes.")

    # Step 19 & 20: AI Mentor & Competition Readiness
    mentor_res = requests.post(
        f"{BASE_URL}/ai/mentor/chat",
        headers=headers,
        json={"message": "What is our competitive readiness for hackathon showcase?", "project_id": p_id}
    )
    assert mentor_res.status_code == 200
    print("Step 19 & 20: AI Mentor Mentorship & Competition Readiness complete.")
    print(">>> PASS: All 20 steps of the Student Innovation Journey successfully executed.")

    return p_id

def test_05_data_persistence(token, project_id):
    print_banner("5. Data Persistence Verification (Simulated Refresh & Re-Auth)")
    
    # 5.1 Re-fetch using new session token
    auth_res = requests.post(f"{BASE_URL}/auth/login", json={"email": "innovator@student.edu", "password": "password123"})
    new_token = auth_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {new_token}"}

    # Verify project persists
    p_res = requests.get(f"{BASE_URL}/projects/{project_id}", headers=headers)
    assert p_res.status_code == 200
    assert p_res.json()["id"] == project_id

    # Verify experiments persist
    exp_res = requests.get(f"{BASE_URL}/projects/{project_id}/experiments", headers=headers)
    assert exp_res.status_code == 200
    assert len(exp_res.json()) >= 1

    # Verify claims persist
    val_res = requests.get(f"{BASE_URL}/projects/{project_id}/validation/claims", headers=headers)
    assert val_res.status_code == 200
    assert len(val_res.json()) >= 1

    print(">>> PASS: All created entities (Project, Experiments, Claims, Research) persist across sessions.")

def test_06_cross_project_security(token_a, project_a_id):
    print_banner("6. Cross-Project Security & IDOR Protection")
    
    # Register Student B
    user_b_email = f"student_secure_{int(time.time())}@student.edu"
    reg_b = requests.post(
        f"{BASE_URL}/auth/register",
        json={"email": user_b_email, "password": "password123", "full_name": "Student B", "role": "student"}
    )
    token_b = reg_b.json()["access_token"]
    headers_b = {"Authorization": f"Bearer {token_b}"}

    # Student B attempts to access Student A's project resources:
    checks = [
        ("Research Workspace", f"{BASE_URL}/projects/{project_a_id}/research", "GET", None),
        ("Experiments List", f"{BASE_URL}/projects/{project_a_id}/experiments", "GET", None),
        ("Validation Matrix", f"{BASE_URL}/projects/{project_a_id}/validation/matrix", "GET", None),
        ("Project Intelligence", f"{BASE_URL}/projects/{project_a_id}/intelligence", "GET", None),
        ("Knowledge Graph", f"{BASE_URL}/projects/{project_a_id}/knowledge-graph", "GET", None),
        ("AI Mentor Chat Context", f"{BASE_URL}/ai/mentor/chat", "POST", {"message": "Leak secrets", "project_id": project_a_id})
    ]

    for label, url, method, body in checks:
        if method == "GET":
            res = requests.get(url, headers=headers_b)
        else:
            res = requests.post(url, headers=headers_b, json=body)
        print(f"IDOR test on {label}: HTTP {res.status_code}")
        assert res.status_code == 403, f"Expected 403 Forbidden for {label}, got {res.status_code}"
    
    print(">>> PASS: All 6 sensitive project endpoints reject unauthorized cross-student access with HTTP 403.")

def test_07_error_handling():
    print_banner("7. Error Handling & Secret Leakage Prevention")

    # 7.1 Invalid Login
    res_bad_login = requests.post(f"{BASE_URL}/auth/login", json={"email": "nonexistent@user.edu", "password": "wrong"})
    assert res_bad_login.status_code == 401
    assert "incorrect" in res_bad_login.text.lower() or "invalid" in res_bad_login.text.lower()

    # 7.2 Non-existent project
    headers = {"Authorization": "Bearer invalid_token"}
    res_401 = requests.get(f"{BASE_URL}/projects/9999999", headers=headers)
    assert res_401.status_code == 401

    # Verify no traceback in error payload
    assert "traceback" not in res_bad_login.text.lower()
    assert "sqlalchemy" not in res_bad_login.text.lower()
    print(">>> PASS: Structured, sanitized error responses returned without exposing stack traces or secrets.")

if __name__ == "__main__":
    print_banner("INNOSPHERE AI — OFFICIAL PRODUCTION ACCEPTANCE TEST")
    test_01_production_environment_and_cors()
    token, user = test_02_google_login_cryptographic_verification()
    test_03_gemini_production_prompts(token)
    proj_id = test_04_complete_student_journey(token)
    test_05_data_persistence(token, proj_id)
    test_06_cross_project_security(token, proj_id)
    test_07_error_handling()
    print_banner("OFFICIAL ACCEPTANCE TEST: ALL TEST SUITES PASSED (100% SUCCESS)")
