## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Rate Limit Bypass via Static HTML Files
**Vulnerability:** Accessing `.html` files directly (e.g., `/login.html`) bypassed route-specific rate limits because `StaticFiles(html=True)` served the files before they could be intercepted by the intended route handlers.
**Learning:** In FastAPI, mounting `StaticFiles` with `html=True` can lead to security bypasses if route-specific protections (like rate limiting) are expected on those pages.
**Prevention:** Enforce clean URLs by redirecting `.html` requests to extension-less paths in a global middleware that runs before static file serving.
