from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_clean_url_redirects():
    # login.html -> /login
    r = client.get("/login.html", follow_redirects=False)
    assert r.status_code == 301
    assert r.headers["location"] == "/login"

    # index.html -> /
    r = client.get("/index.html", follow_redirects=False)
    assert r.status_code == 301
    assert r.headers["location"] == "/"

    # Nested index.html
    r = client.get("/subdir/index.html", follow_redirects=False)
    assert r.status_code == 301
    assert r.headers["location"] == "/subdir"

def test_sensitive_file_blocking():
    # Explicit files
    assert client.get("/main.py").status_code == 403
    assert client.get("/.gitignore").status_code == 403

    # Extension based blocking
    assert client.get("/something.py").status_code == 403
    assert client.get("/config.yaml").status_code == 403
    assert client.get("/database.sql").status_code == 403
    assert client.get("/app.log").status_code == 403
    assert client.get("/.env").status_code == 403

    # Nested sensitive files
    assert client.get("/subdir/main.py").status_code == 403
    assert client.get("/.git/config").status_code == 403

def test_security_headers():
    r = client.get("/")
    assert r.status_code == 200
    assert r.headers["X-Content-Type-Options"] == "nosniff"
    assert r.headers["X-Frame-Options"] == "DENY"
    assert "preload" in r.headers["Strict-Transport-Security"]
    assert r.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert "camera=()" in r.headers["Permissions-Policy"]

    csp = r.headers["Content-Security-Policy"]
    assert "frame-ancestors 'none'" in csp
    assert "upgrade-insecure-requests" in csp
