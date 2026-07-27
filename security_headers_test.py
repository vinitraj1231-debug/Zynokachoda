import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_security_headers_applied():
    """Assert that security headers are applied to successful responses."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert "Strict-Transport-Security" in response.headers
    assert "Content-Security-Policy" in response.headers

def test_security_headers_on_forbidden():
    """Assert that security headers are applied to 403 Forbidden responses."""
    response = client.get("/.env")
    assert response.status_code == 403
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert "Content-Security-Policy" in response.headers

def test_clean_urls_serving():
    """Assert that clean extension-less URLs return 200 OK and serve expected pages."""
    for path in ["/", "/login", "/chat", "/admin", "/profile", "/settings"]:
        response = client.get(path)
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")

def test_html_extension_redirection():
    """Assert that accessing with .html triggers a 307 redirect to clean extension-less path."""
    for html_path, clean_path in [("/login.html", "/login"), ("/chat.html", "/chat")]:
        response = client.get(html_path, follow_redirects=False)
        assert response.status_code == 307
        assert response.headers["location"] == clean_path

    response_query = client.get("/login.html?ref=ai", follow_redirects=False)
    assert response_query.status_code == 307
    assert response_query.headers["location"] == "/login?ref=ai"

def test_index_html_redirection():
    """Assert that index.html redirects to parent root path."""
    response = client.get("/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/"

def test_sensitive_files_blocked():
    """Assert that sensitive files are blocked with 403 Forbidden across all segments."""
    for sensitive in ["/package.json", "/.gitignore", "/main.py", "/requirements.txt"]:
        response = client.get(sensitive)
        assert response.status_code == 403
        assert "Forbidden" in response.json()["detail"]

def test_forbidden_extensions_blocked():
    """Assert that any path containing blocked extensions is forbidden."""
    for path in ["/db.sql", "/config.yaml", "/server.log", "/.env"]:
        response = client.get(path)
        assert response.status_code == 403
        assert "Forbidden" in response.json()["detail"]

def test_static_pages_without_redirects():
    """Assert that legal/other non-explicitly-routed pages can be served as static HTML files."""
    for path in ["/privacy-policy.html", "/terms-and-conditions.html", "/features.html", "/about.html"]:
        response = client.get(path)
        assert response.status_code == 200

def test_open_redirect_normalization():
    """Assert that protocol-relative URLs lstripped of leading slashes/backslashes do not lead to open redirect."""
    response = client.get("http://testserver////attacker.com/login.html", follow_redirects=False)
    if response.status_code == 307:
        loc = response.headers["location"]
        assert not loc.startswith("//")
        assert "attacker.com" not in loc or loc.startswith("/")
