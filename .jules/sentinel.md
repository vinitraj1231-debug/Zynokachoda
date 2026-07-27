## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-07-26 - Security Headers Missing on Early Responses
**Vulnerability:** Early returns from middleware, such as 403 Forbidden for blocked files or 307 Redirects for clean URLs, bypassed the standard response pipeline and returned directly, meaning defense-in-depth security headers were omitted on these responses.
**Learning:** In frameworks like FastAPI/Starlette, custom middleware that returns an early direct response (e.g., via `JSONResponse` or `RedirectResponse`) before calling `call_next(request)` does not execute downstream header injection logic unless explicitly designed to do so.
**Prevention:** Centralize response header insertion into a reusable helper function, and explicitly wrap all middleware-generated responses (including early returns and redirects) to ensure security headers are consistently applied.
