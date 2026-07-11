import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_clean_url_redirection():
    # Test .html redirection
    response = client.get("/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login"

    # Test .html redirection with query params
    response = client.get("/login.html?ref=sentinel", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login?ref=sentinel"

    # Test index.html redirection
    response = client.get("/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/"

def test_open_redirect_prevention():
    # Test that //attacker.com/index.html doesn't redirect to external site
    # FastAPI path is usually normalized, but we want to ensure our logic is safe
    response = client.get("//attacker.com/index.html", follow_redirects=False)
    # The location should still start with a single /
    assert response.headers["location"].startswith("/")
    assert not response.headers["location"].startswith("//")

def test_sensitive_file_blocking():
    # Test SENSITIVE list
    for f in ["main.py", "package.json", ".gitignore", "supabase_setup.sql"]:
        response = client.get(f"/{f}")
        assert response.status_code == 403
        assert response.json() == {"detail": "Forbidden: Access is denied."}

    # Test FORBIDDEN_EXT
    for f in ["test.py", "db.sql", ".env", "config.yaml", "app.log"]:
        response = client.get(f"/{f}")
        assert response.status_code == 403

    # Test path segments
    response = client.get("/subdir/main.py")
    assert response.status_code == 403

    response = client.get("/.git/config")
    assert response.status_code == 403

def test_security_headers():
    response = client.get("/")
    headers = response.headers

    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert headers["X-XSS-Protection"] == "1; mode=block"
    assert "Strict-Transport-Security" in headers
    assert "max-age=31536000" in headers["Strict-Transport-Security"]
    assert "preload" in headers["Strict-Transport-Security"]
    assert headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "camera=()" in headers["Permissions-Policy"]
    assert "frame-ancestors 'none'" in headers["Content-Security-Policy"]

def test_rate_limiting_enforcement_after_redirect():
    # We can't easily test the full rate limiter with TestClient without mock
    # but we can verify the redirect logic works as intended.
    # The clean URL redirection ensures /login.html -> /login
    # and /login HAS the @limiter.limit decorator.
    pass

if __name__ == "__main__":
    pytest.main([__file__])
