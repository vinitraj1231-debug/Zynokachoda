# Sentinel Journal

## 2025-05-15 - Critical Arbitrary Code Execution vulnerability in protobufjs
**Vulnerability:** protobufjs < 7.5.5 is vulnerable to Arbitrary Code Execution (ACE) via the `parse` and `load` methods when processing untrusted input.
**Learning:** Transitive dependencies can introduce critical vulnerabilities even if direct dependencies seem secure. In this case, `firebase` brought in an outdated version of `protobufjs`.
**Prevention:** Use `npm overrides` (or `resolutions` for yarn/pnpm) to force secure versions of transitive dependencies when they are not updated by the parent package. Regularly run `npm audit`.
