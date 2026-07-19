from fastapi.testclient import TestClient
import pytest
from main import app

client = TestClient(app)

REQUIRED_HEADERS = [
    "X-Content-Type-Options",
    "X-Frame-Options",
    "X-XSS-Protection",
    "Strict-Transport-Security",
    "Content-Security-Policy"
]

def assert_security_headers(headers):
    for h in REQUIRED_HEADERS:
        assert h in headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["X-XSS-Protection"] == "1; mode=block"

def test_normal_response_has_headers():
    response = client.get("/")
    assert response.status_code == 200
    assert_security_headers(response.headers)

def test_sensitive_files_blocked():
    blocked_paths = [
        "/package.json",
        "/package-lock.json",
        "/.gitignore",
        "/main.py",
        "/sub/main.py",
        "/sub/supabase_setup.sql",
        "/server.log",
        "/.git/config",
        "/secrets.env",
        "/config.yaml"
    ]
    for path in blocked_paths:
        response = client.get(path)
        assert response.status_code == 403
        assert_security_headers(response.headers)
        assert "Forbidden" in response.json()["detail"]

def test_html_redirect_and_preserved_query():
    # Regular page redirect
    response = client.get("/login.html?ref=dashboard", follow_redirects=False)
    assert response.status_code == 307
    assert_security_headers(response.headers)
    assert response.headers["location"] == "/login?ref=dashboard"

    # Index page redirect
    response = client.get("/admin/index.html?token=123", follow_redirects=False)
    assert response.status_code == 307
    assert_security_headers(response.headers)
    assert response.headers["location"] == "/admin/?token=123"

def test_open_redirect_protection():
    # Attack with protocol-relative URL using absolute base URL
    response = client.get("http://testserver////attacker.com/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert_security_headers(response.headers)
    # Target should be cleaned to a safe local path
    assert response.headers["location"].startswith("/")
    assert "attacker.com" in response.headers["location"]
