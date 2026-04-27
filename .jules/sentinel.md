# Sentinel Journal

## 2026-04-27 - Information Leakage via Static File Serving in Root-Served Projects
**Vulnerability:** Sensitive configuration files (\`server.js\`, \`package.json\`) and hidden directories (e.g., \`.git\`) were publicly accessible because the Express server served the root directory.
**Learning:** Simple filename-based blacklists in middleware are insufficient when the server allows directory traversal or deep path access. Protecting only the "last part" of a path allows attackers to access sensitive data in nested hidden directories.
**Prevention:** Implement recursive path segment checking in security middleware or, ideally, move all public assets to a dedicated subdirectory (e.g., \`/public\`) and serve only from there.
