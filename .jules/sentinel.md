# Sentinel's Journal - Critical Security Learnings

## 2026-04-16 - Hardening Static File Serving in Express
**Vulnerability:** The Express server was serving the root directory (`.`) as static files using `app.use(express.static(path.join(__dirname, '.')))`. This exposed sensitive files like `package.json`, `package-lock.json`, `.gitignore`, and the `.git` directory to the public.
**Learning:** In simple static site deployments, developers often serve the root directory for convenience, unaware that it includes project metadata and configuration files.
**Prevention:** Always serve static files from a dedicated subdirectory (e.g., `public` or `dist`). If serving the root is necessary, implement a whitelist or blacklist middleware to protect sensitive files and hidden directories.
