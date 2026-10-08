## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Dual-Backend Security Filter Desynchronization
**Vulnerability:** Static file security rules in `main.py` (FastAPI) drifted out of sync with `server.js` (Express), allowing attackers to download sensitive database JSON files (`/data/users.json`) and backend scripts (`/db.js`) directly from the FastAPI static mount.
**Learning:** In dual-backend architectures, static asset security middleware rules must be strictly synchronized and shared across both frameworks.
**Prevention:** Ensure all sensitive files and forbidden extensions are defined identically across all server implementations and covered by unified regression tests.
