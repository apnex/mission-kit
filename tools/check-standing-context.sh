#!/usr/bin/env bash
# check-standing-context - validate a standing-context document against its declared contract.
#
# Sovereign duty: the mechanical checks of SC2 (standing-context) and corpus https address
# resolution, and no other. A standing-context document is the single always-on file an agent loads
# at session start for a workspace. This checks the properties of such a file that can be decided
# mechanically:
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
#         tools/check-standing-context.sh --addresses-only [--no-network] FILE [...]
#                                                             (check external https addresses only)

set -uo pipefail

DEFAULT_SECTIONS="Contract|External references|Enforcement"

network=1
addresses_only=0
files=()
while [ $# -gt 0 ]; do
	case "$1" in
		--no-network) network=0; shift ;;
		--addresses-only) addresses_only=1; shift ;;
		-h|--help) sed -n '2,22p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
		*) files+=("$1"); shift ;;
	esac
done
[ ${#files[@]} -eq 0 ] && { echo "usage: check-standing-context.sh PATH_TO_AGENTS.md [...]" >&2; exit 2; }

fail_count=0
report() { printf 'FAIL  %-10s %s  %s\n' "$1" "$2" "$3"; fail_count=$((fail_count + 1)); }

# Fetch one address with retry and backoff on HTTP 5xx or transient failure (000), so throttling
# is told apart from a broken address (B27, M4.4).
fetch_code() {
	local url=$1 code="000" delay=1 attempt
	for attempt in 1 2 3; do
		code=$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "$url" 2>/dev/null || echo 000)
		case "$code" in
			5*|000)
				[ "$attempt" -lt 3 ] && sleep "$delay"
				delay=$((delay * 2))
				;;
			*) break ;;
		esac
	done
	printf '%s' "$code"
}

if [ "$addresses_only" -eq 1 ]; then
	node -e '
const crypto = require("node:crypto");
const fs = require("node:fs");
const banned = new Set([
	"d979885447a413abb6d606a5d0f45c3b7809e6fde2c83f0df3426f1fc9bfed97",
	"780ab09e0c077f85b1cb1970f490a88a7e434dd4e38b769f4c008592bb646a2b",
	"eda594c7094ca8e7b3949e4eb4ecc2388c155ca536263998c7e863d1cbdcfa43",
	"d4c67f5e78e9ba45ad6293d6cd593e793b880c57fce0de4c3963f94ef82f3ae4",
]);
const sha = (s) => crypto.createHash("sha256").update(s).digest("hex");
let fails = 0;
for (const f of process.argv.slice(1)) {
	if (!fs.existsSync(f)) continue;
	const lines = fs.readFileSync(f, "utf8").split("\n");
	for (let i = 0; i < lines.length; i++) {
		const lower = lines[i].toLowerCase();
		const tokens = new Set([...(lower.match(/[a-z0-9]+/g) || []), ...(lower.match(/[a-z0-9]+(?:\.[a-z0-9]+)+/g) || [])]);
		for (const t of tokens) {
			if (banned.has(sha(t))) {
				console.log(`FAIL  banned     ${f}:${i + 1}  banned personal name, handle, or email domain`);
				fails++;
			}
		}
	}
}
if (fails > 0) process.exit(1);
' "${files[@]}" || fail_count=$((fail_count + 1))
	if [ "$network" -eq 1 ]; then
		while IFS= read -r url; do
			[ -z "$url" ] && continue
			code=$(fetch_code "$url")
			[ "$code" = "200" ] || report address "corpus" "$url returned HTTP $code"
		done < <(grep -hoP 'https://[^\s`)>,]+' "${files[@]}" 2>/dev/null | sed 's/[.]$//' | grep -v '[<>{}]' | sort -u)
	fi
	echo
	if [ "$fail_count" -gt 0 ]; then
		echo "$fail_count failure(s) across ${#files[@]} document(s)."
		exit 1
	fi
	echo "clean: ${#files[@]} document(s)."
	exit 0
fi

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
			code=$(fetch_code "$url")
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
