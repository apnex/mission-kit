#!/usr/bin/env bash
# s12-code-block-introducer - enforce S12: an introducer touches the block it introduces.
#
# Sovereign duty: this rule and no other. A sentence ending in a colon directly above a fence
# owns that block; a blank line between them makes the reader cross a gap to learn which
# sentence the code belongs to.
#
# Usage:  tools/s12-code-block-introducer.sh [--fix] [FILE ...]

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
. "$root/tools/lib/style-common.sh"

fix=0; args=()
while [ $# -gt 0 ]; do case "$1" in --fix) fix=1; shift ;; *) args+=("$1"); shift ;; esac; done
mapfile -t files < <(style_files "$root" "${args[@]+"${args[@]}"}")

for f in "${files[@]}"; do
	[ -f "$f" ] || continue
	style_exempt "$f" S12 && continue
	if [ "$fix" -eq 1 ]; then
		perl -0777 -i -pe 's/(\n[^\n]*:)\n\n(`{3,})/$1\n$2/g' "$f"
		continue
	fi
	while IFS= read -r line; do
		[ -n "$line" ] && style_report S12 "$f" "$line" "blank line between introducer and the code block it introduces"
	done < <(awk '/^```/{c=!c} /:$/ && !c {i=FNR; next}
	              /^```/ && FNR==i+2 {print i}' "$f")
done

[ "$fix" -eq 1 ] && { echo; echo "s12: applied to ${#files[@]} file(s)."; exit 0; }
style_summary S12 "${#files[@]}"
