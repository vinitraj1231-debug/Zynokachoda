## 2025-05-22 - Path Traversal Vulnerability in Security Middleware
**Vulnerability:** The `SecurityMiddleware` only checked the last segment of the URL path for sensitive files, allowing access to sensitive files if they were located in hidden directories (e.g., `/.git/config`).
**Learning:** Path validation must iterate through ALL segments of the URL path to ensure that no part of the path refers to a forbidden file or directory.
**Prevention:** Use an iterative approach to validate every segment of the URL path against a blocklist of sensitive filenames and patterns (like hidden files starting with `.`).
