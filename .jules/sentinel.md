## 2026-04-29 - [Dependency] Critical Vulnerability in protobufjs
**Vulnerability:** Arbitrary Code Execution (ACE) in `protobufjs` < 7.5.5 (GHSA-xq3m-2v4x-88gg).
**Learning:** Transitive dependencies can introduce critical vulnerabilities that aren't immediately visible in `package.json`. Using the `overrides` field in `package.json` is a robust way to enforce secure versions of transitive dependencies.
**Prevention:** Integrate `npm audit` into the CI/CD pipeline and use `overrides` or `resolutions` to manage vulnerable transitive dependencies when direct updates are not possible.
