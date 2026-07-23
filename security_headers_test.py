from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_headers():
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-XSS-Protection"] == "1; mode=block"
    assert "Strict-Transport-Security" in response.headers
    assert "Content-Security-Policy" in response.headers

def test_blocked_sensitive_files():
    response = client.get("/main.py")
    assert response.status_code == 403
    assert response.json()["detail"] == "Forbidden: Access is denied."

    response2 = client.get("/.gitignore")
    assert response2.status_code == 403

def test_forbidden_extensions():
    # Should block .py, .sql, .yaml, .log, .env
    for ext in ['.py', '.sql', '.yaml', '.log', '.env']:
        response = client.get(f"/test{ext}")
        assert response.status_code == 403
        response = client.get(f"/test{ext.upper()}")
        assert response.status_code == 403
        # Even inside path segments
        response = client.get(f"/subdir/test{ext}/file")
        assert response.status_code == 403

def test_clean_url_redirects():
    # /login.html -> /login
    response = client.get("/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login"
    assert response.headers["X-Content-Type-Options"] == "nosniff" # Security headers present on redirects!

    # Case-insensitive suffix evaluation, preserving original casing for target
    response = client.get("/LOGIN.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/LOGIN"

    # Query parameters preserved
    response = client.get("/login.html?ref=promo", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login?ref=promo"

    # index.html -> parent directory root
    response = client.get("/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/"

    response = client.get("/admin/index.html?debug=true", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/admin/?debug=true"

def test_open_redirect_prevention():
    # Protocol-relative URL bypass attempt
    # e.g. client.get("http://testserver////attacker.com/login.html")
    response = client.get("http://testserver////attacker.com/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert not response.headers["location"].startswith("//")
    # It should normalize to safe local path like /attacker.com/login (as ////attacker.com/login.html gets normalized)
