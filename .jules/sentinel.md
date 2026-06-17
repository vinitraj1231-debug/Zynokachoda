## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-06-17 - Middleware Hardening: Extension Blocking and Clean URLs
**Vulnerability:** The security middleware lacked general extension-based blocking, making it difficult to protect all sensitive files (like new .py or .env files) without updating a static list. Additionally, direct access to .html files could bypass route-specific rate limits if not properly redirected.
**Learning:** Security middleware should combine specific file-blocking with broad extension-based rules. Enforcing clean URLs via redirection ensures that all requests pass through the intended application routes and their associated security controls (like rate limiting).
**Prevention:** Implement a blacklist of sensitive extensions (.py, .env, .sql, etc.) that is checked for all path segments. Enforce clean URLs by redirecting requests for file extensions like .html to their logical clean paths.
