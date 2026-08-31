## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - FastAPI and Express Static File Server Disparities
**Vulnerability:** The Python FastAPI backend and Node.js Express backend served the same static root directory, but their security constant lists for blocking sensitive files were not aligned. FastAPI was missing `db.js`, `backend_test.js`, and `.json` / `.bak` extensions, exposing the entire database containing password hashes and backend code directly to the web.
**Learning:** In multi-backend architectures or dual-server implementations serving from the same source directories, any security middleware filtering must be strictly aligned and tested across all technologies to prevent data exposure.
**Prevention:** Explicitly align and synchronize sensitive blocklists and extension rules, and write security regression tests asserting both servers enforce the exact same policies.
