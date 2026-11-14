#!/usr/bin/env bash
# s17-source-comments - enforce S17: source comments state duty, usage, and why in plain ASCII.
#
# Sovereign duty: this rule and no other. Holds executable scripts in tools/*.sh and tools/*.mjs
# (or any .sh / .mjs files passed on the command line) to opening with a line-2 '<name> - <summary>'
# header, declaring non-empty 'Sovereign duty:' (for non-test tools) and 'Usage:' in the opening
# comment block, using only printable ASCII in full-line comments, and keeping commented-out code
# statements out of full-line comments. Judging whether an inline comment explains why rather than
# restating the code remains a review check.
#
# Usage:  tools/s17-source-comments.sh [--root DIR] [FILE ...]

set -uo pipefail
script_root=$(cd "$(dirname "$0")/.." && pwd)
. "$script_root/tools/lib/style-common.sh"

root="$script_root"
args=()
while [ $# -gt 0 ]; do
	case "$1" in
		--root)
			if [ -z "${2:-}" ] || [[ "${2:-}" == --* ]] || [ ! -d "${2:-}" ]; then
				echo "FAIL  usage        --root requires an existing directory path" >&2
				exit 2
			fi
			root=$(cd "$2" && pwd)
			shift 2
			;;
		--check)
			shift
			;;
		--*)
			echo "FAIL  usage        unknown flag: $1" >&2
			exit 2
			;;
		*)
			args+=("$1")
			shift
			;;
	esac
done

files=()
for a in "${args[@]}"; do
	case "$a" in
		*.sh|*.mjs) files+=("$a") ;;
	esac
done

if [ ${#files[@]} -eq 0 ]; then
	if [ ! -d "$root/tools" ]; then
		echo "FAIL  missing      $root/tools does not exist" >&2
		exit 1
	fi
	mapfile -t files < <(find "$root/tools" -maxdepth 1 -type f \( -name '*.sh' -o -name '*.mjs' \) | sort)
fi

# Match style-check: allow S17 or GENERATED FILE only when it stands at the start of a comment
# line, so test scripts that mention the marker in prose or inside quotes do not exempt themselves.
s17_exempt() {
	local file=$1
	head -n 12 "$file" | grep -qE '^[[:space:]]*(#|//|<!--)[[:space:]]*GENERATED FILE([[:space:]:-]|$)' && return 0
	grep -qE '^[[:space:]]*(#|//|<!--)[[:space:]]*style-check:[[:space:]]*allow[[:space:]]+S17([[:space:]\)]|$)' "$file"
}

inspected=0
for f in "${files[@]}"; do
	if [ ! -f "$f" ]; then
		style_report S17 "$f" 1 "file does not exist"
		continue
	fi
	s17_exempt "$f" && continue
	inspected=$((inspected + 1))

	name=$(basename "$f")
	stem=${name%.*}
	case "$name" in
		*.sh)  prefix="#" ;;
		*.mjs) prefix="//" ;;
		*)     continue ;;
	esac
	is_test=0
	case "$name" in
		*.test.sh|*.test.mjs) is_test=1 ;;
	esac

	line2=$(sed -n '2p' "$f")
	if ! awk -v p="$prefix" -v s="$stem" -v n="$name" '
		BEGIN { ok = 0 }
		{
			p1 = p " " s " - "
			p2 = p " " n " - "
			if (index($0, p1) == 1) {
				rest = substr($0, length(p1) + 1)
				if (rest ~ /[^[:space:]]/) ok = 1
			} else if (index($0, p2) == 1) {
				rest = substr($0, length(p2) + 1)
				if (rest ~ /[^[:space:]]/) ok = 1
			}
		}
		END { exit(ok ? 0 : 1) }
	' <<< "$line2"; then
		style_report S17 "$f" 2 "line 2 must open with '${prefix} ${stem} - <one-line summary>'"
	fi

	header=$(awk -v p="$prefix" '
		FNR == 1 { next }
		index($0, p) == 1 && (length($0) == length(p) || substr($0, length(p) + 1, 1) == " ") { print; next }
		{ exit }
	' "$f")

	if [ "$is_test" -eq 0 ] && ! grep -qE "Sovereign duty:[[:space:]]*[^[:space:]]" <<< "$header"; then
		style_report S17 "$f" 2 "opening comment block declares no 'Sovereign duty:'"
	fi
	if ! grep -qE "Usage:[[:space:]]*[^[:space:]]" <<< "$header"; then
		style_report S17 "$f" 2 "opening comment block declares no 'Usage:'"
	fi

	while IFS=$'\t' read -r lineno kind detail; do
		[ -z "$lineno" ] && continue
		style_report S17 "$f" "$lineno" "$detail"
	done < <(LC_ALL=C awk -v p="$prefix" '
		FNR == 1 && /^#!/ { next }
		in_heredoc {
			line = $0
			if (heredoc_strip_tabs) sub(/^\t+/, "", line)
			if (line == heredoc_delim) { in_heredoc = 0; heredoc_delim = ""; heredoc_strip_tabs = 0 }
			next
		}
		{
			trimmed = $0
			sub(/^[[:space:]]+/, "", trimmed)
			if (index(trimmed, p) == 1) {
				if (p == "#" && index(trimmed, "#!") == 1) next
				if ($0 ~ /[^\t\x20-\x7E]/) {
					printf "%d\tnon-ascii\tnon-ASCII character in source comment\n", FNR
				}
				body = substr(trimmed, length(p) + 1)
				sub(/^[[:space:]]+/, "", body)
				if (p == "//") {
					if (body ~ /^(const|let|var)[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*[[:space:]]*=/ ||
					    body ~ /^function[[:space:]]+[A-Za-z_$][A-Za-z0-9_$]*[[:space:]]*\([^)]*\)[[:space:]]*\{/ ||
					    body ~ /^import[[:space:]]+.*from[[:space:]]+[\047"].*[\047"][[:space:]]*;?$/ ||
					    body ~ /^export[[:space:]]+(const|let|var|function|default|class|\{)[[:space:]]/ ||
					    body ~ /^return([[:space:]]+[^;]+)?;[[:space:]]*$/ ||
					    body ~ /^(if|for|while)[[:space:]]*\(.*\)[[:space:]]*\{[[:space:]]*$/) {
						printf "%d\tdead-code\tcommented-out code in source comment; delete it and rely on git history\n", FNR
					}
				} else {
					if (body ~ /^(if[[:space:]]+\[.*\][[:space:]]*;[[:space:]]*then|for[[:space:]]+[A-Za-z_][A-Za-z0-9_]*[[:space:]]+in[[:space:]]+.*;[[:space:]]*do|while[[:space:]]+.*;[[:space:]]*do|local[[:space:]]+[A-Za-z_][A-Za-z0-9_]*=|export[[:space:]]+[A-Za-z_][A-Za-z0-9_]*=)/) {
						printf "%d\tdead-code\tcommented-out code in source comment; delete it and rely on git history\n", FNR
					}
				}
				next
			}
		}
		p == "#" && $0 !~ /<<</ && match($0, /<<-?[[:space:]]*[\047"]?[A-Za-z_][A-Za-z0-9_]*[\047"]?/) {
			tag = substr($0, RSTART, RLENGTH)
			heredoc_strip_tabs = (index(tag, "<<-") == 1 ? 1 : 0)
			sub(/^<<-?[[:space:]]*[\047"]?/, "", tag)
			sub(/[\047"]$/, "", tag)
			in_heredoc = 1
			heredoc_delim = tag
		}
	' "$f")
done

style_summary S17 "$inspected"
