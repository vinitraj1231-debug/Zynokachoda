## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Rate Limit Bypass via .html Extension
**Vulnerability:** FastAPI's `StaticFiles(html=True)` served `.html` files before route-specific logic, allowing users to bypass decorated rate limits on routes like `/login` by requesting `/login.html`.
**Learning:** Middlewares execute before route logic. Enforcing clean URLs in a global middleware by redirecting `.html` extensions to their clean counterparts ensures all requests pass through the intended route handlers and their associated decorators (like rate limiters).
**Prevention:** Implement clean URL redirection in a global `BaseHTTPMiddleware` that converts extension-based paths to extension-less paths.
