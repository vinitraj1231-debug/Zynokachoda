## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-07-15 - Rate Limit Bypass via Static HTML Files
**Vulnerability:** FastAPIs `StaticFiles(html=True)` serves `.html` files directly, bypassing route-specific logic and rate limiters defined in `main.py`.
**Learning:** Middleware or route-based rate limits only apply to specific paths. Serving static files with the same content as routes allows attackers to bypass those limits by requesting the file extension directly.
**Prevention:** Enforce clean URLs by redirecting all requests for `.html` files to their extension-less equivalents in the security middleware.
