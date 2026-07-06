## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Rate Limit Bypass via .html Extensions
**Vulnerability:** Accessing pages via their .html extensions (e.g., /login.html) bypassed route-specific logic such as rate limiting, because FastAPI's StaticFiles(html=True) served the file before the specific route handler was reached.
**Learning:** Clean URLs are not just for aesthetics; they ensure that request processing always passes through the intended route handlers and their associated middleware or decorators (like rate limiters).
**Prevention:** Enforce clean URLs in a global middleware by redirecting all .html requests to their extension-less counterparts. This ensures that security policies tied to specific routes cannot be bypassed by requesting the underlying file directly.
