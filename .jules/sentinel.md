# Sentinel Journal

## 2026-05-06 - [Concise XSS Mitigation Pattern]
**Vulnerability:** Widespread use of `innerHTML` with user-provided or simulated data (chat messages, search results, contact info) creating significant XSS exposure.
**Learning:** Refactoring multiple `innerHTML` sites into safe DOM manipulation can quickly exceed line-count limits (50 lines) if using verbose `createElement`/`textContent` assignments.
**Prevention:** Use the `Object.assign(document.createElement(tag), { properties })` pattern combined with `Element.append()` to implement safe, multi-property DOM creation in a single line. This maintains security while keeping PRs small and readable.
