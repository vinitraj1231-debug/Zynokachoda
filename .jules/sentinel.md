## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-08-08 - Missing Static File Filters on FastAPI (Parity Bypass)
**Vulnerability:** FastAPI served files from the root directory using its static mount fallback (`app.mount("/", StaticFiles(directory=".", html=True))`). However, the FastAPI security middleware constants did not mirror the Node Express server's blocks. Consequently, sensitive backend code (`db.js`, `backend_test.js`, `seed.js`) and persistent user databases (`/data/users.json` containing hashed passwords/emails) were fully queryable and exposed over HTTP.
**Learning:** When maintaining dual-backend stacks or multiple static asset routers, security configurations for restricted files and extensions must be strictly aligned and synchronized; otherwise, an attacker can bypass controls by targeting the less-hardened interface.
**Prevention:** Always centralize security block lists or verify that all serving platforms apply identical interceptor criteria for critical extensions (`.json`, `.bak`) and internal scripts (`*.js`).
