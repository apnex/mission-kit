#!/usr/bin/env bash
# check-all - run every gate this repository holds itself to.
#
# One entry point, so the gate a contributor runs locally and the gate CI runs are the same
# script. A workflow that restates the checks is a second copy of the rule, and the two drift.
#
#   check-structure            every top-level directory is documented and self-describing
#   generate-index --check     the ledger and category tables match the entries
#   skill-graph                every catalogue edge resolves and the graph is acyclic
#   schema tests               every entry conforms to its contract
#   check-standing-context     the standing-context template satisfies its own contract
#   s6 s8 s10 s12 s13 s14      one sovereign checker per style rule, on changed files only
#
# Style runs against changed files rather than the whole corpus. The corpus carries legacy debt
# that predates the checker, and blocking on it would either stall every change or force one
# unreviewable sweep. Gating the diff blocks new debt and implements S6's own instruction to
# convert opportunistically as sections are edited.
#
# Exit non-zero if any gate fails; each gate runs even when an earlier one failed, so one run
# reports everything rather than the first thing.
#
# Usage:  tools/check-all.sh                      style over files changed against origin/main
#         tools/check-all.sh --since REF          style over files changed against REF
#         tools/check-all.sh --all                style over the whole corpus
#         tools/check-all.sh --no-network         skip checks that resolve addresses

set -uo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

since="origin/main"
scope="changed"
network_flag=""

while [ $# -gt 0 ]; do
	case "$1" in
		--since) since="$2"; shift 2 ;;
		--all) scope="all"; shift ;;
		--no-network) network_flag="--no-network"; shift ;;
		-h|--help) sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
		*) echo "unknown argument: $1" >&2; exit 2 ;;
	esac
done

failed=()
run() { # name, command...
	local name=$1; shift
	printf '\n=== %s ===\n' "$name"
	if "$@"; then printf 'PASS  %s\n' "$name"
	else failed+=("$name"); printf 'FAIL  %s\n' "$name"; fi
}

run "repository structure is documented" ./tools/check-structure.sh
run "index is derived, not typed" node tools/generate-index.mjs --check
run "catalogue graph resolves" node tools/skill-graph.mjs
run "entries conform to their contract" bash -c 'cd schemas && npm ci --silent >/dev/null 2>&1 || npm install --silent >/dev/null 2>&1; npm test --silent'
run "standing-context template holds" ./tools/check-standing-context.sh $network_flag _template-standing-context.md

# Every per-rule checker, discovered rather than listed, so adding a rule adds its gate.
run_style() { # files...
	local rule tool
	for tool in "$root"/tools/s[0-9]*-*.sh "$root"/tools/s[0-9]*-*.mjs; do
		[ -e "$tool" ] || continue
		rule=$(basename "$tool" | grep -oE '^s[0-9]+' | tr 'a-z' 'A-Z')
		case "$tool" in
			*.mjs) run "$rule" node "$tool" --check "$@" ;;
			*)     run "$rule" "$tool" "$@" ;;
		esac
	done
}

if [ "$scope" = "all" ]; then
	mapfile -t allmd < <(find "$root" -name '*.md' -not -path '*/.git/*' -not -path '*/node_modules/*' | sort)
	run_style "${allmd[@]}"
else
	# Only markdown that still exists and actually changed. No changes means nothing to gate.
	# Committed against the base, plus staged, plus unstaged. Comparing commits alone makes the
	# gate vacuous locally, where the work is not committed yet and the check matters most.
	# Committed against the base, plus staged, plus unstaged, plus untracked. git diff lists
	# only tracked paths, so without the last of these a brand-new file escapes the gate
	# locally and is caught only once CI sees it committed.
	mapfile -t changed < <( { git diff --name-only --diff-filter=d "$since"...HEAD 2>/dev/null
	                          git diff --name-only --diff-filter=d HEAD 2>/dev/null
	                          git diff --name-only --diff-filter=d --cached 2>/dev/null
	                          git ls-files --others --exclude-standard 2>/dev/null
	                        } | grep '\.md$' | sort -u || true)
	if [ ${#changed[@]} -eq 0 ]; then
		printf '\n=== style rules (changed files) ===\nno markdown changed against %s\nPASS  style rules\n' "$since"
	else
		printf '\n%d changed markdown file(s) against %s\n' "${#changed[@]}" "$since"
		run_style "${changed[@]}"
	fi
fi

printf '\n'
if [ ${#failed[@]} -gt 0 ]; then
	printf 'FAILED: %s\n' "${failed[*]}"
	exit 1
fi
printf 'all gates pass.\n'
