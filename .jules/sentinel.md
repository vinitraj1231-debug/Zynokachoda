## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-05-23 - Rate Limit Bypass via .html Extension
**Vulnerability:** Rate limits applied to clean routes (e.g., `/login`) could be bypassed by appending `.html` (e.g., `/login.html`) because the backend served the same content via `StaticFiles` but the rate limiter only matched the exact clean path.
**Learning:** Security controls like rate limiting must be applied to all possible paths that serve the same sensitive content. Canonicalizing URLs is an effective way to ensure all variations of a path hit the same security logic.
**Prevention:** Implement middleware to redirect non-canonical paths (like those with `.html` extensions) to their clean counterparts before they reach the application logic or rate limiters.
