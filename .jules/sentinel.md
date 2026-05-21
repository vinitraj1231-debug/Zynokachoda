## 2025-05-21 - [Path Segment Bypass in SecurityMiddleware]
**Vulnerability:** Path traversal and information disclosure. Hidden files and sensitive project files located in subdirectories (e.g., `/.git/config`, `/subdir/package.json`) could bypass the `SecurityMiddleware` because it only checked the last segment of the URL path for a dot-prefix or sensitive filename.
**Learning:** Checking only the leaf node of a path is insufficient for security middleware. Attackers can often bypass such checks by nesting sensitive files or using path segments that the middleware doesn't evaluate.
**Prevention:** Always iterate through all segments of a URL path when performing security checks or blacklisting. Ensure that the validation logic applies to every part of the URI to prevent nested bypasses.
