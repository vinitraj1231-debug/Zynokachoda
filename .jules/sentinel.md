## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Open Redirect and Rate-Limit Bypass via Clean URLs
**Vulnerability:** Implementing clean-URL redirection of `.html` extensions (e.g. to prevent rate-limit bypasses on static routes) can introduce Open Redirect vulnerabilities if protocol-relative paths like `////attacker.com/login.html` are processed and returned directly in 307 Redirects.
**Learning:** Redirection targets constructed dynamically from request paths must be strictly sanitized to ensure they represent local, origin-relative paths. Furthermore, any early middleware returns (403 or 307) must also carry defense-in-depth security headers, as Starlette doesn't apply downstream route middleware to early responses.
**Prevention:** Prepend a single leading slash and strip all existing leading slashes from redirect targets (e.g. `safe_target = '/' + target.path.lstrip('/')`). Explicitly apply security headers to early redirect and error responses before returning them from the middleware.
