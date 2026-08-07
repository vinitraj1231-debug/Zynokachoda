## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - FastAPI Static Mount Information Leakage
**Vulnerability:** Under FastAPI, the `StaticFiles(html=True)` mount on the root path serves files directly from the directory without checking custom endpoint security logic, creating a parity gap with Express's security middleware blocks.
**Learning:** Falling back to a catch-all static folder serves any matched files (like `.json` or helper `.js` files) directly unless explicitly blocked in a global security middleware interceptor.
**Prevention:** Centralize security constants and block both sensitive files (e.g., database helper scripts) and extensions (like `.json`, `.bak`) globally across all path segments in the top-level HTTP middleware.
