## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Rate Limit Bypass via Direct HTML File Access
**Vulnerability:** Defined routes with rate limits (e.g., `/login`) could be bypassed by accessing the underlying HTML files directly (e.g., `/login.html`) because `StaticFiles(html=True)` served them without applying the route-specific middleware.
**Learning:** When using `StaticFiles` alongside rate-limited routes for the same content, direct access to the static files must be blocked or redirected to the clean URLs to ensure rate limits are enforced.
**Prevention:** Implement middleware that redirects all `.html` requests to their extension-less counterparts.
