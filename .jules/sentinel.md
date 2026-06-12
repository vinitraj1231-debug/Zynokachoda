## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-05-23 - Extension-Based File Exposure and Clean URL Bypasses
**Vulnerability:** The application served the root directory as static files, potentially exposing any file with a non-blocked extension (e.g., `.py`, `.sql`). Additionally, accessing `.html` files directly could sometimes bypass rate limits or security policies intended for clean routes.
**Learning:** A blocklist of specific filenames is insufficient when serving a directory statically. Extension-based blocking is necessary to protect source code and configuration files. Clean URL enforcement via redirection ensures consistent application of security policies.
**Prevention:** Implement global extension blocking for sensitive types (.py, .sql, .env, etc.) across all path segments and enforce 301 redirects from `.html` files to their clean path equivalents.
