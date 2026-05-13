## 2026-05-13 - Path Traversal Vulnerability in Security Middleware
**Vulnerability:** The `SecurityMiddleware` was only validating the final segment of the URL path, allowing attackers to bypass security checks by requesting files within hidden directories (e.g., `/.git/config`).
**Learning:** Middleware that implements path-based access control must validate *all* segments of the path. Relying on the filename alone is insufficient when the server also serves hidden directories or nested sensitive files.
**Prevention:** Always iterate through all path segments (e.g. `path.split('/')`) when performing security checks in middleware to ensure hidden files and directories are comprehensively blocked.
