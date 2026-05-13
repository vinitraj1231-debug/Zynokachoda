import http.client
import sys

def test_path(path):
    conn = http.client.HTTPConnection("localhost", 3000)
    try:
        conn.request("GET", path)
        res = conn.getresponse()
        print(f"Path: {path}, Status: {res.status}")
        return res.status
    finally:
        conn.close()

if __name__ == "__main__":
    test_paths = [
        ("/", 200),
        ("/main.py", 403),
        ("/.git/config", 403),
        ("/.jules/sentinel.md", 403),
        ("/app.js", 200),
        ("/styles.css", 200)
    ]

    all_passed = True
    for path, expected in test_paths:
        status = test_path(path)
        if status != expected:
            print(f"FAILED: {path} expected {expected}, got {status}")
            all_passed = False

    if not all_passed:
        sys.exit(1)
    print("All tests passed!")
