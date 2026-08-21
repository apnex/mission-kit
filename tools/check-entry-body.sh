#!/usr/bin/env bash
# check-entry-body - hold catalogue entries to the body shape their category declares.
#
# Sovereign duty: this invariant and no other. The catalogue entry contract governs frontmatter
# and stops at the closing marker; nothing governed anything below it.
#
#   every entry of a governed category carries every section its category declares
#   the sections appear in the declared order, where the declaration says order matters
#
# The gap this closes was not hypothetical. axioms/README.md has always specified a five-section
# body shape, all fifteen axioms have always conformed, and nothing would have noticed the
# sixteenth that did not. A shape held only by the care of whoever wrote last is a convention.
#
# The declaration is data, not code: schemas/entry-body/v1alpha1/entry-body.json, validated by the
# schema beside it. A category absent from that file is ungoverned by design, which is a stated
# gap rather than a silent one.
#
# Exit non-zero if any entry departs from its declared shape.
#
# Usage:  tools/check-entry-body.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
cd "$root"

decl=schemas/entry-body/v1alpha1/entry-body.json
[ -f "$decl" ] || { echo "FAIL  missing        $decl does not exist"; exit 1; }

fail=0
checked=0
governed=""
report() { printf 'FAIL  %-14s %s\n' "$1" "$2"; fail=$((fail + 1)); }

# Every markdown file that declares a category, paired with it. Reading the declaration rather
# than the directory means an entry filed in the wrong place is still held to its own category.
while IFS='	' read -r file category; do
	[ -z "$category" ] && continue

	# The entry's own id, so a declared exemption can be honoured. A layer's composition entry
	# defines its category rather than instantiating it, so the instance shape does not apply.
	entry_id=$(awk 'FNR==1{next} /^---$/{exit} /^id:/{sub(/^id:[[:space:]]*/, ""); gsub(/"/, ""); print; exit}' "$file")

	spec=$(node -e '
		const fs = require("fs");
		const d = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
		const c = d.spec.categories.find((x) => x.category === process.argv[2]);
		if (!c) process.exit(0);
		if ((c.exemptIds || []).includes(process.argv[3])) process.exit(0);
		process.stdout.write((c.ordered === false ? "unordered" : "ordered") + "\n" + c.sections.join("\n"));
	' "$decl" "$category" "$entry_id")
	[ -z "$spec" ] && continue

	checked=$((checked + 1))
	case " $governed " in *" $category "*) ;; *) governed="$governed $category" ;; esac
	mode=$(printf '%s' "$spec" | head -1)
	wanted=$(printf '%s' "$spec" | tail -n +2)

	# The headings actually present, in file order, so presence and sequence are one read.
	present=$(grep -E '^## ' "$file" | sed 's/^## //')

	missing=0
	while IFS= read -r want; do
		# Herestring rather than a pipe: grep -q exits on the first match, and under pipefail a
		# writer killed by the resulting SIGPIPE makes the pipeline 141, which reads as "absent".
		grep -qxF "$want" <<< "$present" \
			|| { report "missing section" "$file ($category) has no '## $want'"; missing=1; }
	done <<< "$wanted"

	# Order is only meaningful once every section is present; reporting both for one absence
	# would be two findings for one defect.
	[ "$missing" -eq 1 ] && continue
	[ "$mode" = "ordered" ] || continue

	actual=$(printf '%s\n' "$present" | grep -xF -f <(printf '%s\n' "$wanted"))
	[ "$actual" = "$wanted" ] \
		|| report "section order" "$file ($category) declares ordered sections but they appear as: $(printf '%s' "$actual" | tr '\n' ' ')"
done < <(
	# Tracked plus untracked-not-ignored. Listing only tracked files made the check blind to a
	# brand new entry, which is exactly when its shape has never been reviewed by anyone.
	for f in $( { git ls-files '*.md'; git ls-files --others --exclude-standard '*.md'; } | sort -u ); do
		cat=$(awk 'FNR==1 && !/^---$/{exit} FNR==1{next} /^---$/{exit}
		           /^category:[[:space:]]*/{sub(/^category:[[:space:]]*/, ""); print; exit}' "$f")
		[ -n "$cat" ] && printf '%s\t%s\n' "$f" "$cat"
	done
)

echo
if [ "$fail" -gt 0 ]; then
	echo "$fail body-shape failure(s)."
	exit 1
fi
echo "entry bodies: $checked entr(ies) across$governed carry their declared sections, in order."
