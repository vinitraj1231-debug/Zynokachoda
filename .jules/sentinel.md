## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Rate-Limit Bypass via Direct HTML Access
**Vulnerability:** Accessing pages directly via their `.html` extension (e.g., `/login.html`) bypassed route-specific rate limits because `StaticFiles(html=True)` served the files before the route logic was executed.
**Learning:** Serving static files from the root with `html=True` can inadvertently bypass custom route protections if the same content is also available via a clean URL route.
**Prevention:** Enforce clean URLs by redirecting all `.html` requests to their extension-less equivalents in a global middleware that executes before static file serving.
