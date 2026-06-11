## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-05-23 - source code Exposure via StaticFiles
**Vulnerability:** Serving the root directory via `StaticFiles(directory=".")` exposed all backend files (.py, .sql, .env, etc.) to the public if not explicitly blocked. The previous middleware only blocked a specific list of files.
**Learning:** A whitelist for files to block is insufficient when serving from root. A combined approach of blocking sensitive extensions and enforcing clean URLs is necessary to reduce the attack surface.
**Prevention:** Implement extension-based blocking (e.g., .py, .sql, .env) in the security middleware and redirect all `.html` requests to clean paths to obscure the technology stack.
