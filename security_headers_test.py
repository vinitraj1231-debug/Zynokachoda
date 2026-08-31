import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def assert_security_headers(headers):
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"
    assert headers.get("Permissions-Policy") == "camera=(), microphone=(), geolocation=()"
    assert "Strict-Transport-Security" in headers
    csp = headers.get("Content-Security-Policy", "")
    assert "frame-ancestors 'none'" in csp

def test_successful_route_has_security_headers():
    response = client.get("/login")
    assert response.status_code == 200
    assert_security_headers(response.headers)

def test_sensitive_files_blocked():
    sensitive_paths = [
        "/package.json", "/.gitignore", "/main.py", "/server.log",
        "/db/supabase_setup.sql", "/db.js", "/backend_test.js"
    ]
    for path in sensitive_paths:
        response = client.get(path)
        assert response.status_code == 403
        assert response.json() == {"detail": "Forbidden: Access is denied."}
        assert_security_headers(response.headers)

def test_forbidden_extensions_blocked():
    forbidden_paths = [
        "/app.py", "/data.sql", "/config.yaml", "/logs/server.log",
        "/auth/.env", "/data/users.json", "/data/backups/users.bak.json"
    ]
    for path in forbidden_paths:
        response = client.get(path)
        assert response.status_code == 403
        assert response.json() == {"detail": "Forbidden: Access is denied."}
        assert_security_headers(response.headers)

def test_clean_url_redirect_html():
    response = client.get("/login.html?foo=bar", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login?foo=bar"
    assert_security_headers(response.headers)

def test_clean_url_redirect_html_casing():
    response = client.get("/LOGIN.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/LOGIN"
    assert_security_headers(response.headers)

def test_clean_url_redirect_index_html():
    response = client.get("/admin/index.html?abc=123", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/admin/?abc=123"
    assert_security_headers(response.headers)

def test_clean_url_redirect_root_index_html():
    response = client.get("/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/"
    assert_security_headers(response.headers)

def test_open_redirect_prevention():
    # FastAPI TestClient / HTTPX requires absolute-like request construction for test cases,
    # but we can test safe normalization by simulating protocol-relative URLs on the server.
    response = client.get("http://testserver////attacker.com/login.html", follow_redirects=False)
    assert response.status_code == 307
    # Since lstrip '/\\' turns '////attacker.com/login.html' into '/attacker.com/login.html' (which gets stripped of .html -> /attacker.com/login)
    assert response.headers["location"].startswith("/attacker.com/login")

def test_rate_limits_enforced():
    # Since we need to trigger a rate limit, we can hit a 10/minute endpoint (/login) repeatedly.
    # Note that there might have been previous requests to /login, so we loop up to 12 times or until we get a 429.
    triggered_429 = False
    for _ in range(12):
        response = client.get("/login")
        if response.status_code == 429:
            triggered_429 = True
            break
    assert triggered_429, "Expected endpoint to eventually return 429 on repeated requests"
