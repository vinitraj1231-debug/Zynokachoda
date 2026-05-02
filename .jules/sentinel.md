# Sentinel Security Journal

## 2025-05-02 - [CRITICAL] Dependency Vulnerability in protobufjs
**Vulnerability:** Arbitrary Code Execution (ACE) in `protobufjs` versions < 7.5.5 (GHSA-xq3m-2v4x-88gg).
**Learning:** Even if a package is not directly imported in the main source files, it can be a transitive dependency (e.g., through Firebase or Supabase SDKs) and still pose a critical risk. `npm audit` might resolve it in the lockfile, but it's more secure to pin it in `package.json` using `overrides`.
**Prevention:** Use `npm audit` regularly and implement the `overrides` field in `package.json` to force secure versions of critical transitive dependencies.
