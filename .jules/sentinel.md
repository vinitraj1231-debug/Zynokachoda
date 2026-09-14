## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Synchronizing Static Server File Filters Across Dual Backends
**Vulnerability:** FastAPI (`main.py`) static file middleware served sensitive JSON data files (`data/users.json`) and backend JavaScript files (`db.js`, `seed.js`) because `FORBIDDEN_EXTENSIONS` and `SENSITIVE_FILES` lacked `.json`, `.bak`, `db.js`, and `seed.js`.
**Learning:** Mounting static file middleware at the root path (`/`) without strict extension and filename blocking across all server implementations (FastAPI + Express) creates severe information disclosure risks for backend files and user JSON databases.
**Prevention:** Ensure all backend implementations maintain complete parity in `SENSITIVE_FILES` and `FORBIDDEN_EXTENSIONS` lists, blocking database extensions (`.json`, `.bak`) and backend source files globally across all path segments.
