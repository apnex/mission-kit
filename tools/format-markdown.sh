#!/usr/bin/env bash
# format-markdown - apply every style rule that can be fixed without judgement.
#
# An alias, not an implementation. It discovers the sovereign per-rule tools and runs each in
# --fix mode, so a rule's fix has exactly one definition and it lives with that rule. The
# previous version restated four rules inline, and one of them was not idempotent.
#
# Rules with no --fix are skipped: S8 and S14 need a decision, not a substitution.
#
# Usage:  tools/format-markdown.sh FILE...

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
[ $# -eq 0 ] && { echo "usage: format-markdown.sh FILE..." >&2; exit 2; }

for tool in "$root"/tools/s13-*.sh "$root"/tools/s6-*.mjs "$root"/tools/s12-*.sh "$root"/tools/s10-*.sh; do
	[ -e "$tool" ] || continue
	case "$tool" in
		*.mjs) node "$tool" --fix "$@" >/dev/null ;;
		*)     "$tool" --fix "$@" >/dev/null ;;
	esac
done
echo "formatted ${#@} file(s) through the sovereign rule tools."
