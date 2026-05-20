## 2026-05-20 - [Sensitive Path Bypass in Middleware]
**Vulnerability:** Sensitive files and directories (e.g., `/.git/config`, `/node_modules/package.json`) could be accessed because the `SecurityMiddleware` only verified the terminal segment of the URL path.
**Learning:** Checking only the last part of a path is insufficient for security filters. Attackers can bypass these checks by nesting sensitive files or directories within a path.
**Prevention:** Always iterate through all segments of a URL path when implementing blocklists for files or directories. Use a `set` for performant lookups if the blocklist is large.
