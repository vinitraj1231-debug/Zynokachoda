## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Rate Limit Bypass via Direct HTML Access
**Vulnerability:** Rate limits applied to specific routes (e.g., `/login`) could be bypassed by requesting the physical `.html` file directly (e.g., `/login.html`) because `StaticFiles(html=True)` serves matching files before reaching those routes if not handled correctly.
**Learning:** `StaticFiles` in FastAPI can inadvertently serve content that is intended to be protected by route-specific middleware or rate limiters if both the route and the file exist.
**Prevention:** Implement middleware to enforce clean URLs by redirecting `.html` requests to their extension-less canonical routes, ensuring all requests pass through the intended application logic.
