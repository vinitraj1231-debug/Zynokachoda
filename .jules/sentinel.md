## 2026-04-25 - Information Leakage via Static Root Serving
**Vulnerability:** Sensitive files (`package.json`, `server.js`, `.gitignore`, `render.yaml`) were publicly accessible because the Express server served the entire project root directory as static content.
**Learning:** Using `app.use(express.static(path.join(__dirname, '.')))` without filtering or a dedicated public directory exposes internal configuration and source code.
**Prevention:** Implement a security middleware to block access to sensitive files and dotfiles, or move public assets to a dedicated `public/` directory and serve only that.
