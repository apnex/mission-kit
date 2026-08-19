#!/usr/bin/env bash
# format-markdown - apply every mechanical style fix this corpus can make without judgement.
#
# The four passes below were hand-written at each call site for a while, which is how a
# non-idempotent horizontal-rule insertion put a second rule into fourteen files that already
# had one. A pass that runs twice must leave the second run with nothing to do; this script is
# tested for that, and the call sites are gone.
#
#   S13  non-ASCII converted using the table the entry publishes, box drawing excepted
#   S6   one sentence per line, via tools/reflow-sentences.mjs
#   S12  an introducer moved against the fence it introduces
#   S10  a horizontal rule before each top-level section, inserted only where none exists
#
# Judgement is out of scope. Nothing here rewords, rescopes or restructures; a word-stream
# comparison before and after should differ only by the S13 substitutions.
#
# A file declaring GENERATED FILE is skipped: the fix belongs to the source its compiler reads.
#
# Usage:  tools/format-markdown.sh FILE...
#         tools/format-markdown.sh --check FILE...   report whether a pass would change anything

set -uo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
check=0
files=()
while [ $# -gt 0 ]; do
	case "$1" in
		--check) check=1; shift ;;
		-h|--help) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
		*) files+=("$1"); shift ;;
	esac
done
[ ${#files[@]} -eq 0 ] && { echo "usage: format-markdown.sh [--check] FILE..." >&2; exit 2; }

changed=0
for f in "${files[@]}"; do
	[ -f "$f" ] || continue
	head -12 "$f" | grep -qF "GENERATED FILE" && continue
	# Honour the same exemption markers the checker honours, per pass rather than per file:
	# a file exempt from S13 still wants its sentences and section rules fixed.
	skip_s13=0
	grep -qF "style-check: allow S13" "$f" && skip_s13=1

	before=$(cat "$f")
	tmp=$(mktemp); cp "$f" "$tmp"

	# S13 - the conversions the entry's own table prescribes.
	[ "$skip_s13" -eq 0 ] && perl -CSD -i -pe '
		s/ \x{2014} / - /g; s/\x{2014}/-/g; s/\x{2013}/-/g; s/\x{2212}/-/g;
		s/\x{2192}/->/g; s/\x{2190}/<-/g; s/\x{2194}/<->/g; s/\x{27F6}/-->/g;
		s/\x{21D2}/=>/g; s/\x{27FA}/<=>/g;
		s/\x{2265}/>=/g; s/\x{2264}/<=/g; s/\x{2260}/!=/g; s/\x{2248}/~=/g;
		s/\x{00D7}/x/g; s/\x{00B1}/+\/-/g; s/\x{2026}/.../g;
		s/\x{2019}/\x27/g; s/[\x{201C}\x{201D}]/"/g;
		s/ \x{00B7} / - /g; s/\x{00B7}/-/g;
		s/\x{00A7}\s*/section /g; s/\x{00A9}/(c)/g;
		s/\x{25B6}\s*/> /g; s/\x{25C9}\s*/* /g;
		s/\x{26A0}\s*/WARNING /g; s/\x{2705}\s*/[x] /g;
		s/\x{2713}\s*/[x] /g; s/\x{2717}\s*/[ ] /g;
		s/\x{1F534}\s*//g; s/\x{1F916}\s*//g; s/\x{27F3}\s*/retry /g;
	' "$tmp"

	# S6 - one sentence per line. The tool masks inline code and skips fences.
	node "$root/tools/reflow-sentences.mjs" "$tmp" >/dev/null 2>&1

	# S12 - the introducer touches its block.
	perl -0777 -i -pe 's/(\n[^\n]*:)\n\n(`{3,})/$1\n$2/g' "$tmp"

	# S10 - one rule before each top-level section, and only where none is already there.
	perl -0777 -i -pe '
		my @out; my $fence = 0; my $seen = 0;
		for my $line (split /^/, $_) {
			$fence = !$fence if $line =~ /^`{3,}/;
			if (!$fence && $line =~ /^## /) {
				if ($seen++) {
					my $i = $#out;
					$i-- while $i >= 0 && $out[$i] =~ /^\s*$/;
					# Idempotent: only add a rule when the preceding content is not already one.
					unless ($i >= 0 && $out[$i] =~ /^---\s*$/) {
						pop @out while (@out && $out[-1] =~ /^\s*$/);
						push @out, "\n", "---\n", "\n";
					}
				}
			}
			push @out, $line;
		}
		$_ = join "", @out;
	' "$tmp"

	if [ "$before" != "$(cat "$tmp")" ]; then
		changed=$((changed + 1))
		if [ "$check" -eq 1 ]; then echo "would change  $f"; else cp "$tmp" "$f"; echo "formatted  $f"; fi
	fi
	rm -f "$tmp"
done

echo
if [ "$check" -eq 1 ]; then
	[ "$changed" -gt 0 ] && { echo "$changed file(s) would change."; exit 1; }
	echo "all ${#files[@]} file(s) already formatted."
else
	echo "formatted $changed of ${#files[@]} file(s)."
fi
