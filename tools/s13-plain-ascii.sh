#!/usr/bin/env bash
# s13-plain-ascii - enforce S13: printable ASCII only, Box Drawing excepted.
#
# Sovereign duty: this rule and no other. The conversion table it applies in --fix is the one
# style/S13-plain-ascii-in-markdown.md publishes, so the rule has one definition and the checker
# and the converter cannot disagree about it.
#
# Usage:  tools/s13-plain-ascii.sh [--fix] [FILE ...]

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
. "$root/tools/lib/style-common.sh"

fix=0; args=()
while [ $# -gt 0 ]; do case "$1" in --fix) fix=1; shift ;; *) args+=("$1"); shift ;; esac; done
mapfile -t files < <(style_files "$root" "${args[@]+"${args[@]}"}")

for f in "${files[@]}"; do
	[ -f "$f" ] || continue
	style_exempt "$f" S13 && continue
	if [ "$fix" -eq 1 ]; then
		perl -CSD -i -pe '
			s/ \x{2014} / - /g; s/\x{2014}/-/g; s/\x{2013}/-/g; s/\x{2212}/-/g;
			s/\x{2192}/->/g; s/\x{2190}/<-/g; s/\x{2194}/<->/g; s/\x{27F6}/-->/g;
			s/\x{21D2}/=>/g; s/\x{27FA}/<=>/g;
			s/\x{2265}/>=/g; s/\x{2264}/<=/g; s/\x{2260}/!=/g; s/\x{2248}/~=/g;
			s/\x{00D7}/x/g; s/\x{00B1}/+\/-/g; s/\x{2026}/.../g;
			s/\x{2019}/\x27/g; s/[\x{201C}\x{201D}]/"/g;
			s/ \x{00B7} / - /g; s/\x{00B7}/-/g;
			s/\x{00A9}/(c)/g;
			# A word-substitution keeps the separating space only when a word follows it.
			# Emitting it unconditionally turns "\x{00A7}-style" into "section -style", inventing a
			# space the author did not write.
			s/\x{00A7}\s*(?=\w)/section /g;   s/\x{00A7}\s*/section/g;
			s/\x{25B6}\s*(?=\w)/> /g;         s/\x{25B6}\s*/>/g;
			s/\x{25C9}\s*(?=\w)/* /g;         s/\x{25C9}\s*/*/g;
			s/\x{26A0}\s*(?=\w)/WARNING /g;   s/\x{26A0}\s*/WARNING/g;
			s/\x{2705}\s*(?=\w)/[x] /g;       s/\x{2705}\s*/[x]/g;
			s/\x{2713}\s*(?=\w)/[x] /g;       s/\x{2713}\s*/[x]/g;
			s/\x{2717}\s*(?=\w)/[ ] /g;       s/\x{2717}\s*/[ ]/g;
			s/\x{27F3}\s*(?=\w)/retry /g;     s/\x{27F3}\s*/retry/g;
			s/\x{1F534}\s*//g; s/\x{1F916}\s*//g;
		' "$f"
		continue
	fi
	while IFS= read -r line; do
		[ -n "$line" ] && style_report S13 "$f" "$line" "non-ASCII character"
	done < <(grep -nP '[\x{80}-\x{24FF}\x{2580}-\x{10FFFF}]' "$f" | cut -d: -f1 | uniq)
done

[ "$fix" -eq 1 ] && { echo; echo "s13: applied to ${#files[@]} file(s)."; exit 0; }
style_summary S13 "${#files[@]}"
