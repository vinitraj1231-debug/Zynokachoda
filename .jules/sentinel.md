# Sentinel Journal 🛡️

## 2026-05-11 - Robust URL Path Verification in Middleware
**Vulnerability:** Sensitive files in hidden directories (e.g., `/.git/config`) and log files were exposed because the security middleware only inspected the last segment of the URL path.
**Learning:** Checking only the `filename` (last segment) of a path is insufficient for blocking hidden directories or nested sensitive files. Attackers can bypass such checks by targeting sub-segments.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) to ensure no part of the requested URL contains forbidden patterns, hidden folders, or sensitive extensions.
