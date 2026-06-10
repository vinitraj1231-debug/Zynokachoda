## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-06-10 - Sensitive Extension and Rate-Limit Bypass
**Vulnerability:** The application was vulnerable to source code and log exposure because the security middleware only blocked a specific list of filenames, allowing access to any other files with sensitive extensions (e.g., `.py`, `.log`, `.env`). Additionally, a rate-limiting bypass existed where users could access `.html` files directly, bypassing limits applied to clean routes.
**Learning:** Security filters should use a "deny by extension" approach for all path segments to protect against the exposure of unanticipated files. Furthermore, enforcing clean URLs via redirection ensures that security policies and rate limits are consistently applied to a single canonical path.
**Prevention:** Implement extension-based blocking and mandatory redirection of legacy or alternative file extensions to their clean-path equivalents.
