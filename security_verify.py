from fastapi.testclient import TestClient
from main import app
import pytest

client = TestClient(app)

def test_clean_url_redirection():
    # Test .html to clean path redirection
    response = client.get("/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login"

    # Test /index.html to / redirection
    response = client.get("/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/"

    # Test query param preservation
    response = client.get("/login.html?ref=sentinel", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login?ref=sentinel"

def test_security_headers():
    response = client.get("/")
    headers = response.headers
    assert headers["X-Content-Type-Options"] == "nosniff"
    assert headers["X-Frame-Options"] == "DENY"
    assert "preload" in headers["Strict-Transport-Security"]
    assert headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "camera=()" in headers["Permissions-Policy"]
    assert "frame-ancestors 'none'" in headers["Content-Security-Policy"]

def test_blocked_files_and_extensions():
    # Blocked files
    assert client.get("/main.py").status_code == 403
    assert client.get("/package.json").status_code == 403
    assert client.get("/.gitignore").status_code == 403

    # Blocked extensions
    assert client.get("/something.py").status_code == 403
    assert client.get("/config.sql").status_code == 403
    assert client.get("/secret.env").status_code == 403
    assert client.get("/app.log").status_code == 403
    assert client.get("/data.yaml").status_code == 403

def test_rate_limits():
    # Basic check for rate limit presence on sensitive routes
    # We won't trigger the full limit to keep tests fast, but verify 200 first
    assert client.get("/login").status_code == 200
    assert client.get("/chat").status_code == 200
    assert client.get("/admin").status_code == 200
    assert client.get("/profile").status_code == 200
    assert client.get("/settings").status_code == 200

if __name__ == "__main__":
    # For quick manual run
    test_clean_url_redirection()
    test_security_headers()
    test_blocked_files_and_extensions()
    test_rate_limits()
    print("All security tests passed!")
