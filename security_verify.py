import httpx
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_security():
    # Blocked files
    for f in ['package.json', 'main.py', 'render.yaml', '.env']:
        assert client.get(f"/{f}").status_code == 403

    # Headers
    resp = client.get("/")
    assert resp.headers["X-Content-Type-Options"] == "nosniff"
    assert resp.headers["X-Frame-Options"] == "DENY"

    # Redirects
    for path, target in [("/login.html?r=1", "/login?r=1"), ("/index.html", "/")]:
        r = client.get(path, follow_redirects=False)
        assert r.status_code == 307
        assert r.headers["location"] == target
