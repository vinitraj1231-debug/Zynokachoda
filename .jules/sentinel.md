## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-05-23 - Rate Limit Bypass via File Extensions and Extension-Based Blocking
**Vulnerability:** Attackers could bypass rate limits on clean paths (e.g., `/login`) by requesting the raw file with its extension (e.g., `/login.html`). Additionally, backend source files and logs were not globally blocked by extension.
**Learning:** Security middleware should enforce clean URLs by redirecting extension-based requests to their canonical paths. Global extension blocking (e.g., `.py`, `.sql`, `.log`) provides a robust catch-all defense for sensitive files that might not be explicitly listed in a blocklist.
**Prevention:** Implement clean URL redirection in middleware and use tuple-based extension checks (`endswith(blocked_extensions)`) across all path segments to ensure backend artifacts are never served.
