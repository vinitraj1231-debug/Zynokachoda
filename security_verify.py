import httpx
import pytest
from main import app
from fastapi.testclient import TestClient

client = TestClient(app)

def test_clean_url_redirection():
    # Test /login.html -> /login
    response = client.get("/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login"

    # Test /index.html -> /
    response = client.get("/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/"

    # Test query param preservation
    response = client.get("/login.html?ref=test", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login?ref=test"

def test_rate_limit_enforced_after_redirect():
    # 1. Trigger rate limit on /login
    for _ in range(10):
        client.get("/login")

    response = client.get("/login")
    assert response.status_code == 429

    # 2. Try to bypass via /login.html
    # It should redirect to /login, which is already rate limited
    response = client.get("/login.html", follow_redirects=True)
    assert response.status_code == 429

def test_sensitive_files_blocking():
    sensitive = ['/main.py', '/requirements.txt', '/.gitignore', '/supabase_setup.sql', '/.git/config']
    for path in sensitive:
        response = client.get(path)
        assert response.status_code == 403, f"Path {path} should be forbidden"

def test_security_headers():
    response = client.get("/")
    headers = response.headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert "preload" in headers["Strict-Transport-Security"]
    assert headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "camera=()" in headers["Permissions-Policy"]
    assert "frame-ancestors 'none'" in headers["Content-Security-Policy"]

if __name__ == "__main__":
    # Manual run
    test_clean_url_redirection()
    print("Clean URL redirection test PASSED")

    test_rate_limit_enforced_after_redirect()
    print("Rate limit enforcement test PASSED")

    test_sensitive_files_blocking()
    print("Sensitive files blocking test PASSED")

    test_security_headers()
    print("Security headers test PASSED")
