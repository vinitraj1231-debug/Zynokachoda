## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-06-22 - Global Extension Blocking and Clean URL Redirection
**Vulnerability:** Arbitrary backend files (e.g., .py, .sql) were accessible if they didn't match a hardcoded sensitive file list. Additionally, users could bypass rate limits on clean paths by accessing .html files directly.
**Learning:** A blacklist of specific filenames is insufficient; blocking by extension and enforcing a single canonical URL (extension-less) provides multiple layers of defense.
**Prevention:** Use a global extension block for all backend-related file types and implement middleware to redirect .html requests to clean paths.
