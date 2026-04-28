## 2026-04-28 - Information Leakage via Static File Serving
**Vulnerability:** The Express server serves the entire root directory as static files, allowing access to sensitive files like `server.js`, `package.json`, and `package-lock.json`.
**Learning:** Using `app.use(express.static('.'))` without a dedicated public directory or proper filtering exposes the application's source code and configuration.
**Prevention:** Serve only a specific public directory or implement a middleware to block access to sensitive files and directories (especially dotfiles).
