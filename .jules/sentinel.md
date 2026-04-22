## 2026-04-22 - Server Hardening and Dependency Fix
**Vulnerability:** Critical vulnerability in `protobufjs` (Arbitrary Code Execution) and exposure of sensitive server files (`server.js`, `package.json`, etc.) due to root directory being served statically.
**Learning:** Serving the root directory of a Node.js project statically is extremely dangerous as it exposes configuration, source code, and secrets.
**Prevention:** Always implement middleware to block access to sensitive files and use `helmet` for secure headers. Regularly run `npm audit` to catch and fix critical dependency vulnerabilities.
