## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Rate Limit Bypass via .html Extensions
**Vulnerability:** Specific routes like `/login` had rate limits, but `StaticFiles(directory='.', html=True)` allowed accessing `/login.html` directly, bypassing the `limiter.limit` decorator on the FastAPI route.
**Learning:** When serving static files from the root with `html=True`, file-based access can bypass route-specific middleware or decorators.
**Prevention:** Implement clean URL enforcement in a middleware that redirects `.html` requests to their extension-less counterparts before they reach the static file server or specific routes.
