## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-22 - Root Directory Static Files Exposure in FastAPI
**Vulnerability:** Mounting static file middleware on the root directory (`/`) in FastAPI (`main.py`) recursively exposed all directory contents, leading to massive leakage of sensitive user databases (`data/*.json`), server scripts (`db.js`, `seed.js`), and tests (`backend_test.js`) because the Python security middleware constants were out of sync with Express (`server.js`).
**Learning:** When multi-stack servers (e.g., Node.js and FastAPI) run concurrently, security filters must be aligned identically across both to prevent bypasses where one stack serves raw sensitive files.
**Prevention:** Enforce identical SENSITIVE_FILES sets and FORBIDDEN_EXTENSIONS tuples across both backends, specifically blocking `.json`, `.bak`, `db.js`, `seed.js`, and `backend_test.js`.
