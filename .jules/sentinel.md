## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-07-26 - Rate-Limit and Client-Side Auth Bypass via Direct Static HTML Access
**Vulnerability:** Direct access to `.html` static files (e.g., `/login.html` or `/chat.html`) bypassed FastAPI route-specific rate limits and also bypassed client-side routing and authentication checks in `app.js` because `app.js` only checked paths containing `.html` extensions.
**Learning:** Mounting `StaticFiles(html=True)` at the root directory can bypass FastAPI's route-specific middleware and handlers for static HTML resources. Furthermore, relying purely on file extensions for client-side routing/auth state checks introduces bypasses when clean URL redirection is implemented.
**Prevention:** Always redirect static `.html` paths to their clean extension-less counterparts in a base security middleware running before route dispatching, and design client-side auth checks to validate both extension-less paths and static extensions.
