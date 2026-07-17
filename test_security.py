import pytest
from fastapi import Request
from fastapi.testclient import TestClient
from main import app, SecurityMiddleware

client = TestClient(app)

def assert_security_headers(headers):
    assert headers.get("X-Content-Type-Options") == "nosniff"
    assert headers.get("X-Frame-Options") == "DENY"
    assert headers.get("X-XSS-Protection") == "1; mode=block"
    assert "Strict-Transport-Security" in headers
    assert "Content-Security-Policy" in headers

def test_root_page():
    # Access root
    response = client.get("/")
    assert response.status_code == 200
    assert_security_headers(response.headers)

def test_login_page():
    # Access login clean URL
    response = client.get("/login")
    assert response.status_code == 200
    assert_security_headers(response.headers)

def test_html_redirect():
    # Accessing .html should redirect to clean URL
    response = client.get("/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login"
    assert_security_headers(response.headers)

def test_html_redirect_case_preservation():
    # Accessing .html should redirect to clean URL preserving original casing of path segments
    response = client.get("/Login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/Login"
    assert_security_headers(response.headers)

def test_html_redirect_with_query_params():
    # Accessing .html with query params should preserve them
    response = client.get("/login.html?foo=bar&baz=123", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login?foo=bar&baz=123"
    assert_security_headers(response.headers)

def test_index_html_redirect():
    # Accessing index.html should redirect to parent directory
    response = client.get("/admin/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/admin/"
    assert_security_headers(response.headers)

def test_index_html_redirect_case_preservation():
    # Casing of parent directory segment should be preserved
    response = client.get("/Admin/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/Admin/"
    assert_security_headers(response.headers)

def test_index_html_redirect_with_query_params():
    response = client.get("/admin/index.html?ref=logo", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/admin/?ref=logo"
    assert_security_headers(response.headers)

@pytest.mark.anyio
async def test_open_redirect_prevention():
    # Directly invoke the middleware with a multi-slash path scope that parses to double slash in request.url.path
    scope = {
        "type": "http",
        "method": "GET",
        "path": "////attacker.com/login.html",
        "headers": [],
    }
    request = Request(scope)

    async def call_next(req):
        from fastapi.responses import Response
        return Response()

    middleware = SecurityMiddleware(app)
    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 307
    # Redirect target should start with single slash, preventing open redirect (not protocol-relative)
    assert response.headers["location"] == "/attacker.com/login"
    assert_security_headers(response.headers)

@pytest.mark.anyio
async def test_open_redirect_prevention_index_html():
    scope = {
        "type": "http",
        "method": "GET",
        "path": "////attacker.com/index.html",
        "headers": [],
    }
    request = Request(scope)

    async def call_next(req):
        from fastapi.responses import Response
        return Response()

    middleware = SecurityMiddleware(app)
    response = await middleware.dispatch(request, call_next)

    assert response.status_code == 307
    assert response.headers["location"] == "/attacker.com/"
    assert_security_headers(response.headers)

def test_sensitive_files_blocking():
    # Sensitive file names should be blocked
    sensitive_paths = [
        "/package.json",
        "/package-lock.json",
        "/server.js",
        "/render.yaml",
        "/.gitignore",
        "/readme.md",
        "/supabase_setup.sql",
        "/requirements.txt",
        "/main.py",
        "/server.log"
    ]
    for path in sensitive_paths:
        response = client.get(path)
        assert response.status_code == 403
        assert response.json() == {"detail": "Forbidden: Access is denied."}
        assert_security_headers(response.headers)

def test_hidden_files_blocking():
    # Paths with hidden files/folders (starting with dot) should be blocked
    hidden_paths = [
        "/.git/config",
        "/subfolder/.env",
        "/.env"
    ]
    for path in hidden_paths:
        response = client.get(path)
        assert response.status_code == 403
        assert response.json() == {"detail": "Forbidden: Access is denied."}
        assert_security_headers(response.headers)

def test_forbidden_extensions_blocking():
    # Forbidden extensions should be blocked case-insensitively across segments
    forbidden_paths = [
        "/db_backup.sql",
        "/script.py",
        "/CONFIG.YAML",
        "/logs/error.log",
        "/production.env",
        "/app/some_script.py/inside",
    ]
    for path in forbidden_paths:
        response = client.get(path)
        assert response.status_code == 403
        assert response.json() == {"detail": "Forbidden: Access is denied."}
        assert_security_headers(response.headers)
