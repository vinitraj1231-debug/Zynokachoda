## 2026-05-08 - [XSS Prevention via DOM APIs]
**Vulnerability:** Potential XSS via `innerHTML` when rendering user-controlled data in search results and chat messages.
**Learning:** Even simulated data or metadata (like usernames) can be exploited if rendered using `innerHTML`. Using `Object.assign(document.createElement(tag), { properties })` is a concise and safe way to build DOM elements without risking injection.
**Prevention:** Always prefer `textContent` and explicit DOM element creation over `innerHTML` for any content that includes user-provided strings.
