## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-08-20 - Dual Backend Security Middleware Desynchronization Exposes JSON Database
**Vulnerability:** While `server.js` blocked `.json` and `.bak` files, FastAPI's `SecurityMiddleware` in `main.py` was missing `.json` and `.bak` from `FORBIDDEN_EXTENSIONS` and omitted `db.js`, `seed.js`, and `backend_test.js` from `SENSITIVE_FILES`, exposing user credential databases (`/data/users.json`) via the root static file mount.
**Learning:** When dual backends (Node.js Express and Python FastAPI) serve the same root directory static files, security filter sets must remain strictly synchronized to prevent security regressions and accidental database leakage.
**Prevention:** Keep security rules and sensitive file blocking sets identical across both backend runtimes and enforce regression tests for all database and backup file formats.
