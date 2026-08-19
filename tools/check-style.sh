#!/usr/bin/env bash
# check-style - verify markdown against the mechanically-decidable style rules.
#
# Only rules that can be decided by reading the text are implemented here. Each check runs the
# checker its own S entry publishes, so the entry and this script cannot drift apart:
#
#   S6  one sentence per line       - both halves; the entry ships both awk programs
#   S8  code-block comments         - 2+ consecutive comment lines inside a fence
#   S10 horizontal rule between H2  - triggers at 5+ H2 sections
#   S12 code-block introducer       - a line ending ':' must touch the fence it introduces
#   S13 plain ASCII                 - the entry ships the grep; Box Drawing is exempt
#   S14 hydration triggers          - a trigger states a condition, not a topic
#
# NOT implemented, because they need judgement and a heuristic would emit false failures:
#   S1 S3 S4 S5 S7 S9 S11. Review those by reading.
#
# A file may opt out of one rule with a marker on its own line, which makes the exemption
# explicit and greppable rather than inferred:
#
#   <!-- style-check: allow S13 (character is the subject) -->
#
# Exit non-zero if any check fails.
#
# Usage:  tools/check-style.sh [--rule S6] [path ...]     (default: every *.md in the repo)

set -uo pipefail

RULES_DEFAULT="S6 S8 S10 S12 S13 S14"
rule_filter=""
paths=()

while [ $# -gt 0 ]; do
	case "$1" in
		--rule) rule_filter="$2"; shift 2 ;;
		-h|--help) sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
		*) paths+=("$1"); shift ;;
	esac
done

root=$(cd "$(dirname "$0")/.." && pwd)
if [ ${#paths[@]} -eq 0 ]; then paths=("$root"); fi

mapfile -t files < <(find "${paths[@]}" -name '*.md' -not -path '*/.git/*' -not -path '*/node_modules/*' | sort)

fail_count=0

# does $1 opt out of rule $2?
exempt() {
	grep -qF "style-check: allow $2" "$1" && return 0
	# A generated artifact is not hand-edited: the next compile discards any fix, and the
	# defect belongs to the source the compiler reads.
	head -12 "$1" | grep -qF "GENERATED FILE" && return 0
	return 1
}

report() { # rule, file, line, detail
	printf 'FAIL  %-4s %s:%s  %s\n' "$1" "${2#$root/}" "$3" "$4"
	fail_count=$((fail_count + 1))
}

# S6 half 1 - a line carrying more than one sentence. Checker as published by S6.
check_S6() {
	local f=$1
	exempt "$f" S6 && return
	while IFS=: read -r _ line; do
		[ -n "$line" ] && report S6 "$f" "$line" "more than one sentence on this line"
	# Structural lines are skipped for the same reason half 2 skips them, and for the same
	# reason both skip fences: a list item, a table cell or a quoted example is not the
	# document's own prose. S6 names "a list wearing prose - a real markdown list" as the
	# correct outcome, so a multi-sentence bullet is the endorsed form, not a violation.
	# YAML frontmatter is structured data, not prose, so neither half applies to it.
	done < <(awk 'FNR==1 && /^---$/{fm=1; next} fm && /^---$/{fm=0; next} fm{next}
	              /^```|^````/{c=!c; next} c{next}
	              /^<!--/{next}
	              /^(#|\||>|[[:space:]]*[-*+][[:space:]]|[[:space:]]*[0-9]+\.[[:space:]])/{next}
	              /^[[:space:]]{2,}[^[:space:]]/{next}
	              /[a-z)`][.!?] [A-Z`]/{printf "%s:%d\n", FILENAME, FNR}' "$f")

	# S6 half 2 - adjacent sentences that collapse for want of a trailing backslash.
	# List markers may be indented; a nested bullet is still a bullet.
	while IFS=: read -r _ line; do
		[ -n "$line" ] && report S6 "$f" "$line" "sentence collapses into the next; needs a trailing backslash or blank line"
	done < <(awk 'FNR==1 && /^---$/{fm=1; next} fm && /^---$/{fm=0; next} fm{next}
	              /^```|^````/{c=!c; p=""; next} c{next}
	              /^[[:space:]]*$/{p=""; next}
	              /^<!--/{p=""; next}
	              /^[[:space:]]*(#|\||>|[-*+][[:space:]]|[0-9]+\.[[:space:]])/{p=""; next}
	              # An indented continuation belongs to the list item above it, and S6 endorses a
	              # multi-sentence list item. Half 1 already skips these; half 2 must agree.
	              /^[[:space:]]{2,}[^[:space:]]/{p=""; next}
	              { if (p != "" && p !~ /\\$/ && p ~ /[.!?]$/) printf "%s:%d\n", FILENAME, FNR-1; p=$0 }' "$f")
}

# S8 - 2+ consecutive comment lines inside a fence are prose in the wrong place.
check_S8() {
	local f=$1
	exempt "$f" S8 && return
	while IFS=: read -r _ line; do
		[ -n "$line" ] && report S8 "$f" "$line" "2+ consecutive comment lines in a code block"
	done < <(awk '/^```/{c=!c; n=0; next} !c{next}
	              /^[[:space:]]*#/{n++; if (n==2) printf "%s:%d\n", FILENAME, FNR; next}
	              {n=0}' "$f")
}

# S10 - horizontal rule between top-level sections, once a doc has 5+ of them.
# YAML frontmatter delimiters are not horizontal rules.
check_S10() {
	local f=$1
	exempt "$f" S10 && return
	local h2 hr need
	# H2s inside a fenced block are illustrative markdown, not sections of this document.
	h2=$(awk '/^`{3,}/{c=!c; next} !c && /^## /{n++} END{print n+0}' "$f")
	[ "$h2" -lt 5 ] && return
	hr=$(awk 'FNR==1 && /^---$/ {fm=1; next} fm && /^---$/ {fm=0; next} /^`{3,}/{c=!c} !c && /^---$/{n++} END{print n+0}' "$f")
	need=$((h2 - 1))
	[ "$hr" -ge "$need" ] || report S10 "$f" 1 "$h2 H2 sections but $hr horizontal rules; need $need"
}

# S12 - an introducer ending in ':' must sit directly above its fence, no blank line between.
check_S12() {
	local f=$1
	exempt "$f" S12 && return
	while IFS=: read -r _ line; do
		[ -n "$line" ] && report S12 "$f" "$line" "blank line between introducer and the code block it introduces"
	done < <(awk '/^```/{c=!c} /:$/ && !c {i=FNR; next}
	              /^```/ && FNR==i+2 {printf "%s:%d\n", FILENAME, i}' "$f")
}

# S13 - printable ASCII only. Checker as published by S13; Box Drawing U+2500-257F exempt.
check_S13() {
	local f=$1
	exempt "$f" S13 && return
	while IFS=: read -r line _; do
		[ -n "$line" ] && report S13 "$f" "$line" "non-ASCII character"
	done < <(grep -nP '[\x{80}-\x{24FF}\x{2580}-\x{10FFFF}]' "$f" | cut -d: -f1 | uniq)
}

# S14 - a hydration trigger states a condition an agent can evaluate, not a topic.
# The marker list is a proxy for that test, not a substitute: it catches the obvious failures.
check_S14() {
	local f=$1
	exempt "$f" S14 && return
	local trig title
	trig=$(awk 'FNR==1 && !/^---$/{exit} FNR==1{next} /^---$/{exit}
	            /^hydrate-when:/{sub(/^hydrate-when:[[:space:]]*/, ""); gsub(/^["\047]|["\047]$/, ""); print; exit}' "$f")
	# Coverage is complete, so an absent trigger is a regression rather than a gap.
	# Only a portable SKILL.md is exempt: it carries no catalogue placement by design,
	# and its harness trigger is the description field the standard already defines.
	if [ -z "$trig" ]; then
		case "$f" in */SKILL.md) return ;; esac
		grep -q "^id:" "$f" 2>/dev/null && report S14 "$f" 1 "catalogue entry declares no hydrate-when"
		return
	fi
	title=$(awk 'FNR==1 && !/^---$/{exit} FNR==1{next} /^---$/{exit}
	             /^title:/{sub(/^title:[[:space:]]*/, ""); print; exit}' "$f")
	[ "${#trig}" -ge 30 ] || report S14 "$f" 1 "trigger is ${#trig} characters; too short to state a condition"
	[ "$trig" != "$title" ] || report S14 "$f" 1 "trigger restates the title rather than naming a moment"
	echo "$trig" | grep -qE '[.!?].+[.!?]' && report S14 "$f" 1 "trigger is more than one sentence; it is describing the entry, not the moment"
	echo "$trig" | grep -qiE 'you are|you have|you need|you must|before you|after you|about to|is still|has been|when the|if the|while the' \
		|| report S14 "$f" 1 "trigger carries no condition marker; it reads as a topic"
}

rules=${rule_filter:-$RULES_DEFAULT}
for f in "${files[@]}"; do
	for r in $rules; do
		"check_$r" "$f"
	done
done

echo
if [ "$fail_count" -gt 0 ]; then
	echo "$fail_count failure(s) across ${#files[@]} file(s)."
	exit 1
fi
echo "clean: ${#files[@]} file(s), rules $rules."
