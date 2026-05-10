import urllib.request
import urllib.error
import os
import subprocess
import time

def test_url(url, expected_status, expected_headers=None):
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            status = response.getcode()
            headers = response.info()
            if status == expected_status:
                if expected_headers:
                    for h, v in expected_headers.items():
                        if headers.get(h) != v:
                            return False
                return True
            return False
    except urllib.error.HTTPError as e:
        return e.code == expected_status
    except Exception:
        return False

def run_tests():
    base_url = "http://localhost:3000"
    tests = [
        (f"{base_url}/main.py", 403),
        (f"{base_url}/.gitignore", 403),
        (f"{base_url}/.git/config", 403),
        (f"{base_url}/package.json", 403),
        (f"{base_url}/SUPABASE_SETUP.sql", 403),
        (f"{base_url}/", 200, {"Referrer-Policy": "strict-origin-when-cross-origin"}),
    ]

    for t in tests:
        url = t[0]
        status = t[1]
        headers = t[2] if len(t) > 2 else None
        if not test_url(url, status, headers):
            print(f"Failed: {url}")
            return False
    return True

if __name__ == "__main__":
    proc = subprocess.Popen(["python3", "main.py"], env=dict(os.environ, PORT="3000"))
    time.sleep(3)
    try:
        if run_tests():
            print("Tests Passed")
            exit(0)
        else:
            print("Tests Failed")
            exit(1)
    finally:
        proc.terminate()
