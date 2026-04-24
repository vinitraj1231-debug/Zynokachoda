## 2026-04-24 - Information Disclosure via Static File Serving
**Vulnerability:** The Express server was serving the entire root directory as static files, allowing public access to sensitive files like `package.json`, `server.js`, and `.gitignore`.
**Learning:** Using `express.static('.')` is dangerous without proper filtering, as it exposes server-side code and configuration files.
**Prevention:** Implement a blacklist middleware or explicitly serve only a `public` or `dist` directory.

## 2026-04-24 - Transitive Dependency Vulnerability in protobufjs
**Vulnerability:** `protobufjs` < 7.2.4 (and others before 7.5.5) had an arbitrary code execution vulnerability.
**Learning:** Critical vulnerabilities can enter the codebase through deep transitive dependencies (in this case, via `firebase`).
**Prevention:** Regularly run `npm audit` and keep top-level dependencies updated.
