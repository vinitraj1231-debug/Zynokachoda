from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_security_headers_on_success():
    """Asserts that security headers are correctly applied to a standard 200 response."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-XSS-Protection"] == "1; mode=block"
    assert "max-age=31536000" in response.headers["Strict-Transport-Security"]
    assert "default-src 'self'" in response.headers["Content-Security-Policy"]

def test_sensitive_files_blocked():
    """Asserts that requests for sensitive files are blocked with a 403 Forbidden status code and headers are present."""
    for sensitive in ["package.json", "package-lock.json", "server.js", "render.yaml", ".gitignore", "readme.md"]:
        response = client.get(f"/{sensitive}")
        assert response.status_code == 403, f"Expected 403 for {sensitive}"
        assert response.headers["X-Content-Type-Options"] == "nosniff"

def test_forbidden_extensions_blocked():
    """Asserts that any URL path segment ending in forbidden extensions is blocked case-insensitively."""
    extensions = [".py", ".sql", ".yaml", ".log", ".env"]
    for ext in extensions:
        response1 = client.get(f"/test{ext}")
        assert response1.status_code == 403, f"Expected 403 for /test{ext}"
        assert response1.headers["X-Content-Type-Options"] == "nosniff"

        # Case insensitive check
        response2 = client.get(f"/test{ext.upper()}")
        assert response2.status_code == 403, f"Expected 403 for /test{ext.upper()}"

        # Segment check
        response3 = client.get(f"/subfolder/test{ext}/other")
        assert response3.status_code == 403, f"Expected 403 for /subfolder/test{ext}/other"

def test_hidden_files_blocked():
    """Asserts that requests containing segments starting with dot are blocked (e.g. .git/config)."""
    response = client.get("/.git/config")
    assert response.status_code == 403
    assert response.headers["X-Content-Type-Options"] == "nosniff"

def test_clean_url_redirects_html():
    """Asserts that .html extensions are 307 redirected to their clean equivalent, preserving casing and query params."""
    response = client.get("/LOGIN.html?foo=bar", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/LOGIN?foo=bar"
    assert response.headers["X-Content-Type-Options"] == "nosniff"

def test_clean_url_redirects_index_html():
    """Asserts that index.html suffixes are 307 redirected to their directory parent, preserving casing and query params."""
    response = client.get("/admin/INDEX.html?abc=123", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/admin/?abc=123"
    assert response.headers["X-Content-Type-Options"] == "nosniff"

def test_open_redirect_prevention():
    """Asserts that protocol-relative URLs are safely transformed into safe local redirects to avoid open redirect vulnerabilities."""
    response = client.get("http://testserver////attacker.com/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/attacker.com/login"
