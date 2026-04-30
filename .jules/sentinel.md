## 2025-05-15 - Transitive Dependency Vulnerability in protobufjs
**Vulnerability:** Arbitrary Code Execution (GHSA-xq3m-2v4x-88gg) in protobufjs < 7.5.5.
**Learning:** Even if not a direct dependency, transitive dependencies can introduce critical risks. npm's 'overrides' field allows forcing a safe version across the dependency tree.
**Prevention:** Regularly run 'npm audit' and use 'overrides' (npm/pnpm) or 'resolutions' (yarn) to patch vulnerabilities in nested dependencies that aren't yet updated by parent packages.

## 2025-05-15 - XSS via innerHTML in Vanilla JS
**Vulnerability:** Cross-Site Scripting (XSS) via unsafe innerHTML assignments with user-provided data (full_name, username).
**Learning:** Template literals with innerHTML are convenient but dangerous if variables are not sanitized.
**Prevention:** Use 'textContent' for text and programmatically create elements using 'document.createElement' for structure. Avoid 'innerHTML' unless the content is trusted or pre-sanitized.
