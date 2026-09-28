import httpx
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("Testing InnoSphere API endpoints...")

    # 1. Root & Health
    res = client.get("/health")
    assert res.status_code == 200, f"Healthcheck failed: {res.text}"
    print("  [OK] /health ->", res.json())

    # 2. Demo Login
    res = client.post("/api/v1/auth/demo-login/student")
    assert res.status_code == 200, f"Demo login failed: {res.text}"
    data = res.json()
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("  [OK] /api/v1/auth/demo-login/student -> Authenticated as:", data["user"]["full_name"])

    # 3. List Projects
    res = client.get("/api/v1/projects", headers=headers)
    assert res.status_code == 200, f"List projects failed: {res.text}"
    projects = res.json()
    print(f"  [OK] /api/v1/projects -> Retrieved {len(projects)} projects")

    # 4. Project Detail
    if projects:
        p_id = projects[0]["id"]
        res = client.get(f"/api/v1/projects/{p_id}", headers=headers)
        assert res.status_code == 200, f"Project detail failed: {res.text}"
        print(f"  [OK] /api/v1/projects/{p_id} -> Loaded project detail workspace")

    # 5. Discover Resources
    res = client.get("/api/v1/resources/discover?query=healthcare+sensors", headers=headers)
    assert res.status_code == 200, f"Discover failed: {res.text}"
    disc_data = res.json()
    print(f"  [OK] /api/v1/resources/discover -> Found {len(disc_data['results'])} ranked resources")

    # 6. Analytics Overview
    res = client.get("/api/v1/analytics/overview")
    assert res.status_code == 200, f"Analytics failed: {res.text}"
    print("  [OK] /api/v1/analytics/overview -> Impact metrics retrieved")

    # 7. AI Assistant
    res = client.post("/api/v1/assistant/query", json={"message": "What technologies do I need?", "project_id": projects[0]["id"] if projects else 1}, headers=headers)
    assert res.status_code == 200, f"Assistant failed: {res.text}"
    print("  [OK] /api/v1/assistant/query -> AI Mentor responded with length:", len(res.json()["reply"]))

    # 8. User Stats
    res = client.get("/api/v1/analytics/user-stats", headers=headers)
    assert res.status_code == 200, f"User stats failed: {res.text}"
    print("  [OK] /api/v1/analytics/user-stats -> User metrics retrieved:", res.json())

    # 9. System Diagnostics Health
    res = client.get("/api/v1/system/health")
    assert res.status_code == 200, f"System health failed: {res.text}"
    health = res.json()
    print(f"  [OK] /api/v1/system/health -> System Health Status: {health['overall_status']} (Components checked: {len(health['components'])})")

    # 10. Hardware Lab Endpoints
    p_id = projects[0]["id"] if projects else 1
    res = client.get(f"/api/v1/hardware/projects/{p_id}")
    assert res.status_code == 200, f"Hardware overview failed: {res.text}"
    hw_data = res.json()
    print(f"  [OK] /api/v1/hardware/projects/{p_id} -> Hardware Lab loaded with {len(hw_data['devices'])} devices & {len(hw_data['experiments'])} experiments")

    if hw_data["devices"] and hw_data["devices"][0]["sensors"]:
        dev_id = hw_data["devices"][0]["id"]
        sens_id = hw_data["devices"][0]["sensors"][0]["id"]
        
        # Test anomaly injection
        res = client.post("/api/v1/hardware/anomalies/inject", json={"device_id": dev_id, "sensor_id": sens_id, "anomaly_type": "sudden_spike"})
        assert res.status_code == 200, f"Anomaly inject failed: {res.text}"
        print("  [OK] /api/v1/hardware/anomalies/inject -> Injected sudden_spike anomaly successfully")

        # Test AI telemetry interpretation
        res = client.post("/api/v1/hardware/interpret", json={
            "project_id": p_id,
            "device_name": hw_data["devices"][0]["name"],
            "telemetry_summary": {hw_data["devices"][0]["sensors"][0]["name"]: {"current": 38.5, "unit": "NTU", "status": "critical"}},
            "active_anomalies": ["sudden_spike"]
        })
        assert res.status_code == 200, f"Hardware interpret failed: {res.text}"
        interp = res.json()
        print(f"  [OK] /api/v1/hardware/interpret -> AI Telemetry Health: {interp['overall_system_health']} (Severity: {interp['severity_level']})")

    print("\n[ALL TESTS PASSED] InnoSphere AI Backend & Hardware Lab 100% Operational!")

if __name__ == "__main__":
    test_endpoints()
