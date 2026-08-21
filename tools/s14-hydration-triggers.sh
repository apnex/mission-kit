#!/usr/bin/env bash
# s14-hydration-triggers - enforce S14: a trigger states a condition, not a topic.
#
# Sovereign duty: this rule and no other. The marker list is a proxy for the discriminator the
# entry states, not a substitute: a sentence can carry a marker and still name a topic, so this
# catches the obvious failures and the rule states the test. There is no --fix, because writing
# a condition is judgement.
#
# Usage:  tools/s14-hydration-triggers.sh [FILE ...]

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
. "$root/tools/lib/style-common.sh"

mapfile -t files < <(style_files "$root" "$@")
for f in "${files[@]}"; do
	[ -f "$f" ] || continue
	style_exempt "$f" S14 && continue

	# A trailing YAML comment is not part of the value.
	trig=$(awk 'FNR==1 && !/^---$/{exit} FNR==1{next} /^---$/{exit}
	            /^hydrate-when:/{sub(/^hydrate-when:[[:space:]]*/, ""); sub(/[[:space:]]+#.*$/, "");
	                             gsub(/^["\047]|["\047]$/, ""); print; exit}' "$f")
	title=$(awk 'FNR==1 && !/^---$/{exit} FNR==1{next} /^---$/{exit}
	             /^title:/{sub(/^title:[[:space:]]*/, ""); print; exit}' "$f")

	if [ -z "$trig" ]; then
		# A portable SKILL.md carries no catalogue placement; its harness trigger is the
		# description field the skill standard already defines.
		case "$f" in */SKILL.md) continue ;; esac
		# Only frontmatter makes a file an entry. A template inside a fence is illustration.
		awk 'FNR==1 && !/^---$/{exit} FNR==1{next} /^---$/{exit} /^id:/{found=1} END{exit !found}' "$f" \
			&& style_report S14 "$f" 1 "catalogue entry declares no hydrate-when"
		continue
	fi

	[ "${#trig}" -ge 30 ] || style_report S14 "$f" 1 "trigger is ${#trig} characters; too short to state a condition"
	[ "$trig" != "$title" ] || style_report S14 "$f" 1 "trigger restates the title rather than naming a moment"
	grep -qE '[.!?].+[.!?]' <<< "$trig" && style_report S14 "$f" 1 "trigger is more than one sentence; it is describing the entry, not the moment"
	grep -qiE 'you are|you have|you need|you must|before you|after you|about to|is still|has been|when the|if the|while the' <<< "$trig" \
		|| style_report S14 "$f" 1 "trigger carries no condition marker; it reads as a topic"
done
style_summary S14 "${#files[@]}"
