import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def verify_headers(response):
    """Utility to assert all custom security headers are present on any response."""
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-XSS-Protection"] == "1; mode=block"
    assert "max-age=31536000" in response.headers["Strict-Transport-Security"]
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"

    csp = response.headers["Content-Security-Policy"]
    assert "default-src 'self'" in csp
    assert "frame-ancestors 'none'" in csp

def test_root_and_static_headers():
    response = client.get("/")
    assert response.status_code == 200
    verify_headers(response)

def test_login_page_headers():
    response = client.get("/login")
    assert response.status_code == 200
    verify_headers(response)

def test_sensitive_files_blocked():
    sensitive_paths = [
        "/package.json",
        "/package-lock.json",
        "/server.js",
        "/render.yaml",
        "/.gitignore",
        "/readme.md",
        "/supabase_setup.sql",
        "/requirements.txt",
        "/security_headers_test.py",
        "/main.py",
        "/some_dir/package.json"
    ]
    for path in sensitive_paths:
        response = client.get(path)
        assert response.status_code == 403
        assert response.json() == {"detail": "Forbidden: Access is denied."}
        verify_headers(response)

def test_forbidden_extensions_blocked():
    forbidden_paths = [
        "/db.sql",
        "/config.env",
        "/app.py",
        "/sub/app.py",
        "/test.log",
        "/config.yaml"
    ]
    for path in forbidden_paths:
        response = client.get(path)
        assert response.status_code == 403
        assert response.json() == {"detail": "Forbidden: Access is denied."}
        verify_headers(response)

def test_hidden_files_blocked():
    hidden_paths = [
        "/.git/config",
        "/.env",
        "/.aws/credentials"
    ]
    for path in hidden_paths:
        response = client.get(path)
        assert response.status_code == 403
        assert response.json() == {"detail": "Forbidden: Access is denied."}
        verify_headers(response)

def test_html_clean_url_redirection():
    # Regular clean URL redirect with query params
    response = client.get("/login.html?ref=promo", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login?ref=promo"
    verify_headers(response)

    # Casing preservation test
    response = client.get("/Login.HTML?ref=test", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/Login?ref=test"
    verify_headers(response)

    # Nested page redirect test
    response = client.get("/chat.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/chat"
    verify_headers(response)

def test_index_html_redirection():
    response = client.get("/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/"
    verify_headers(response)

    # Mixed case index.html test
    response = client.get("/INDEX.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/"
    verify_headers(response)

    # Mixed case admin/INDEX.html test
    response = client.get("/admin/INDEX.html?user=admin", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/admin/?user=admin"
    verify_headers(response)

def test_open_redirect_prevention():
    # Use absolute base URL 'http://testserver' to prevent client-side URI parsing failures
    test_cases = [
        "http://testserver////attacker.com/login.html",
        "http://testserver/\\\\attacker.com/login.html",
        "http://testserver/\\attacker.com/chat.html"
    ]
    for url in test_cases:
        response = client.get(url, follow_redirects=False)
        assert response.status_code == 307
        # Verify it redirects safely to a local path (should start with /attacker.com)
        location = response.headers["location"]
        assert location.startswith("/")
        assert "attacker.com" in location
        assert "http:" not in location and "https:" not in location
        verify_headers(response)
