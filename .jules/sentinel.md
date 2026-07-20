## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Open Redirect on Clean URL Redirection and Missing Security Headers on Early Returns
**Vulnerability:** When clean URL redirection was implemented, a protocol-relative path (e.g., `////attacker.com/login.html`) was redirected directly, leading to an Open Redirect vulnerability where the browser interpreted the target as an external site. Additionally, early returns (such as 403 Forbidden and 307 Redirect) bypassed the downstream code that applied security headers.
**Learning:** Redirection targets derived from user-controlled paths must be strictly normalized to prevent browser-level interpretation as external URLs. Furthermore, security headers must be applied on ALL response paths (including early returns and errors) to ensure defense-in-depth.
**Prevention:** Always strip leading slashes and prepend a single slash `/` to normalize redirect targets. Always apply security headers globally to all responses returned by the middleware.
