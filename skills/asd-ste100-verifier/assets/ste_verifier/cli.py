import sys
import argparse
from pathlib import Path
from ste_verifier.dictionary import STEDictionary
from ste_verifier.checker import STEChecker
from ste_verifier.formatter import STEFormatter


def main():
    parser = argparse.ArgumentParser(description="ASD-STE100 Verification CLI & Linter")
    parser.add_argument("files", nargs="+", help="Markdown or text files to audit")
    parser.add_argument("--config", help="Path to project .ste-dictionary.json config", default=".ste-dictionary.json")
    parser.add_argument("--fix", action="store_true", help="Automatically apply suggested STE term replacements inplace")
    parser.add_argument("--permissive", action="store_true", help="Disable strict unlisted word checking (allow unlisted domain words)")
    parser.add_argument("--strict", action="store_true", help="Exit with non-zero exit code if any error or warning is found")

    args = parser.parse_args()

    project_config = Path(args.config)
    dictionary = STEDictionary(project_config_path=project_config if project_config.exists() else None)
    
    # Default to strict mechanical unlisted word enforcement unless --permissive is passed
    strict_unlisted_mode = not args.permissive
    checker = STEChecker(dictionary, strict_unlisted=strict_unlisted_mode)

    total_errors = 0
    total_warnings = 0

    for file_path in args.files:
        p = Path(file_path)
        if not p.exists():
            print(f"Error: File '{file_path}' not found.", file=sys.stderr)
            continue

        text = p.read_text(encoding="utf-8")

        if args.fix:
            fixed_text = checker.autofix_text(text)
            p.write_text(fixed_text, encoding="utf-8")
            print(f"Applied STE autofix to '{file_path}'.")

        violations = checker.check_text(text)
        report = STEFormatter.format_cli_report(p.name, text, violations)
        print(report)

        total_errors += sum(1 for v in violations if v.severity == "ERROR")
        total_warnings += sum(1 for v in violations if v.severity == "WARNING")

    if args.strict and (total_errors > 0 or total_warnings > 0):
        sys.exit(1)


if __name__ == "__main__":
    main()
