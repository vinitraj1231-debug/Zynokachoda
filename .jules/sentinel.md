# Sentinel Journal 🛡️

## 2025-01-24 - Path Traversal via Hidden Directories
**Vulnerability:** The security middleware only checked the filename (last segment of the path) for hidden status (starting with a dot) or presence in a sensitive files list. This allowed access to sensitive files within hidden directories, such as `/.git/config`.
**Learning:** Only validating the leaf node of a URL path is insufficient for security middleware. Attackers can leverage hidden parent directories to access sensitive data if those directories are not explicitly blocked.
**Prevention:** Middleware must iterate through and validate *all* segments of the URL path to ensure that no part of the path refers to a hidden or restricted directory/file.
