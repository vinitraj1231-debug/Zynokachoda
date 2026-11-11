## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-08-20 - Sensitive Database Store and Server File Leak via FastAPI Static Fallback
**Vulnerability:** FastAPI's static mount (`app.mount('/', StaticFiles(directory='.'))`) allowed anonymous external download of database JSON stores (`/data/users.json`, `/data/backups/users.bak.json`) and server scripts (`/seed.js`, `/db.js`, `/backend_test.js`) because `FORBIDDEN_EXTENSIONS` omitted `.json` and `.bak`, and `SENSITIVE_FILES` was not synchronized with `server.js`.
**Learning:** In dual-stack / multi-server architectures (FastAPI & Node Express), static file serving fallbacks can inadvertently expose persistent data stores and internal scripts if security filter lists are desynchronized.
**Prevention:** Maintain strict parity between backend security middlewares and explicitly block database store extensions (`.json`, `.bak`) and internal scripts (`seed.js`, `db.js`, `backend_test.js`, `pnpm-lock.yaml`) across all static mounts.
