## 2026-05-10 - [Enhanced Path Traversal and Sensitive File Protection]
**Vulnerability:** The `SecurityMiddleware` in `main.py` only checked the last segment of the URL path for sensitive files, allowing bypasses like `/.git/config`.
**Learning:** Checking only the final part of a path is insufficient for middleware designed to block sensitive files; all path segments must be inspected. Additionally, blocking by extension (`.py`, `.sql`, etc.) provides defense-in-depth against accidental exposure.
**Prevention:** Always iterate through all path segments when implementing file-based access control in middleware.
