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

	# The charter's prefix column is a claim about the ledger, so hold it to one.
	#
	# The claim is an equality, not a presence. An earlier form asked only whether a prefixed
	# layer had at least one row, which passed a layer holding five entry files and one row, and
	# false-failed a layer declared before its first entry exists. Counting both sides fixes both.
	#
	# An entry is a top-level markdown file in the layer that declares an id in its frontmatter.
	# Counting by filename pattern instead was wrong twice over: backlog/ names its files in
	# lowercase, and roles/, domains/ and work-types/ carry their entry in README.md itself.
	# The declaration is the fact; the filename is a convention. A layer declaring '-' holds
	# mechanism, so it must have neither an entry nor a ledger row.
	row=$(grep -E "^\| .* \[\`${d}/\`\]" README.md | head -1)
	[ -z "$row" ] && continue
	prefix=$(printf '%s' "$row" | sed -E 's/^\| *`?([^`|]*)`? *\|.*/\1/' | tr -d ' ')
	in_ledger=$(grep -cE "^\| \[[A-Z]+-?[0-9]+\]\(${d}/" INDEX.md)
	on_disk=0
	for f in "$d"/*.md; do
		[ -f "$f" ] || continue
		awk 'FNR==1 && !/^---$/{exit} FNR==1{next} /^---$/{exit} /^id:[[:space:]]*[^[:space:]]/{found=1; exit}
		     END{exit !found}' "$f" && on_disk=$((on_disk + 1))
	done

	if [ "$prefix" = "-" ]; then
		[ "$in_ledger" -eq 0 ] && [ "$on_disk" -eq 0 ] \
			|| report "unclassified" "$d/ declares no prefix but has $on_disk entry file(s) and $in_ledger ledger row(s)"
	else
		[ "$in_ledger" -eq "$on_disk" ] \
			|| report "unclassified" "$d/ declares prefix '$prefix' with $on_disk entry file(s) but $in_ledger ledger row(s)"
	fi
done

echo
if [ "$fail" -gt 0 ]; then
	echo "$fail structural failure(s)."
	exit 1
fi
echo "structure: every top-level directory is documented and self-describing."
