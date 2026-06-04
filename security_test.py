import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_security_headers():
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-XSS-Protection"] == "1; mode=block"
    assert "max-age=31536000" in response.headers["Strict-Transport-Security"]
    assert "default-src 'self'" in response.headers["Content-Security-Policy"]

def test_block_sensitive_files():
    blocked_paths = [
        "/main.py",
        "/package.json",
        "/package-lock.json",
        "/.gitignore",
        "/supabase_setup.sql",
        "/requirements.txt",
        "/server.log",
        "/.env",
        "/config.yaml",
        "/scripts/backup.sh"
    ]
    for path in blocked_paths:
        response = client.get(path)
        assert response.status_code == 403, f"Path {path} should be blocked"
        assert response.json() == {"detail": "Forbidden: Access is denied."}

def test_html_redirects():
    redirects = {
        "/login.html": "/login",
        "/chat.html": "/chat",
        "/index.html": "/",
        "/profile.html": "/profile"
    }
    for old_path, new_path in redirects.items():
        response = client.get(old_path, follow_redirects=False)
        assert response.status_code == 301
        assert response.headers["location"] == new_path

def test_path_traversal_blocked():
    traversal_paths = [
        "/static/../../main.py",
        "/%2e%2e/%2e%2e/main.py",
        "/./main.py"
    ]
    for path in traversal_paths:
        response = client.get(path)
        # Middleware should catch the segments
        assert response.status_code == 403

def test_legitimate_assets_allowed():
    assets = ["/app.js", "/styles.css", "/script.js"]
    for asset in assets:
        response = client.get(asset)
        assert response.status_code == 200
