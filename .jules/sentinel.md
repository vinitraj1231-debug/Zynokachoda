## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Rate-Limit Bypass via Direct HTML File Access
**Vulnerability:** Serving a directory with `StaticFiles(html=True)` mounted at the root (`/`) allows users to directly access the raw `.html` files (e.g., `/login.html`). This bypasses any custom route decorators such as route-specific rate limiting (`@limiter.limit` on `/login`), exposing sensitive endpoints to brute-force or abuse.
**Learning:** Static file serving with implicit HTML matching serves content directly before or instead of route-specific logic if not properly restricted. Enforcing redirects in middleware is necessary to funnel users to clean, rate-limited routes.
**Prevention:** Detect requests ending in `.html` or matching `index.html` within the security middleware and issue a 307 redirect to the clean path, while preserving query parameters and preventing open redirects by normalizing the path.
