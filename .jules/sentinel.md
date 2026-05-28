## 2025-05-22 - Path Segment Bypass in Security Middleware
**Vulnerability:** The `SecurityMiddleware` only checked the last segment of the URL path (the filename) against a blacklist and for hidden files. This allowed bypassing security checks by requesting sensitive files inside subdirectories, such as `/.git/config`, because only `config` was being checked.
**Learning:** Security middleware that handles path-based blocking must iterate through ALL segments of the path to prevent exposure of sensitive data in hidden or nested directories.
**Prevention:** Always use `path.split('/')` and iterate through all segments when implementing path-based security restrictions.
