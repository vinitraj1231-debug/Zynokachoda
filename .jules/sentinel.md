# Sentinel Journal

## 2025-05-22 - Path Traversal Vulnerability via Path Segments
**Vulnerability:** Accessing hidden files or sensitive directories by targeting nested path segments (e.g., /.git/config) when only the filename is checked.
**Learning:** Checking only the last segment of a path is insufficient; all segments must be validated to prevent exposure of hidden metadata or configuration directories.
**Prevention:** Iterate through all path segments and block access if any segment matches a sensitive filename or starts with a dot.

## 2025-05-22 - Binary Artifacts and Log Hygiene
**Vulnerability:** Accidental commitment of binary build artifacts (__pycache__) and dynamic log files containing internal error traces.
**Learning:** Development activities can generate artifacts and logs that, if committed, clutter the repository and may leak information about the development environment.
**Prevention:** Strictly maintain .gitignore and ensure all non-source artifacts are removed or ignored before staging changes.
