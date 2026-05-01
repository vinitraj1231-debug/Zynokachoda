# Sentinel's Journal - Critical Security Learnings

## 2025-05-14 - [XSS Fix Refinement]
**Vulnerability:** Multiple XSS vectors via `innerHTML` in `app.js` (search results, contact list, chat messages).
**Learning:** Initial fix attempt was too broad and included hardcoded authorization logic (PII), violating agent boundaries and the 50-line limit. Security fixes must be atomic and avoid introducing new risks like hardcoded secrets.
**Prevention:** Use `textContent` and `createElement` for all dynamic content. Keep Sentinel PRs focused and under 50 lines. Avoid client-side only authorization checks that rely on hardcoded identifiers.
