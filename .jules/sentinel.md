## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Database and Source Code Disclosure via FastAPI Backend
**Vulnerability:** The FastAPI backend (`main.py`) had a mismatch in its `SENSITIVE_FILES` and `FORBIDDEN_EXTENSIONS` compared to the Express server (`server.js`). Because the entire root directory was mounted as static files in FastAPI, attackers could directly download the user database `/data/users.json` (exposing hashed passwords/emails) and backend source files like `/db.js`.
**Learning:** When maintaining dual-backend server environments (such as Node.js and Python), security controls, SENSITIVE_FILES, and blocked file extensions must be strictly aligned and tested on both backends to prevent a security policy bypass on the weaker implementation.
**Prevention:** Explicitly align file and extension blacklist filters across all active server instances, and add comprehensive integration/regression tests targeting specific database files and backend script names.
