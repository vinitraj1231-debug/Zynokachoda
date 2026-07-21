from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def assert_security_headers(headers):
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert "Strict-Transport-Security" in headers
    assert "Content-Security-Policy" in headers

def test_security_headers_on_success():
    response = client.get("/")
    assert response.status_code == 200
    assert_security_headers(response.headers)

def test_clean_url_redirect():
    # Regular clean URL redirect
    response = client.get("/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login"
    assert_security_headers(response.headers)

    # With query params
    response = client.get("/login.html?ref=invite&code=123", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login?ref=invite&code=123"
    assert_security_headers(response.headers)

def test_index_html_redirect():
    # Root index.html
    response = client.get("/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/"
    assert_security_headers(response.headers)

    # Subdirectory index.html
    response = client.get("/admin/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/admin/"
    assert_security_headers(response.headers)

def test_case_insensitive_redirect():
    response = client.get("/LOGIN.HTML", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/LOGIN"
    assert_security_headers(response.headers)

def test_sensitive_files_blocking():
    # Test file in SENSITIVE_FILES
    for path in ["/package.json", "/.gitignore", "/render.yaml"]:
        response = client.get(path)
        assert response.status_code == 403
        assert response.json() == {"detail": "Forbidden: Access is denied."}
        assert_security_headers(response.headers)

def test_forbidden_extensions_blocking():
    # Test extensions in FORBIDDEN_EXTENSIONS
    for path in ["/app.py", "/backup.sql", "/config.yaml", "/server.log", "/.env"]:
        response = client.get(path)
        assert response.status_code == 403
        assert response.json() == {"detail": "Forbidden: Access is denied."}
        assert_security_headers(response.headers)

def test_open_redirect_prevention():
    # Test protocol-relative path traversal injection / open redirect bypass
    response = client.get("http://testserver////attacker.com/login.html", follow_redirects=False)
    assert response.status_code == 307
    redirect_target = response.headers["location"]
    # The target should be normalized to /attacker.com/login
    assert redirect_target.startswith("/attacker.com/login")
    assert "////" not in redirect_target
    assert_security_headers(response.headers)
