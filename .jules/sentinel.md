## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Rate Limit Bypass via Static HTML Files
**Vulnerability:** Users could bypass route-specific rate limits by accessing `.html` files directly (e.g., `/login.html` instead of `/login`). This happened because `StaticFiles(html=True)` served the files before the route-specific rate limiters were evaluated.
**Learning:** In frameworks like FastAPI where static file mounting can catch requests before specific routes, relying solely on route-level decorators for security/rate-limiting can lead to bypasses if the static file name matches the route logic.
**Prevention:** Enforce clean URLs in a global middleware that redirects file-extension paths to canonical clean paths, ensuring all requests pass through intended route logic and rate limiters.
