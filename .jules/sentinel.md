## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2026-08-05 - FastAPI Static Mount Information Leakage
**Vulnerability:** Serving the entire project directory root using `StaticFiles(directory=".", html=True)` exposes the custom database (`data/*.json`) and raw code/backups. If the list of security blocked extensions (`FORBIDDEN_EXTENSIONS`) is not aligned with all server configurations, sensitive files are leaked.
**Learning:** Having multiple backend implementations (e.g., Node.js and FastAPI) in a codebase increases the risk of parity gaps where security controls are active on one but missing on the other.
**Prevention:** Always centralize or maintain strict parity for security constants (like forbidden extensions and sensitive files lists) across different backend servers in the same codebase.
