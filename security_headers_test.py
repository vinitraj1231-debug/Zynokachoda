from fastapi.testclient import TestClient
from main import app, SECURITY_HEADERS

client = TestClient(app)

def test_security_headers_on_success():
    # Test a success response (e.g. root page /)
    response = client.get("/")
    assert response.status_code == 200
    for header, value in SECURITY_HEADERS.items():
        assert response.headers.get(header) == value

def test_sensitive_files_blocking_and_headers():
    # Test blocked files
    sensitive_paths = [
        "/main.py",
        "/requirements.txt",
        "/package.json",
        "/.gitignore",
        "/secrets.env",
        "/schema.sql",
        "/config.yaml",
        "/server.log"
    ]
    for path in sensitive_paths:
        response = client.get(path)
        assert response.status_code == 403, f"Path {path} should be blocked"
        assert response.json() == {"detail": "Forbidden: Access is denied."}
        for header, value in SECURITY_HEADERS.items():
            assert response.headers.get(header) == value, f"Missing header {header} on path {path}"

def test_clean_url_redirects():
    # Test .html extension redirection
    response = client.get("/login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login"
    for header, value in SECURITY_HEADERS.items():
        assert response.headers.get(header) == value

    # Test casing preservation for redirects
    response = client.get("/Login.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/Login"

    # Test index.html redirection
    response = client.get("/admin/index.html", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/admin/"

    # Test query parameters preservation
    response = client.get("/login.html?ref=sidebar&utm=test", follow_redirects=False)
    assert response.status_code == 307
    assert response.headers["location"] == "/login?ref=sidebar&utm=test"

def test_open_redirect_prevention():
    # Use absolute base URL 'http://testserver' as instructed in memory
    base_url = "http://testserver"
    response = client.get(f"{base_url}////attacker.com/login.html", follow_redirects=False)
    assert response.status_code == 307
    # Path should be normalized safely (starting with a single '/')
    redirect_url = response.headers["location"]
    assert redirect_url.startswith("/attacker.com")
    assert not redirect_url.startswith("//attacker.com")
    assert not redirect_url.startswith("////")
