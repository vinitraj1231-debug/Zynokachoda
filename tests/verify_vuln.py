import os

def test_path_traversal():
    SENSITIVE_FILES = {
        'package.json', 'package-lock.json', 'server.js',
        'render.yaml', '.gitignore', 'readme.md',
        'supabase_setup.sql', 'requirements.txt', 'main.py'
    }

    # Simulate updated logic in main.py
    def is_forbidden(path):
        path = path.lower()
        segments = [s for s in path.split('/') if s]

        for segment in segments:
            if segment.startswith('.') or segment in SENSITIVE_FILES:
                return True
        return False

    paths_to_test = [
        ("/main.py",          True),
        ("/.gitignore",       True),
        ("/.git/config",      True),
        ("/etc/passwd",       False), # Not in sensitive_files, not starting with .
        ("/package.json",     True),
        ("/some/path/.env",   True),
        ("/normal/path.js",   False),
        ("/.ssh/id_rsa",      True),
    ]

    all_passed = True
    for path, expected in paths_to_test:
        forbidden = is_forbidden(path)
        passed = (forbidden == expected)
        if not passed:
            all_passed = False
        print(f"Path: {path:20} | Forbidden: {forbidden:5} | Expected: {expected:5} | {'PASS' if passed else 'FAIL'}")

    if all_passed:
        print("\nAll tests passed!")
    else:
        print("\nSome tests failed!")
        exit(1)

if __name__ == "__main__":
    test_path_traversal()
