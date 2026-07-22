import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_security_headers_on_normal_response():
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert response.headers.get("Strict-Transport-Security") == "max-age=31536000; includeSubDomains"
    assert "default-src 'self'" in response.headers.get("Content-Security-Policy", "")

def test_security_headers_on_forbidden_response():
    response = client.get("/package.json")
    assert response.status_code == 403
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert response.headers.get("Strict-Transport-Security") == "max-age=31536000; includeSubDomains"

def test_sensitive_files_blocking():
    # Case insensitivity & segments
    for path in ["/package.json", "/Package.Json", "/subdir/package.json", "/.gitignore", "/subdir/.gitignore"]:
        response = client.get(path)
        assert response.status_code == 403
        assert response.json() == {"detail": "Forbidden: Access is denied."}

def test_forbidden_extensions_blocking():
    for ext in [".py", ".sql", ".yaml", ".log", ".env"]:
        for path in [f"/test{ext}", f"/test{ext.upper()}", f"/subdir/test{ext}"]:
            response = client.get(path)
            assert response.status_code == 403
            assert response.json() == {"detail": "Forbidden: Access is denied."}

def test_clean_url_redirection():
    # Redirect for .html extension
    response = client.get("/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers.get("Location") == "/login"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"

    # Redirect for /index.html suffix
    response = client.get("/admin/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers.get("Location") == "/admin/"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"

def test_query_parameter_preservation():
    response = client.get("/login.html?ref=promo&user=test", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers.get("Location") == "/login?ref=promo&user=test"

def test_open_redirect_prevention():
    # Attempting to use a protocol-relative URL to redirect externally
    # http://testserver////attacker.com/login.html should redirect locally
    response = client.get("http://testserver////attacker.com/login.html", follow_redirects=False)
    assert response.status_code == 307
    location = response.headers.get("Location")
    assert location.startswith("/")
    assert not location.startswith("//")
    assert not location.startswith("http://")
    assert not location.startswith("https://")
