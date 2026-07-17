## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-06-21 - Protocol-Relative Open Redirect Bypass and Case Preservation
**Vulnerability:** In Starlette/FastAPI, requests starting with multiple leading slashes (e.g., `////attacker.com/index.html`) can parse `request.url.path` with double slashes (e.g., `//attacker.com/index.html`). Slicing or redirecting this path directly generates a protocol-relative URL, creating an Open Redirect vulnerability. Additionally, lowercasing the redirect path breaks case-sensitive routers (e.g. `/Login.html` -> `/login` causing 404).
**Learning:** Raw paths from client scopes can contain multi-slash patterns that bypass naive local redirect checks. Case-insensitivity must be handled during suffix checks but original segment casing must be preserved for correct routing.
**Prevention:** Normalize the redirect path by stripping all leading slashes and prepending a single `/` (e.g., `safe_path = "/" + original_path.lstrip("/")`). Evaluate redirects case-insensitively using lowercase checks but generate the final `RedirectResponse` with the casing of the normalized original path.
