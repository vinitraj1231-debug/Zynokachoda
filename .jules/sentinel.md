## 2026-04-18 - [Exposed Sensitive Files in Root Directory]
**Vulnerability:** Serving the entire root directory as static files (`app.use(express.static('.'))`) exposed sensitive configuration and source files like `package.json`, `render.yaml`, and `server.js`.
**Learning:** When a project does not have a dedicated `/public` or `/dist` folder for static assets, common sensitive files are at risk of being served to anyone who knows the path.
**Prevention:** Always use a dedicated directory for static files. If that's not possible, implement strict middleware to block access to known sensitive filenames and hidden files (dotfiles) before the static middleware.
