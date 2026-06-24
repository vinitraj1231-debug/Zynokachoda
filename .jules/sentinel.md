## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Global Security Hardening of FastAPI Middleware
**Vulnerability:** The application was vulnerable to access of sensitive backend files (like `.py`, `.sql`, `.env`) because the security middleware only blocked a hardcoded list of filenames. Additionally, rate limiting on specific routes could be bypassed by accessing the same content via `.html` extensions (e.g., `/login.html` vs `/login`).
**Learning:** Hardcoding sensitive files is insufficient for robust protection. Extension-based blocking and enforcing clean URLs through redirection are necessary to prevent rate-limit bypasses and accidental exposure of backend code.
**Prevention:** Implement global extension-based blocking in middleware and use permanent or temporary redirection for `.html` files to their clean equivalents, ensuring all access points are covered by unified security policies and rate limits.
