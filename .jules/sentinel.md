## 2026-04-20 - Sensitive File Exposure and Missing Security Headers
**Vulnerability:** Public access to sensitive configuration files (package.json, server.js, .gitignore) and lack of standard security headers.
**Learning:** Default Express setups using static middleware on the root directory without explicit exclusions will serve all files in that directory, including sensitive ones.
**Prevention:** Implement custom middleware to block known sensitive files and hidden files, and use libraries like 'helmet' to automatically set secure HTTP headers.
