#!/usr/bin/env bash
# check-standing-context - validate a standing-context document against its declared contract.
#
# A standing-context document is the single always-on file an agent loads at session start for a
# workspace. This checks the properties of such a file that can be decided mechanically:
#
#   frontmatter   present, and kind/schema/knowledge-base declared
#   sections      every required level-two heading is present
#   ascii         printable ASCII only, per S13
#   coupling      no term listed in the document's own "forbids" appears in the body
#   addresses     every https address resolves
#   size          the document is within its declared max-bytes
#
# The document declares its own instance rules in frontmatter, so this tool holds no knowledge of
# any particular workspace, path or host. Point it at a file anywhere.
#
# Exit non-zero if any check fails.
#
# Usage:  tools/check-standing-context.sh PATH_TO_AGENTS.md [...]
#         tools/check-standing-context.sh --no-network PATH   (skip address resolution)

set -uo pipefail

DEFAULT_SECTIONS="Contract|External references|Enforcement"

network=1
files=()
while [ $# -gt 0 ]; do
	case "$1" in
		--no-network) network=0; shift ;;
		-h|--help) sed -n '2,20p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
		*) files+=("$1"); shift ;;
	esac
done
[ ${#files[@]} -eq 0 ] && { echo "usage: check-standing-context.sh PATH_TO_AGENTS.md [...]" >&2; exit 2; }

fail_count=0
report() { printf 'FAIL  %-10s %s  %s\n' "$1" "$2" "$3"; fail_count=$((fail_count + 1)); }

# Read one scalar key out of the frontmatter block.
fm_scalar() {
	awk -v K="$2" 'FNR==1 && !/^---$/{exit} FNR==1{next} /^---$/{exit}
	     $0 ~ "^"K":" { sub("^"K":[[:space:]]*", ""); gsub(/^["\047]|["\047]$/, ""); print; exit }' "$1"
}

# Read one list key, whether inline [a, b] or a block of "- item" lines.
fm_list() {
	awk -v K="$2" '
		FNR==1 && !/^---$/{exit} FNR==1{next} /^---$/{exit}
		$0 ~ "^"K":" {
			sub("^"K":[[:space:]]*", "")
			if ($0 ~ /^\[/) { gsub(/^\[|\]$/, ""); n=split($0, a, ","); for(i=1;i<=n;i++){gsub(/^[[:space:]"\047]+|[[:space:]"\047]+$/,"",a[i]); if(a[i]!="") print a[i]} ; exit }
			inblock=1; next
		}
		inblock && /^[[:space:]]*-[[:space:]]+/ { sub(/^[[:space:]]*-[[:space:]]+/, ""); gsub(/^["\047]|["\047]$/, ""); print; next }
		inblock && /^[A-Za-z]/ { exit }
	' "$1"
}

for f in "${files[@]}"; do
	if [ ! -f "$f" ]; then report missing "$f" "no such file"; continue; fi

	# --- frontmatter ---
	if [ "$(head -1 "$f")" != "---" ]; then
		report frontmatter "$f" "no frontmatter block; cannot determine the contract this document claims"
		continue
	fi
	kind=$(fm_scalar "$f" kind)
	schema=$(fm_scalar "$f" schema)
	kb=$(fm_scalar "$f" knowledge-base)
	[ "$kind" = "standing-context" ] || report frontmatter "$f" "kind must be standing-context, found '${kind:-<absent>}'"
	case "$schema" in urn:mission-kit:schemas:standing-context:*) ;; *) report frontmatter "$f" "schema must name the standing-context contract, found '${schema:-<absent>}'" ;; esac
	case "$kb" in https://*) ;; *) report frontmatter "$f" "knowledge-base must be an https address, found '${kb:-<absent>}'" ;; esac

	body_start=$(awk 'FNR>1 && /^---$/{print FNR; exit}' "$f")
	body=$(tail -n +$((body_start + 1)) "$f")

	# --- required sections ---
	sections=$(fm_list "$f" required-sections)
	[ -z "$sections" ] && sections=$(echo "$DEFAULT_SECTIONS" | tr '|' '\n')
	while IFS= read -r want; do
		[ -z "$want" ] && continue
		grep -qiE "^## +([0-9]+\. *)?${want}" <<< "$body" || report section "$f" "required section not found: $want"
	done <<< "$sections"

	# --- plain ASCII (S13) ---
	n=$(printf '%s' "$body" | grep -cP '[^\x00-\x7F]' || true)
	[ "${n:-0}" -eq 0 ] || report ascii "$f" "$n line(s) contain non-ASCII characters"

	# --- forbidden coupling, declared by the document itself ---
	while IFS= read -r term; do
		[ -z "$term" ] && continue
		hits=$(echo "$body" | grep -icw -- "$term" || true)
		[ "${hits:-0}" -eq 0 ] || report coupling "$f" "forbidden term '$term' appears $hits time(s)"
	done < <(fm_list "$f" forbids)

	# --- addresses resolve ---
	if [ "$network" -eq 1 ]; then
		while IFS= read -r url; do
			[ -z "$url" ] && continue
			code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$url" 2>/dev/null || echo 000)
			[ "$code" = "200" ] || report address "$f" "$url returned HTTP $code"
		# A URL carrying a placeholder is a template, not an address; do not resolve it.
		done < <(echo "$body" | grep -oP 'https://[^\s`)>,]+' | sed 's/[.]$//' | grep -v '[<>{}]' | sort -u)
	fi

	# --- size bound ---
	maxb=$(fm_scalar "$f" max-bytes)
	if [ -n "$maxb" ]; then
		actual=$(wc -c < "$f")
		[ "$actual" -le "$maxb" ] || report size "$f" "$actual bytes exceeds declared max-bytes $maxb"
	fi
done

echo
if [ "$fail_count" -gt 0 ]; then
	echo "$fail_count failure(s) across ${#files[@]} document(s)."
	exit 1
fi
echo "clean: ${#files[@]} document(s)."
