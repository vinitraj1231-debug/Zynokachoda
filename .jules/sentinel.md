## 2026-05-16 - Path Traversal Bypass in SecurityMiddleware
**Vulnerability:** The middleware only verified the last segment of the URL path against a blocklist and hidden file pattern (starting with '.'). This allowed access to sensitive files in hidden directories, such as `/.git/config`, because the last segment 'config' did not start with a dot.
**Learning:** Partial path validation (checking only the filename) is insufficient when protecting against directory-based hidden files or nested sensitive structures.
**Prevention:** Always iterate through and validate all segments of a path when implementing security blocklists or hidden file protections.
