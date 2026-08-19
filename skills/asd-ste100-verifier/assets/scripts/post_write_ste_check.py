#!/usr/bin/env python3
import sys
import subprocess
from pathlib import Path

def main():
    if len(sys.argv) < 2:
        sys.exit(0)

    target_file = Path(sys.argv[1])
    if target_file.suffix.lower() == ".md" and target_file.exists():
        # Automatically run ste-lint --fix on modified markdown file
        subprocess.run(["python3", "-m", "ste_verifier.cli", "--fix", str(target_file)], check=False)

if __name__ == "__main__":
    main()
