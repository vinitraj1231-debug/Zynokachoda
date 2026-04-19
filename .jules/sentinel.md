## 2026-04-19 - Secure Server Configuration and Dependency Hardening
**Vulnerability:** The Express server was serving the root directory (`.`) via `express.static`, exposing sensitive files like `server.js`, `package.json`, and `render.yaml`. Additionally, a critical vulnerability (Arbitrary Code Execution) was present in `protobufjs`.
**Learning:** Serving the root directory in Express is extremely dangerous as it defaults to exposing every file in the project unless specifically blocked or filtered.
**Prevention:** Always serve static assets from a dedicated subdirectory (e.g., `public/`). If the root must be served, use a whitelist or a strict blacklist middleware to protect sensitive project files and dotfiles. Regularly run `npm audit` to catch transitive vulnerabilities.
