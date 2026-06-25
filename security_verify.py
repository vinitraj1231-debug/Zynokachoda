from fastapi.testclient import TestClient
from main import app
import pytest
import os

client = TestClient(app)

def test_security_headers():
    response = client.get("/")
    headers = response.headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["X-XSS-Protection"] == "1; mode=block"
    assert "Strict-Transport-Security" in headers
    assert "preload" in headers["Strict-Transport-Security"]
    assert headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "camera=()" in headers["Permissions-Policy"]
    assert "frame-ancestors 'none'" in headers["Content-Security-Policy"]

def test_sensitive_files_blocked():
    forbidden_paths = [
        "/main.py",
        "/supabase_setup.sql",
        "/.gitignore",
        "/package.json",
        "/requirements.txt",
        "/server.log",
        "/RENDER.YAML", # Case insensitive check
    ]
    for path in forbidden_paths:
        response = client.get(path)
        assert response.status_code == 403, f"Path {path} should be forbidden"

def test_html_redirection():
    # We want these to redirect to clean URLs
    response = client.get("/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"].endswith("/login")

    # Test with query params
    response = client.get("/login.html?ref=abc", follow_redirects=False)
    assert response.headers["location"].endswith("/login?ref=abc")

def test_extension_blocking():
    # Test direct access
    response = client.get("/anything.py")
    assert response.status_code == 403

    # Test nested access
    response = client.get("/some/path/secret.py")
    assert response.status_code == 403

    # Test .sql
    response = client.get("/db.sql")
    assert response.status_code == 403

    # Test .env
    response = client.get("/sub/.env")
    assert response.status_code == 403

def test_rate_limits():
    # Test admin rate limit (10/min)
    for i in range(15):
        response = client.get("/admin")
        if response.status_code == 429:
            break
    else:
        pytest.fail("Rate limit for /admin was not hit after 15 requests")

if __name__ == "__main__":
    pytest.main([__file__])
