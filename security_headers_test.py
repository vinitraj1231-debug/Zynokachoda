import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app, base_url="http://testserver")

def test_security_headers():
    response = client.get("/")
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert response.headers.get("X-XSS-Protection") == "1; mode=block"
    assert "Strict-Transport-Security" in response.headers
    assert "Content-Security-Policy" in response.headers

def test_path_segment_blocking():
    # Sensitive files
    response = client.get("/package.json")
    assert response.status_code == 403
    assert "Forbidden" in response.json()["detail"]

    # Hidden files
    response = client.get("/.git/config")
    assert response.status_code == 403

    # Forbidden extensions
    for ext in [".py", ".sql", ".yaml", ".log", ".env"]:
        response = client.get(f"/somefile{ext}")
        assert response.status_code == 403

def test_clean_url_redirect():
    # .html suffix redirect (preserving casing)
    response = client.get("/Login.html?ref=promo", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/Login?ref=promo"

    # index.html redirect
    response = client.get("/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/"

    response = client.get("/admin/index.html?p=1", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/admin/?p=1"

def test_open_redirect_prevention():
    # protocol-relative URL evasion
    response = client.get("http://testserver////attacker.com/login.html", follow_redirects=False)
    assert response.status_code == 307
    # Normalized to a local path, preventing open redirect
    assert response.headers["location"] == "/attacker.com/login"
