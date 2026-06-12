import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_security_headers():
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert "Content-Security-Policy" in response.headers

def test_block_sensitive_files():
    sensitive_files = ["/main.py", "/supabase_setup.sql", "/.gitignore", "/package.json"]
    for file in sensitive_files:
        response = client.get(file)
        assert response.status_code == 403

def test_block_sensitive_extensions():
    extensions = ["/test.py", "/db.sql", "/config.env", "/deploy.yaml", "/error.log"]
    for path in extensions:
        # We need to simulate the file existing if we want to be sure it's not the static mount blocking it
        # But the middleware should block it regardless of existence
        response = client.get(path)
        assert response.status_code == 403

def test_html_redirection():
    # /login.html -> /login (301)
    response = client.get("/login.html", follow_redirects=False)
    assert response.status_code == 301
    assert response.headers["location"] == "/login"

def test_index_html_redirection():
    # /index.html -> / (301)
    response = client.get("/index.html", follow_redirects=False)
    assert response.status_code == 301
    assert response.headers["location"] == "/"

def test_clean_urls_accessible():
    # /login should still work
    response = client.get("/login")
    assert response.status_code == 200

def test_path_segment_bypass():
    # Test if someone tries /subdir/.git/config
    response = client.get("/subdir/.git/config")
    assert response.status_code == 403

    # Test /subdir/test.py
    response = client.get("/subdir/test.py")
    assert response.status_code == 403
