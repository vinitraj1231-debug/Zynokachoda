## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-07-31 - Protocol-Relative URL Redirect Bypass (Open Redirect)
**Vulnerability:** In redirection middleware, processing raw request paths that begin with multiple forward or backward slashes (e.g., `////attacker.com/login.html` or `/\attacker.com/login.html`) can trick browsers into interpreting the local redirect path as a scheme-relative external URL.
**Learning:** Browsers interpret redirection targets starting with two or more slashes as relative to the protocol, leading them to navigate to external malicious domains rather than remaining on the same site.
**Prevention:** Normalize all request paths before redirection by stripping leading forward/backward slashes and prepending a single forward slash (e.g., `safe_path = '/' + original_path.lstrip('/\\')`).
