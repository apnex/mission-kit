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
	# The fence's language decides what a comment is. In markdown a leading # is a heading, and
	# a fenced markdown skeleton is the ordinary way to show a document's shape, so counting its
	# headings as narration is a false failure that trains readers to ignore the tool.
	done < <(awk '/^```/{c=!c; if (c) lang=substr($0,4); n=0; next} !c{next}
	              lang=="markdown" || lang=="md" {next}
	              /^[[:space:]]*#/{n++; if (n==2) print FNR; next} {n=0}' "$f")
done
style_summary S8 "${#files[@]}"
