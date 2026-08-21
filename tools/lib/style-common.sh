# style-common - the concerns every per-rule style checker shares.
#
# Sourced, never executed. Each checker owns exactly one rule; exemption handling and finding
# format are common to all of them, so they live here rather than being restated six times.
# Restating them was how the S6 boundary rule came to exist in four places that disagreed.

# A file opts out of one rule with a marker on its own line, so the exemption is explicit and
# greppable rather than inferred:
#
#   <!-- style-check: allow S13 (character is the subject) -->
#
# A generated artifact opts out of everything: the next compile discards any fix, and the defect
# belongs to the source its compiler reads. The marker may sit below the frontmatter.
style_exempt() { # file, rule
	grep -qF "style-check: allow $2" "$1" && return 0
	grep -qF "GENERATED FILE" <<< "$(head -12 "$1")" && return 0
	return 1
}

style_fail_count=0

# One finding, in the format every checker and the orchestrator agree on.
style_report() { # rule, file, line, detail
	printf 'FAIL  %-4s %s:%s  %s\n' "$1" "$2" "$3" "$4"
	style_fail_count=$((style_fail_count + 1))
}

# Every checker takes the same arguments and prints the same summary, so the orchestrator does
# not need to know which rule it just ran.
style_summary() { # rule, file-count
	echo
	if [ "$style_fail_count" -gt 0 ]; then
		echo "$style_fail_count $1 failure(s) across $2 file(s)."
		return 1
	fi
	echo "clean: $2 file(s), rule $1."
	return 0
}

# Resolve the file list a checker was given, defaulting to every markdown file in the repository.
style_files() {
	local root=$1; shift
	if [ $# -eq 0 ]; then
		find "$root" -name '*.md' -not -path '*/.git/*' -not -path '*/node_modules/*' | sort
	else
		printf '%s\n' "$@"
	fi
}
