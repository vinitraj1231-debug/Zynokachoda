## 2026-04-26 - [Directory Traversal & Info Leakage via Static Root]
**Vulnerability:** Serving the root directory (`.`) via `express.static` exposed sensitive files like `server.js`, `package.json`, and `.gitignore` to the public.
**Learning:** Defaulting to `.` for static serving is dangerous in Node.js applications as it treats the entire repository as public assets.
**Prevention:** Use a dedicated `public` or `dist` folder for static assets, or implement a strict allow-list/deny-list middleware before serving files if the root must be used.
