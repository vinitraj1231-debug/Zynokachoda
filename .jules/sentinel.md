## 2025-05-22 - Path Segment Security Bypass
**Vulnerability:** Path traversal and sensitive file exposure via subdirectory segments (e.g., `/.git/config`).
**Learning:** Checking only the last segment of a URL path for sensitive filenames is insufficient if the web server or middleware serves files from subdirectories or hidden folders.
**Prevention:** Iterate through all URL path segments in security middleware and block the request if any segment matches a sensitive filename or begins with a hidden file marker (e.g., '.').
