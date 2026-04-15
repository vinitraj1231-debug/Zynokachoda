## 2026-04-15 - [Exposing sensitive files in static servers]
**Vulnerability:** The Express server was serving the root directory as static, which exposed sensitive files like `package.json`, `package-lock.json`, `render.yaml`, and potentially hidden directories like `.git`.
**Learning:** When serving static files from the root of a Node.js project, it is crucial to explicitly block access to configuration and metadata files.
**Prevention:** Use a middleware to whitelist/blacklist specific file patterns or serve from a dedicated `public` or `dist` directory.
