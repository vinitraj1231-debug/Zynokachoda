## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-06-03 - Rate Limit Bypass via Direct File Access
**Vulnerability:** Routes like `/login` had rate limits, but the underlying static file `/login.html` was served directly via `StaticFiles` without the same limits. Attackers could bypass rate limiting by requesting the `.html` file directly.
**Learning:** When using both explicit routes with rate limits and a catch-all `StaticFiles` mount, sensitive pages must have their direct file access blocked or redirected to the rate-limited route.
**Prevention:** Implement middleware to redirect all `.html` requests to their clean-path equivalents, ensuring they pass through the intended FastAPI routes and associated rate limiters.
