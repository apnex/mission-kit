#!/usr/bin/env bash
# check-structure - hold the repository's own shape to what its documents claim.
#
# Two invariants, both of which have already been broken:
#
#   every top-level directory is named in the root README
#   every top-level directory carries its own README
#
# The first is the typed-index fault at directory granularity. A new directory appears in no
# document until somebody remembers, and nothing notices that it did not. statusline/ and
# statusline-pi/ went undocumented in the charter that way, while being listed in the ledger.
#
# Exit non-zero if any invariant is broken.
#
# Usage:  tools/check-structure.sh

set -uo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

fail=0
report() { printf 'FAIL  %-12s %s\n' "$1" "$2"; fail=$((fail + 1)); }

for dir in */; do
	d=${dir%/}
	case "$d" in node_modules|.*) continue ;; esac

	# Named in the charter, so a reader of it alone learns the directory exists.
	grep -q "\b${d}/" README.md || report "undocumented" "$d/ is not named in README.md"

	# Owns its own README, so the layer explains itself rather than relying on the root.
	[ -f "$d/README.md" ] || report "no readme" "$d/ has no README.md"

	# The charter's prefix column is a claim about the ledger, so hold it to one. A layer
	# declaring a prefix must have entries under it; a layer declaring '-' must have none.
	# Without this the knowledge-versus-mechanism ruling is advisory, and the charter and the
	# ledger are free to disagree about whether a directory's contents are entries.
	row=$(grep -E "^\| .* \[\`${d}/\`\]" README.md | head -1)
	[ -z "$row" ] && continue
	prefix=$(printf '%s' "$row" | sed -E 's/^\| *`?([^`|]*)`? *\|.*/\1/' | tr -d ' ')
	in_ledger=$(grep -cE "^\| \[[A-Z]+-?[0-9]+\]\(${d}/" INDEX.md)

	if [ "$prefix" = "-" ]; then
		[ "$in_ledger" -eq 0 ] \
			|| report "unclassified" "$d/ declares no prefix but has $in_ledger entr(ies) in INDEX.md"
	else
		[ "$in_ledger" -gt 0 ] \
			|| report "unclassified" "$d/ declares prefix '$prefix' but has no entries in INDEX.md"
	fi
done

echo
if [ "$fail" -gt 0 ]; then
	echo "$fail structural failure(s)."
	exit 1
fi
echo "structure: every top-level directory is documented and self-describing."
