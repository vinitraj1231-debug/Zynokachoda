## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-05-23 - Rate Limit Bypass via File Extensions
**Vulnerability:** The application used `StaticFiles(directory=".", html=True)`, which allowed users to access the same page via multiple paths (e.g., `/login` and `/login.html`). Rate limits applied to `/login` could be bypassed by using the `.html` alias. Additionally, the root-level mounting exposed all files by default.
**Learning:** Serving a root directory with `html=True` creates path aliasing that can circumvent route-specific security policies like rate limiting or custom middleware filters if they aren't globally applied or normalized.
**Prevention:** Enforce clean URLs by redirecting all `.html` requests to their canonical clean paths in a global middleware, and use a combination of explicit file blocking and extension-based blacklisting for defense-in-depth when serving from the root.
