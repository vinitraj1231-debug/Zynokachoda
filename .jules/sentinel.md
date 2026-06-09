## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-05-23 - Source Code Exposure via Root Static Mounting
**Vulnerability:** The application served the root directory using FastAPI's `StaticFiles(directory=".", html=True)`. This exposed all files in the repository, including `.py`, `.sql`, and `.env` files, if they weren't explicitly blacklisted in the security middleware.
**Learning:** Mounting the root directory as a static asset source is inherently dangerous. While a blacklist middleware provides some protection, it is prone to omissions as the project grows and new file types are added.
**Prevention:** Implement an extension-based blocklist in the security middleware (e.g., `endswith(('.py', '.sql', '.yaml', '.log', '.env'))`) to provide a broader safety net beyond a simple list of specific filenames.
