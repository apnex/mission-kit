#!/usr/bin/env bash
# s8-code-block-comments - enforce S8: comments annotate a line, they are not prose.
#
# Sovereign duty: this rule and no other. Two or more consecutive comment lines inside a fence
# are narration that belongs in prose between blocks. There is no --fix: deciding what the
# narration should say is judgement, not a substitution.
#
# Usage:  tools/s8-code-block-comments.sh [FILE ...]

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
. "$root/tools/lib/style-common.sh"

mapfile -t files < <(style_files "$root" "$@")
for f in "${files[@]}"; do
	[ -f "$f" ] || continue
	style_exempt "$f" S8 && continue
	while IFS= read -r line; do
		[ -n "$line" ] && style_report S8 "$f" "$line" "2+ consecutive comment lines in a code block"
	done < <(awk '/^```/{c=!c; n=0; next} !c{next}
	              /^[[:space:]]*#/{n++; if (n==2) print FNR; next} {n=0}' "$f")
done
style_summary S8 "${#files[@]}"
