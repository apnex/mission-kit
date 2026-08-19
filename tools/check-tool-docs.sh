#!/usr/bin/env bash
# check-tool-docs - hold tools/README.md to the directory it indexes.
#
# Sovereign duty: this invariant and no other. check-structure.sh holds the repository's directory
# shape; this holds the tool index against the tools beside it.
#
#   every section in tools/README.md names a file that exists
#   every executable in tools/ is named somewhere in tools/README.md
#
# The first is the fault that produced this tool. tools/README.md was once two documents
# concatenated, and the older half documented check-style.sh and reflow-sentences.mjs after the
# same commit deleted both. Nothing detected it, because every existing checker read entries or
# directories rather than the tool index itself.
#
# The second direction catches the inverse: a tool shipped with no way to find it.
#
# A per-rule enforcer (tools/s<N>-*) satisfies the second invariant through the rule table rather
# than a section of its own, so a mention anywhere in the file counts.
#
# Exit non-zero if either invariant is broken.
#
# Usage:  tools/check-tool-docs.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

readme=tools/README.md
fail=0
report() { printf 'FAIL  %-14s %s\n' "$1" "$2"; fail=$((fail + 1)); }

[ -f "$readme" ] || { echo "FAIL  missing        $readme does not exist"; exit 1; }

# Direction 1: a documented tool must exist. A section naming a deleted file sends the reader to
# a command that cannot run, and reads as authoritative because it sits beside sections that work.
while IFS= read -r name; do
	[ -z "$name" ] && continue
	[ -e "tools/$name" ] || report "phantom tool" "$readme documents '$name', which does not exist in tools/"
done < <(grep -oE '^## [A-Za-z0-9_.-]+\.(sh|mjs)$' "$readme" | sed 's/^## //')

# Direction 2: an existing tool must be findable. A tool nothing names is reachable only by
# listing the directory, which is the unreachable-entry fault applied to executables.
while IFS= read -r path; do
	name=$(basename "$path")
	grep -qF "$name" "$readme" \
		|| report "undocumented" "tools/$name is named nowhere in $readme"
done < <(find tools -maxdepth 1 -type f \( -name '*.sh' -o -name '*.mjs' \) | sort)

echo
if [ "$fail" -gt 0 ]; then
	echo "$fail tool-index failure(s)."
	exit 1
fi
echo "tool docs: every documented tool exists, and every tool is documented."
