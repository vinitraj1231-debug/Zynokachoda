## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Open Redirect in Clean URL Redirection
**Vulnerability:** The clean URL middleware was vulnerable to Open Redirect attacks. An attacker could craft a URL starting with double slashes (e.g., `//malicious.com/index.html`) which the middleware would blindly redirect to, causing the browser to treat it as a protocol-relative URL to an external site.
**Learning:** Even when constructing "internal" redirects, user-supplied path data must be strictly sanitized to prevent it from being interpreted as an absolute or protocol-relative URL.
**Prevention:** Normalize redirect targets by stripping all leading slashes and prepending exactly one forward slash: `"/" + path.lstrip("/")`.
