#!/usr/bin/env bash
# s10-section-rules - enforce S10: a horizontal rule between top-level sections.
#
# Sovereign duty: this rule and no other. Two responsibilities that read as one: a document past
# the size threshold needs a rule between each pair of sections, and no document may carry two
# rules in a row, because a count-based check passes a duplicate and one did.
#
# Usage:  tools/s10-section-rules.sh [--fix] [FILE ...]

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
. "$root/tools/lib/style-common.sh"

fix=0; args=()
while [ $# -gt 0 ]; do case "$1" in --fix) fix=1; shift ;; *) args+=("$1"); shift ;; esac; done
mapfile -t files < <(style_files "$root" "${args[@]+"${args[@]}"}")

for f in "${files[@]}"; do
	[ -f "$f" ] || continue
	style_exempt "$f" S10 && continue

	if [ "$fix" -eq 1 ]; then
		# Insert only where none exists, so a second pass adds nothing.
		perl -0777 -i -pe '
			my @out; my $fence = 0; my $seen = 0;
			for my $line (split /^/, $_) {
				$fence = !$fence if $line =~ /^`{3,}/;
				if (!$fence && $line =~ /^## / && $seen++) {
					my $i = $#out; $i-- while $i >= 0 && $out[$i] =~ /^\s*$/;
					unless ($i >= 0 && $out[$i] =~ /^---\s*$/) {
						pop @out while (@out && $out[-1] =~ /^\s*$/);
						push @out, "\n", "---\n", "\n";
					}
				}
				push @out, $line;
			}
			$_ = join "", @out;
		' "$f"
		continue
	fi

	# A rule separates two sections; two in a row separates nothing.
	while IFS= read -r dup; do
		[ -n "$dup" ] && style_report S10 "$f" "$dup" "two horizontal rules in a row"
	done < <(awk '/^`{3,}/{c=!c} c{next}
	              /^---[[:space:]]*$/{ if (seen && blanks) print FNR; seen=1; blanks=1; next }
	              /^[[:space:]]*$/{next} {blanks=0}' "$f")

	h2=$(awk '/^`{3,}/{c=!c; next} !c && /^## /{n++} END{print n+0}' "$f")
	[ "$h2" -lt 5 ] && continue
	hr=$(awk 'FNR==1 && /^---$/ {fm=1; next} fm && /^---$/ {fm=0; next} /^`{3,}/{c=!c} !c && /^---$/{n++} END{print n+0}' "$f")
	need=$((h2 - 1))
	[ "$hr" -ge "$need" ] || style_report S10 "$f" 1 "$h2 H2 sections but $hr horizontal rules; need $need"
done

[ "$fix" -eq 1 ] && { echo; echo "s10: applied to ${#files[@]} file(s)."; exit 0; }
style_summary S10 "${#files[@]}"
