## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-06-04 - Rate Limit Bypass and Sensitive File Exposure
**Vulnerability:** Attackers could bypass rate limits on routes like `/login` by accessing `/login.html` directly, as the app served the root directory statically. Additionally, sensitive files like `.sql` or `.env` were not systematically blocked.
**Learning:** Static file serving of the root directory requires robust middleware to enforce URL normalization and systematic file blocking by extension to prevent bypasses and data leakage.
**Prevention:** Implement middleware that redirects `.html` to clean paths and blocks sensitive extensions (`.py`, `.sql`, `.env`, etc.) across all URL segments.
