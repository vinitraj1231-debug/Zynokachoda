## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-05-23 - Global Extension Blocking for Root-Served Apps
**Vulnerability:** Serving the repository root via `StaticFiles(directory=".", html=True)` exposed all backend files (.py, .sql, .env) by default. The middleware originally only blocked specific filenames, leaving variations (e.g., `main.py.bak`) or new sensitive files exposed.
**Learning:** When the web root is the project root, a whitelist or a very broad extension-based blacklist is safer than a filename-based one. Redirection of `.html` to clean URLs also prevents potential rate-limit bypasses or implementation disclosure.
**Prevention:** Implement a global extension blacklist (`.py`, `.env`, etc.) in the security middleware that checks every path segment, and use clean URL redirects to normalize traffic.
