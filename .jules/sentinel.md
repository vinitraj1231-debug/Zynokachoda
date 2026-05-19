## 2025-05-18 - Case-Insensitive Path Segment Validation
**Vulnerability:** Path traversal and sensitive file exposure via path segment bypass (e.g., `/.git/config`).
**Learning:** Checking only the terminal filename in a URL path is insufficient. Attackers can hide sensitive files in subdirectories that are not explicitly blocked. Additionally, on case-insensitive systems or if the middleware doesn't normalize case, bypasses like `/Main.py` can occur.
**Prevention:** Normalize the request path to lowercase and iterate through ALL path segments to check against a blocklist of sensitive files and hidden directory patterns (starting with a dot).
