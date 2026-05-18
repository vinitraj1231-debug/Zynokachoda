## 2025-05-18 - Path Segment Bypass in Security Middleware
**Vulnerability:** The `SecurityMiddleware` was only validating the last segment of the URL path (the filename). This allowed access to sensitive files or hidden directories if they were nested (e.g., `/.git/config`).
**Learning:** Checking only the terminal segment of a path is insufficient for security middleware. Attackers can bypass these checks by nesting sensitive files in subdirectories or accessing hidden directories that don't match the terminal check.
**Prevention:** Always iterate through and validate all segments of a URL path when implementing file-based access controls or blocklists. Use sets for efficient lookups when dealing with multiple sensitive file patterns.
