from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_route():
    response = client.get("/")
    assert response.status_code == 200

def test_login_route():
    response = client.get("/login")
    assert response.status_code == 200

def test_security_middleware_blocking():
    # Test blocked files
    assert client.get("/package.json").status_code == 403
    assert client.get("/.git/config").status_code == 403
    assert client.get("/server.log").status_code == 403

def test_security_middleware_allowing():
    # Test allowed files (if they exist, 200; if not, 404 is fine as long as not 403)
    # index.html should be 200
    assert client.get("/index.html").status_code == 200
    # Random non-existent file should be 404
    assert client.get("/non_existent_file_xyz.txt").status_code == 404
