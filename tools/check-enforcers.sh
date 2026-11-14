#!/usr/bin/env bash
# check-enforcers - hold the pairing between a rule and the tool that enforces it.
#
# Sovereign duty: this invariant and no other. The link between a rule and its mechanism used to
# live only in prose, which is how six rules came to be enforced by one file holding six duties.
# Declaring it in frontmatter makes it checkable in both directions.
#
#   a rule naming a tool that does not exist is a broken promise
#   a rule body naming a script other than its declared enforced-by is a forked enforcer
#   a per-rule tool that no rule claims is orphaned
#
# Exit non-zero if any holds.
#
# Usage:  tools/check-enforcers.sh [--root DIR]

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
if [ "${1:-}" = "--root" ]; then
	if [ -z "${2:-}" ] || [[ "${2:-}" == --* ]]; then
		echo "FAIL  usage        --root requires a directory path" >&2
		exit 2
	fi
	root="$2"
fi
cd "$root" || exit 2

fail=0
report() { printf 'FAIL  %-12s %s\n' "$1" "$2"; fail=$((fail + 1)); }

# Every rule that declares an enforcer in frontmatter or names a tools/*.sh or tools/*.mjs script
# in its body must point to an executable file, any non-test script in the body must agree with
# enforced-by:, and every per-rule tool (tools/s[0-9]*-* and tools/ru[0-9]*-*) must belong to a rule.
for entry in style/S*.md rules/RU*.md; do
	[ -f "$entry" ] || continue
	tool=$(awk 'FNR==1 && !/^---$/{exit} FNR==1{next} /^---$/{exit}
	            /^enforced-by:/{sub(/^enforced-by:[[:space:]]*/, ""); print; exit}' "$entry")
	if [ -n "$tool" ]; then
		{ [ -f "$tool" ] && [ -x "$tool" ]; } || report "no enforcer" "$entry names $tool, which is not an executable file"
	fi
	for body_tool in $(awk 'FNR==1 && /^---$/{in_fm=1; next} in_fm && /^---$/{in_fm=0; next} !in_fm' "$entry" \
		| grep -oE 'tools/[A-Za-z0-9_./-]+\.(sh|mjs)' | sort -u); do
		if ! { [ -f "$body_tool" ] && [ -x "$body_tool" ]; }; then
			report "no enforcer" "$entry body names $body_tool, which is not an executable file"
		elif [[ "$body_tool" != *.test.sh ]] && [ "$body_tool" != "$tool" ]; then
			report "forked tool" "$entry body names $body_tool, which disagrees with enforced-by: ${tool:-none}"
		fi
	done
done

for tool in tools/s[0-9]*-* tools/ru[0-9]*-*; do
	[ -e "$tool" ] || continue
	# A test names the tool it exercises, not a rule. It enforces nothing and no rule may claim
	# it, so requiring a pairing would force a rule to declare two enforcers and break the
	# one-rule-one-tool invariant this script exists to hold.
	case "$tool" in *.test.sh) continue ;; esac
	rule=$(basename "$tool" | grep -oE '^(s|ru)[0-9]+' | tr 'a-z' 'A-Z')
	dir=$(case "$rule" in S*) echo style ;; RU*) echo rules ;; esac)
	grep -ql "^enforced-by: $tool$" "${dir}/${rule}"-*.md 2>/dev/null \
		|| report "orphan tool" "$tool is claimed by no rule; expected ${dir}/${rule}-*.md to name it"
done

echo
if [ "$fail" -gt 0 ]; then
	echo "$fail enforcer pairing failure(s)."
	exit 1
fi
echo "enforcers: every rule names a real tool, and every tool is claimed by a rule."
