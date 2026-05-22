# Sentinel Journal

## 2025-05-22 - [Path Traversal in SecurityMiddleware]
**Vulnerability:** The SecurityMiddleware only checked the last segment of the URL path for sensitive files or hidden patterns (starting with a dot). This allowed bypassing the check by placing sensitive files in a subdirectory (e.g., `/.git/config` would be seen as `config`, which wasn't blocked).
**Learning:** Middleware that performs path-based blocking must validate the entire path or iterate through all path segments to ensure no restricted pattern is present anywhere in the requested resource path.
**Prevention:** Always split the path and verify every segment against the blocklist or pattern.
