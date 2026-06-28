## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Rate Limit Bypass and Open Redirect in Security Middleware
**Vulnerability:** Accessing `.html` files directly bypassed route-specific rate limits because `StaticFiles(html=True)` served them before route handlers. Additionally, an initial attempt to enforce clean URLs via redirection was vulnerable to Open Redirect when handling paths starting with multiple slashes (e.g., `//attacker.com/login.html`).
**Learning:** Middleware-level redirections must sanitize the destination path to prevent Open Redirect attacks. Enforcing clean URLs is a necessary defense when using catch-all static file serving alongside rate-limited routes.
**Prevention:** Force redirect `.html` files to extension-less paths at the middleware level. Always ensure redirected paths start with exactly one `/` (e.g., `"/" + path.lstrip("/")`) to prevent absolute URL interpretation by browsers.
