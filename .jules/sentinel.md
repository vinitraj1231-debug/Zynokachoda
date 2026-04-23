## 2026-04-23 - [Sensitive File Exposure & Critical Dependency Vulnerability]
**Vulnerability:** The Express server was serving all files in the root directory, including sensitive files like `package.json`, `server.js`, and `.gitignore`. Additionally, `protobufjs` had a critical arbitrary code execution vulnerability.
**Learning:** Default static file serving in Express is overly permissive if pointed to the root directory. Transitive dependencies can introduce critical risks even in relatively simple applications.
**Prevention:** Always implement a whitelist or blacklist for static files when serving from a directory containing sensitive information. Regularly run `npm audit` and apply fixes to stay ahead of known vulnerabilities.
