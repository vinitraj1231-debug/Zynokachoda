## 2026-04-17 - Server Hardening and Path-Based Access Control
**Vulnerability:** Information Disclosure and Weak Security Headers.
**Learning:** The Express server was serving all files in the root directory by default, including sensitive configuration files like `package.json` and `render.yaml`. Additionally, it lacked modern security headers, leaving it vulnerable to various web-based attacks.
**Prevention:** Use `helmet` for standardized security headers and implement custom middleware to explicitly block access to sensitive file patterns (e.g., hidden files, config files) when using broad static file serving.
