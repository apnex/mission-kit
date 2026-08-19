#!/usr/bin/env bash
# check-enforcers - hold the pairing between a rule and the tool that enforces it.
#
# Sovereign duty: this invariant and no other. The link between a rule and its mechanism used to
# live only in prose, which is how six rules came to be enforced by one file holding six duties.
# Declaring it in frontmatter makes it checkable in both directions.
#
#   a rule naming a tool that does not exist is a broken promise
#   a per-rule tool that no rule claims is orphaned
#
# Exit non-zero if either holds.
#
# Usage:  tools/check-enforcers.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

fail=0
report() { printf 'FAIL  %-12s %s\n' "$1" "$2"; fail=$((fail + 1)); }

# Every rule that declares an enforcer must have one, and every per-rule tool must belong to a
# rule. The link between a rule and its mechanism was prose-only, which is how six rules came to
# be enforced by one file holding six duties.
for entry in style/S*.md; do
	[ -f "$entry" ] || continue
	tool=$(awk 'FNR==1 && !/^---$/{exit} FNR==1{next} /^---$/{exit}
	            /^enforced-by:/{sub(/^enforced-by:[[:space:]]*/, ""); print; exit}' "$entry")
	[ -z "$tool" ] && continue
	[ -x "$tool" ] || report "no enforcer" "$entry names $tool, which is not an executable file"
done

for tool in tools/s[0-9]*-*; do
	[ -e "$tool" ] || continue
	rule=$(basename "$tool" | grep -oE '^s[0-9]+' | tr 'a-z' 'A-Z')
	grep -ql "^enforced-by: $tool$" style/${rule}-*.md 2>/dev/null \
		|| report "orphan tool" "$tool is claimed by no rule; expected style/${rule}-*.md to name it"
done

echo
if [ "$fail" -gt 0 ]; then
	echo "$fail enforcer pairing failure(s)."
	exit 1
fi
echo "enforcers: every rule names a real tool, and every tool is claimed by a rule."
