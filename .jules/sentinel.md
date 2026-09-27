## 2025-06-21 - Dual-Backend Static Security Filter Divergence
**Vulnerability:** The FastAPI server (`main.py`) static route security filter had omitted sensitive files (`db.js`, `backend_test.js`, `seed.js`, `pnpm-lock.yaml`) and forbidden file extensions (`.json`, `.bak`) that were defined in the Node.js server (`server.js`), allowing unauthenticated attackers to fetch raw user database JSON files (`/data/users.json`) and database helper code over HTTP on the Python backend.
**Learning:** In dual-stack or multi-backend architectures, static file blocking rules and security constants can drift over time if maintained separately in each backend file.
**Prevention:** Always maintain parity between security filter constants across all entrypoint servers and enforce complete test coverage in the unit/integration test suite for all sensitive paths and forbidden extensions.

## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.
