from fastapi.testclient import TestClient
from main import app
import os

client = TestClient(app)

def test_forbidden_extensions():
    # Test blocked extensions
    for ext in ['.py', '.sql', '.env', '.yaml', '.log']:
        filename = f"test_file{ext}"
        with open(filename, "w") as f:
            f.write("sensitive content")

        try:
            response = client.get(f"/{filename}")
            assert response.status_code == 403
            assert response.json() == {"detail": "Forbidden: Access is denied."}
        finally:
            if os.path.exists(filename):
                os.remove(filename)

def test_clean_url_redirection():
    # Test .html to clean URL redirection
    response = client.get("/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login"

    response = client.get("/chat.html?ref=sentinel", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/chat?ref=sentinel"

    response = client.get("/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/"

def test_security_headers():
    response = client.get("/")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "frame-ancestors 'none'" in response.headers["Content-Security-Policy"]
    assert "camera=()" in response.headers["Permissions-Policy"]

def test_sensitive_files():
    # Test explicitly blocked sensitive files
    sensitive_files = ['package.json', 'render.yaml', 'main.py']
    for file in sensitive_files:
        response = client.get(f"/{file}")
        assert response.status_code == 403

if __name__ == "__main__":
    import pytest
    pytest.main([__file__])
