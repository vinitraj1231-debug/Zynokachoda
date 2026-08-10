## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-22 - FastAPI and Express Static Serving Desynchronization
**Vulnerability:** The FastAPI static serving mount (`/` mapped to `.`) was not aligned with the Node.js Express static server's security filters. Because `main.py` missed blocking `.json` / `.bak` extensions and several backend files, sensitive data resources like the raw JSON user data database (`data/users.json`) and database helper source files were publicly accessible via the FastAPI server.
**Learning:** In hybrid/multi-backend environments serving the same files, security filters must be strictly synchronized. If one server's static mount is less restricted, it compromises the security controls of the other.
**Prevention:** Align file/extension denylists across all serving entrypoints, and always include comprehensive test assertions validating the blocking of database files and configuration data across all environments.
