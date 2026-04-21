## 2026-04-21 - Server Hardening and Dependency Remediation
**Vulnerability:** Public access to sensitive configuration files (`package.json`, `server.js`, etc.) and a critical transitive vulnerability in `protobufjs` (arbitrary code execution) introduced via `firebase`.
**Learning:** The default Express static middleware serves all files in the directory unless explicitly restricted. Dependencies can introduce critical security risks that need regular auditing.
**Prevention:** Implement a whitelist or blacklist for static file serving, use `helmet` for security headers, and integrate `npm audit` into the CI/CD pipeline.
