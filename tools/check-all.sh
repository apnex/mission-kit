#!/usr/bin/env bash
# check-all - run every gate this repository holds itself to.
#
# Sovereign duty: orchestrate every repository gate through one entry point, so the gate a
# contributor runs locally and the gate CI runs are the same script. A workflow that restates the
# checks is a second copy of the rule, and the two drift.
#
#   check-structure            every top-level directory is documented and self-describing
#   check-enforcers            every rule names a real tool, and every tool a real rule
#   check-tool-docs            the tool index matches the tools beside it
#   check-entry-body           every entry carries the body sections its category declares
#   check-component-edges      every registered component's declared peer edges agree bidirectionally
#   generate-index --check     the ledger and category tables match the entries
#   generate-architecture      the architecture's structural sections match the corpus
#   check-decisions            the decision register's ids, kinds, lineage and affects paths hold
#   check-id-reuse             no current entry holds an id retired in history
#   skill-graph                every catalogue edge resolves and the graph is acyclic
#   schema tests               every entry conforms to its contract
#   check-standing-context     the template and this repo's own AGENTS.md satisfy their contract
#   check-links                every relative markdown link in a live file resolves inside the repo
#   s6 s8 s10 s12 s13 s14 s17  one sovereign checker per style rule, on changed files only
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
#         tools/check-all.sh --root DIR           run against repository root DIR
#         tools/check-all.sh --style-only         run only the style-rule dispatch stage

set -uo pipefail

root=$(cd "$(dirname "$0")/.." && pwd)
since="origin/main"
scope="changed"
network_flag=""
style_only=0

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
		--since)
			if [ -z "${2:-}" ] || [[ "${2:-}" == --* ]]; then
				echo "FAIL  usage        --since requires a git revision" >&2
				exit 2
			fi
			since="$2"
			shift 2
			;;
		--all) scope="all"; shift ;;
		--no-network) network_flag="--no-network"; shift ;;
		--style-only) style_only=1; shift ;;
		-h|--help) sed -n '2,36p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
		*) echo "unknown argument: $1" >&2; exit 2 ;;
	esac
done

cd "$root"

if [ "$scope" = "changed" ] && ! git rev-parse --verify "${since}^{commit}" >/dev/null 2>&1; then
	echo "FAIL  usage        unknown git revision for --since: $since" >&2
	exit 2
fi

failed=()
run() { # name, command...
	local name=$1; shift
	printf '\n=== %s ===\n' "$name"
	if "$@"; then printf 'PASS  %s\n' "$name"
	else failed+=("$name"); printf 'FAIL  %s\n' "$name"; fi
}

if [ "$style_only" -eq 0 ]; then
# Keep top-level gate calls at column 0: tools/generate-architecture.mjs reads ^run "([^"]+)" from this file.
run "repository structure is documented" ./tools/check-structure.sh
run "rules and enforcers are paired" ./tools/check-enforcers.sh
run "tool index matches the directory" ./tools/check-tool-docs.sh
run "entry bodies match their category" ./tools/check-entry-body.sh
run "component edges agree" node tools/check-component-edges.mjs
run "the board and the backlog agree" node tools/check-board.mjs
run "the decision register is well formed" node tools/check-decisions.mjs
run "applies-to names exactly the declared traits" node tools/check-traits.mjs
run "a retired id is never issued again" node tools/check-id-reuse.mjs
run "the tested communication guidance landed unreworded" ./tools/check-guidance-placement.sh
run "index is derived, not typed" node tools/generate-index.mjs --check
run "the current architecture's structure is derived" node tools/generate-architecture.mjs --check
run "catalogue graph resolves" node tools/skill-graph.mjs
run "entries conform to their contract" bash -c 'cd schemas && npm ci --silent >/dev/null 2>&1 || npm install --silent >/dev/null 2>&1; npm test --silent'
run "standing-context template holds" ./tools/check-standing-context.sh $network_flag _template-standing-context.md
run "this repo's own standing context holds" ./tools/check-standing-context.sh $network_flag AGENTS.md
mapfile -t tracked_md < <(git ls-files '*.md')
run "external addresses across the corpus resolve" ./tools/check-standing-context.sh --addresses-only $network_flag "${tracked_md[@]}"
run "relative links across live markdown files resolve" node tools/check-links.mjs

	# A tool's own behaviour tests, discovered rather than listed, so adding a test adds its gate.
	# These run over fixtures rather than the corpus, so they are unconditional: a checker can be
	# broken by a change that touches no markdown at all.
	for t in "$root"/tools/*.test.sh; do
		[ -e "$t" ] || continue
		run "$(basename "$t" .test.sh) behaves" "$t"
	done
fi

# Every per-rule checker, discovered rather than listed, so adding a rule adds its gate.
# Each style rule declares its medium (documents or code) in style/<rule>-*.md; the orchestrator
# hands each checker the changed files of its medium and fails closed on an unknown medium.
run_style() {
	local rule tool medium
	for tool in "$root"/tools/s[0-9]*-*.sh "$root"/tools/s[0-9]*-*.mjs; do
		[ -e "$tool" ] || continue
		# A test exercises a checker; it is not one. Left in this glob it is handed the changed
		# file list, ignores it, and reports PASS -- a gate that looks like it ran the corpus and
		# ran nothing. Tests are gated separately above, unconditionally.
		case "$tool" in *.test.sh) continue ;; esac
		rule=$(basename "$tool" | grep -oE '^s[0-9]+' | tr 'a-z' 'A-Z')
		medium=$(sed -n 's/^medium:[[:space:]]*["'\'']\{0,1\}\([A-Za-z0-9_-]*\)["'\'']\{0,1\}[[:space:]]*$/\1/p' "$root"/style/"$rule"-*.md 2>/dev/null | head -1)
		local -a targets=()
		case "$medium" in
			code)      targets=("${changed_src[@]+"${changed_src[@]}"}") ;;
			documents) targets=("${changed_md[@]+"${changed_md[@]}"}") ;;
			*)
				printf '\n=== %s ===\nFAIL  %s (unknown or missing medium: %s)\n' "$rule" "$rule" "${medium:-<empty>}"
				failed+=("$rule")
				continue
				;;
		esac
		[ ${#targets[@]} -eq 0 ] && continue
		case "$tool" in
			*.mjs) run "$rule" node "$tool" --check "${targets[@]}" ;;
			*)     run "$rule" "$tool" "${targets[@]}" ;;
		esac
	done
}

if [ "$scope" = "all" ]; then
	mapfile -t changed_md < <(find "$root" -name '*.md' -not -path '*/.git/*' -not -path '*/node_modules/*' | sort)
	mapfile -t changed_src < <(find "$root/tools" -maxdepth 1 -type f \( -name '*.sh' -o -name '*.mjs' \) | sort)
	run_style
else
	# Only markdown and tools/ scripts that still exist and actually changed. No changes means
	# nothing to gate. Committed against the base, plus staged, plus unstaged, plus untracked.
	# git diff lists only tracked paths, so without the last of these a brand-new file escapes
	# the gate locally and is caught only once CI sees it committed.
	mapfile -t all_changed < <( { git diff --name-only --diff-filter=d "$since"...HEAD 2>/dev/null
	                              git diff --name-only --diff-filter=d HEAD 2>/dev/null
	                              git diff --name-only --diff-filter=d --cached 2>/dev/null
	                              git ls-files --others --exclude-standard 2>/dev/null
	                            } | sort -u || true)
	mapfile -t changed_md < <(printf '%s\n' "${all_changed[@]+"${all_changed[@]}"}" | grep '\.md$' || true)
	mapfile -t changed_src < <(printf '%s\n' "${all_changed[@]+"${all_changed[@]}"}" | grep -E '^tools/[^/]+\.(sh|mjs)$' || true)
	if [ ${#changed_md[@]} -eq 0 ] && [ ${#changed_src[@]} -eq 0 ]; then
		printf '\n=== style rules (changed files) ===\nno markdown or tools/ script changed against %s\nPASS  style rules\n' "$since"
	else
		printf '\n%d changed markdown file(s) and %d changed tools/ script(s) against %s\n' "${#changed_md[@]}" "${#changed_src[@]}" "$since"
		run_style
	fi
fi

printf '\n'
if [ ${#failed[@]} -gt 0 ]; then
	printf 'FAILED: %s\n' "${failed[*]}"
	exit 1
fi
printf 'all gates pass.\n'
