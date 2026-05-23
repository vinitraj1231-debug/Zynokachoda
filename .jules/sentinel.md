## 2025-05-22 - [HIGH] Path Traversal Bypass in SecurityMiddleware
**Vulnerability:** The `SecurityMiddleware` was only checking the last segment (filename) of the request path, allowing attackers to bypass hidden file protections by requesting files within hidden directories (e.g., `/.git/config`).
**Learning:** Checking only the final path segment in middleware is insufficient for blocking hidden directories or nested sensitive files.
**Prevention:** Always iterate through all URL path segments when performing blocklist or hidden-file checks to ensure comprehensive path verification.
