## 2025-05-22 - Path Segment Bypass for Hidden Files
**Vulnerability:** The security middleware only checked the last segment of the URL path (the filename). This allowed attackers to access sensitive files inside hidden directories (e.g., `/.git/config`) because the middleware didn't verify the parent segments.
**Learning:** When implementing path-based security filters, it's critical to validate every segment of the path, as hidden directories can contain sensitive information and may bypass simple filename-only checks.
**Prevention:** Always iterate through all path segments (e.g., `path.split('/')`) and block requests if any segment matches a sensitive pattern or starts with a dot.

## 2025-06-21 - Authentication CPU Exhaustion via Malformed Payloads
**Vulnerability:** Authentication registration and login endpoints accepted unvalidated input payloads, allowing attackers to transmit excessively long passwords (or usernames/emails), leading to severe CPU exhaustion (Denial of Service) during password hashing operations.
**Learning:** Hashing algorithms like bcrypt are intentionally CPU-intensive. Sending huge strings to bcrypt or using poorly constructed regular expressions on unchecked input values can exhaust server resources instantly.
**Prevention:** Always perform early type validation, enforce strict maximum length limits on usernames, emails, and passwords, and employ simple, ReDoS-safe email validation regex patterns on authentication request handlers.
