## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-22 - Rate Limit Bypass and Open Redirect in Static File Redirects
**Vulnerability:** Direct access to `.html` files (like `/login.html`) bypassed route-specific rate limits because FastAPI's `StaticFiles` with `html=True` serves files directly, ignoring route definitions. Attempting to redirect these requests also introduces Open Redirect risks if protocol-relative paths are not handled.
**Learning:** Enforcing clean canonical URLs is crucial for both SEO and rate limit enforcement. Normalizing paths using `safe_path = '/' + path.lstrip('/')` effectively prevents open redirects via protocol-relative URLs (e.g., `////attacker.com`).
**Prevention:** Intercept `.html` extensions case-insensitively in the security middleware, redirect them to extension-less paths with 307 redirects to preserve state, and apply security headers to early redirects.
