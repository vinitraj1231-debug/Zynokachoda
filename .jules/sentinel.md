## 2025-05-14 - Path Traversal Bypass via Segmented Paths

**Vulnerability:** Security middleware that only checks the final segment of a URL path (e.g., `segments[-1]`) can be bypassed by placing sensitive files or hidden directories in non-terminal positions (e.g., `/.git/config`).

**Learning:** Path verification must be comprehensive across all path segments. Attackers can exploit partial path validation to access sensitive metadata directories or configuration files that aren't explicitly listed in a filename-only blocklist.

**Prevention:** Iterate through all segments of a URL path (e.g., using `path.split('/')`) and validate each segment against a list of sensitive names, hidden prefixes (like `.`), and prohibited extensions.
