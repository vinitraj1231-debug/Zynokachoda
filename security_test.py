from fastapi.testclient import TestClient
from main import app
import pytest

client = TestClient(app)

def test_clean_url_redirection():
    # Test .html redirection
    response = client.get("/login.html", follow_redirects=False)
    assert response.status_code == 308
    assert response.headers["location"] == "/login"

    response = client.get("/index.html", follow_redirects=False)
    assert response.status_code == 308
    assert response.headers["location"] == "/"

    # Test query param preservation
    response = client.get("/login.html?ref=abc", follow_redirects=False)
    assert response.status_code == 308
    assert response.headers["location"] == "/login?ref=abc"

    response = client.get("/subdir/index.html", follow_redirects=False)
    assert response.status_code == 308
    assert response.headers["location"] == "/subdir"

def test_sensitive_file_blocking():
    # Test explicit files
    assert client.get("/main.py").status_code == 403
    assert client.get("/package.json").status_code == 403

    # Test sensitive extensions
    assert client.get("/any.sql").status_code == 403
    assert client.get("/config.yaml").status_code == 403
    assert client.get("/.env").status_code == 403
    assert client.get("/app.log").status_code == 403

    # Test nested sensitive files
    assert client.get("/subdir/secret.sql").status_code == 403
    assert client.get("/.git/config").status_code == 403

def test_security_headers():
    response = client.get("/")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-XSS-Protection"] == "1; mode=block"
    assert "preload" in response.headers["Strict-Transport-Security"]
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "camera=()" in response.headers["Permissions-Policy"]

if __name__ == "__main__":
    pytest.main([__file__])
