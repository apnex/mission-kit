from typing import List
from ste_verifier.checker import STEViolation


class STEFormatter:
    @staticmethod
    def format_cli_report(filename: str, text: str, violations: List[STEViolation]) -> str:
        lines = text.splitlines()
        total_lines = len(lines)
        total_violations = len(violations)
        
        # Calculate quality score
        error_count = sum(1 for v in violations if v.severity == "ERROR")
        warning_count = sum(1 for v in violations if v.severity == "WARNING")
        
        score = max(0, 100 - (error_count * 5 + warning_count * 2))

        output = []
        output.append("=" * 80)
        output.append(f"  ASD-STE100 COMPLIANCE AUDIT REPORT: {filename}")
        output.append("=" * 80)
        output.append(f"  Overall Quality Score : {score}%")
        output.append(f"  Total Lines Evaluated : {total_lines}")
        output.append(f"  Total Violations      : {total_violations} ({error_count} ERRORS, {warning_count} WARNINGS)")
        output.append("-" * 80)

        if not violations:
            output.append("  SUCCESS: No ASD-STE100 violations detected!")
            output.append("=" * 80)
            return "\n".join(output)

        output.append("\nLINE-BY-LINE AUDIT DETAILS:\n")
        for v in violations:
            prefix = "[ERROR]" if v.severity == "ERROR" else "[WARN]"
            output.append(f"  Line {v.line_num:3d} {prefix} {v.rule_id}")
            output.append(f"           Message    : {v.message}")
            output.append(f"           Original   : \"{v.original_text}\"")
            if v.replacement:
                output.append(f"           STE Suggest: \"{v.replacement}\"")
            output.append("")

        output.append("=" * 80)
        return "\n".join(output)
