## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-06-30 - Rate-Limit Bypass via Static HTML Files
**Vulnerability:** When using FastAPI's `StaticFiles(html=True)`, the static file handler serves `.html` files directly (e.g., `/login.html`) before route-specific decorators like `@limiter.limit` are applied. This allows attackers to bypass rate limits on sensitive endpoints by requesting the file extension directly.
**Learning:** Static file handlers often take precedence or run outside the standard route-matching logic where decorators are applied.
**Prevention:** Enforce clean URLs by implementing a middleware that redirects all `.html` requests to their extension-less counterparts, ensuring they hit the intended routes and their associated security logic.

## 2026-06-30 - Source Code and Config Exposure via Missing Extension Blocks
**Vulnerability:** The security middleware only blocked a specific list of sensitive filenames but did not block entire categories of sensitive backend extensions (e.g., `.py`, `.sql`, `.env`, `.yaml`, `.log`). This could allow attackers to guess and download source code or configuration files.
**Learning:** Relying on an allow-list or a short deny-list of filenames is insufficient for protecting backend assets.
**Prevention:** Implement a global block on common backend and configuration file extensions across all URL path segments in the security middleware.
