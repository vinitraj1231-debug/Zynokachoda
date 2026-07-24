from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_security_headers_present_on_success():
    response = client.get("/")
    assert response.status_code == 200
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-XSS-Protection"] == "1; mode=block"
    assert response.headers["Strict-Transport-Security"] == "max-age=31536000; includeSubDomains"
    assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
    assert response.headers["Permissions-Policy"] == "geolocation=(), microphone=(), camera=()"
    assert "frame-ancestors 'none'" in response.headers["Content-Security-Policy"]

def test_blocking_sensitive_files():
    # SENSITIVE_FILES blocking
    for sensitive_file in ["package.json", "package-lock.json", ".gitignore", "readme.md"]:
        response = client.get(f"/{sensitive_file}")
        assert response.status_code == 403
        assert response.json() == {"detail": "Forbidden: Access is denied."}
        # Security headers must be present on early returns
        assert response.headers["X-Content-Type-Options"] == "nosniff"

def test_blocking_forbidden_extensions_and_hidden_files():
    # Forbidden extensions
    for extension in ["test.py", "db.sql", "config.yaml", "app.log", "env.env"]:
        response = client.get(f"/{extension}")
        assert response.status_code == 403
        assert response.json() == {"detail": "Forbidden: Access is denied."}

    # Hidden files/directories
    for hidden in [".git/config", "sub/.git/config", ".env"]:
        response = client.get(f"/{hidden}")
        assert response.status_code == 403

def test_clean_url_redirects_and_query_parameters():
    # Simple .html redirect
    response = client.get("/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["Location"] == "/login"
    assert response.headers["X-Content-Type-Options"] == "nosniff"

    # Preserves casing
    response = client.get("/LOGIN.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["Location"] == "/LOGIN"

    # Query parameters preserved
    response = client.get("/login.html?ref=banner&utm=1", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["Location"] == "/login?ref=banner&utm=1"

def test_index_html_redirects():
    # Root index.html
    response = client.get("/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["Location"] == "/"

    # Subdirectory index.html
    response = client.get("/admin/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["Location"] == "/admin/"

def test_open_redirect_prevention():
    # Protocol-relative URL check
    response = client.get("http://testserver////attacker.com/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["Location"] == "/attacker.com/login"
