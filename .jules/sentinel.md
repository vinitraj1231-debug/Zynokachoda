## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-08-19 - Static Server Security Parity Gap Exposing Sensitive JSON Databases
**Vulnerability:** When static file mounting is used across multiple server runtimes (FastAPI `StaticFiles(directory='.')` and Express `express.static`), discrepancies in `FORBIDDEN_EXTENSIONS` allowed unauthorized clients to download raw user databases (`/data/users.json`), password hashes, and backup files (`.bak.json`) via the FastAPI static handler because `.json` and `.bak` were omitted from its filter.
**Learning:** In multi-stack repositories sharing a root static mount, security filters must be strictly synchronized and validated across all active server implementations; otherwise, an attacker can target the weaker runtime to access sensitive application storage.
**Prevention:** Maintain identical forbidden extension lists and sensitive file blacklists across all runtime middlewares, and enforce regression tests specifically targeting sensitive data files on both servers.
