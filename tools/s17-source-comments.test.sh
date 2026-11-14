#!/usr/bin/env bash
# s17-source-comments.test.sh - hold the S17 enforcer and check-all medium dispatch to their refusals.
#
# Sovereign duty: every refusal and allowance of tools/s17-source-comments.sh and check-all.sh's
# style-medium dispatch - valid .sh, .mjs, and *.test.sh headers, explicit file arguments and
# missing-file refusal, literal line-2 '<name> - <summary>' matching, non-empty 'Sovereign duty:'
# and 'Usage:' in the opening comment block, comment-line style-check: allow S17 and GENERATED FILE
# exemptions, heredoc skipping (<<'EOF' > file, <<-EOF with tab terminator, comment ending in <<EOF,
# <<< here-string), non-ASCII comment refusal, commented-out shell and JS statement refusal without
# flagging natural prose, and check-all.sh --style-only medium dispatch.
#
# Usage:  tools/s17-source-comments.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
tool="$root/tools/s17-source-comments.sh"
sandbox=$(mktemp -d /tmp/mk-s17-test-XXXXXX)
trap 'chmod -R u+w "$sandbox" 2>/dev/null || true; rm -rf "$sandbox"' EXIT

pass=0; fail=0
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

reset_fixture() {
	rm -rf "$sandbox/proj"
	mkdir -p "$sandbox/proj/tools/lib" "$sandbox/proj/style"
	cp "$root/tools/lib/style-common.sh" "$sandbox/proj/tools/lib/style-common.sh"
	cp "$root/tools/s17-source-comments.sh" "$sandbox/proj/tools/s17-source-comments.sh"
	cp "$root/tools/s13-plain-ascii.sh" "$sandbox/proj/tools/s13-plain-ascii.sh"
	cp "$root/tools/check-all.sh" "$sandbox/proj/tools/check-all.sh"
	cp "$root/style/S17-source-comments-state-duty-and-why.md" "$sandbox/proj/style/S17-source-comments-state-duty-and-why.md"
	cp "$root/style/S13-plain-ascii-in-markdown.md" "$sandbox/proj/style/S13-plain-ascii-in-markdown.md"
	chmod +x "$sandbox/proj/tools/s17-source-comments.sh" "$sandbox/proj/tools/s13-plain-ascii.sh" "$sandbox/proj/tools/check-all.sh"

	cat > "$sandbox/proj/tools/check-sample.sh" <<'EOF'
#!/usr/bin/env bash
# check-sample - hold the sample invariant across the fixture tree.
#
# Sovereign duty: this invariant and no other.
#
# Usage:  tools/check-sample.sh

# Guard against empty arguments before touching disk, including <<EOF markers in comments.
cat <<'INNER' > /dev/null
# if [ "$x" = 1 ]; then
INNER
cat <<-INDENTED > /dev/null
	# tab-indented heredoc body with if [ "$x" = 1 ]; then
	INDENTED
grep -q "foo" <<< "bar" || true
exit 0
EOF
	# Inject a non-ASCII comment line inside the INNER heredoc to verify heredoc bodies are skipped.
	sed -i "s/# if \[ \"\$x\" = 1 \]; then/$(printf '# non-ASCII in heredoc \xe2\x80\x94 and if [ "$x" = 1 ]; then')/" "$sandbox/proj/tools/check-sample.sh"

	cat > "$sandbox/proj/tools/generate-sample.mjs" <<'EOF'
#!/usr/bin/env node
// generate-sample - derive the sample index from fixture frontmatter.
//
// Sovereign duty: this generated view and no other.
//
// Usage:  node tools/generate-sample.mjs [--check]

// function names (camelCase) and return value (if any) in prose comments are allowed.
process.exit(0);
EOF

	cat > "$sandbox/proj/tools/sample.test.sh" <<'EOF'
#!/usr/bin/env bash
# sample.test.sh - hold check-sample.sh to its fixture refusals.
#
# Usage:  tools/sample.test.sh

exit 0
EOF

	chmod +x "$sandbox/proj/tools/check-sample.sh" "$sandbox/proj/tools/generate-sample.mjs" "$sandbox/proj/tools/sample.test.sh"
}

# Case 1: valid .sh, .mjs, and *.test.sh scripts pass via fallback, explicit arguments, and missing-file refusal.
reset_fixture
out=$("$tool" --root "$sandbox/proj" "$sandbox/proj/README.md" 2>&1); rc=$?
out_explicit=$("$tool" "$sandbox/proj/tools/check-sample.sh" "$sandbox/proj/tools/generate-sample.mjs" 2>&1); rc_explicit=$?
out_missing=$("$tool" "$sandbox/proj/tools/no-such-file.sh" 2>&1); rc_missing=$?
if [ "$rc" -eq 0 ] && grep -q "clean: 6 file(s), rule S17." <<< "$out" \
	&& [ "$rc_explicit" -eq 0 ] && grep -q "clean: 2 file(s), rule S17." <<< "$out_explicit" \
	&& [ "$rc_missing" -ne 0 ] && grep -q "no-such-file.sh:1  file does not exist" <<< "$out_missing"; then
	ok "valid scripts pass via fallback or explicit args, and missing explicit files are refused"
else
	no "valid scripts pass via fallback or explicit args, and missing explicit files are refused"
fi

# Case 2: malformed line-2 '<name> - <summary>' headers (wrong name, unescaped dot in stem, empty summary) are refused.
reset_fixture
sed -i '2s/.*/\/\/ wrong-name - summary for another file./' "$sandbox/proj/tools/generate-sample.mjs"
sed -i '2s/.*/# sampleXtest - dot in stem must match literally, not as a regex wildcard./' "$sandbox/proj/tools/sample.test.sh"
sed -i '2s/.*/# check-sample -    /' "$sandbox/proj/tools/check-sample.sh"
out=$("$tool" "$sandbox/proj/tools/generate-sample.mjs" "$sandbox/proj/tools/sample.test.sh" "$sandbox/proj/tools/check-sample.sh" 2>&1)
if [ $? -ne 0 ] \
	&& grep -q "generate-sample.mjs:2  line 2 must open with '// generate-sample - <one-line summary>'" <<< "$out" \
	&& grep -q "sample.test.sh:2  line 2 must open with '# sample.test - <one-line summary>'" <<< "$out" \
	&& grep -q "check-sample.sh:2  line 2 must open with '# check-sample - <one-line summary>'" <<< "$out"; then
	ok "malformed line-2 header (wrong stem, wildcard dot, or whitespace-only summary) is refused"
else
	no "malformed line-2 header (wrong stem, wildcard dot, or whitespace-only summary) is refused"
fi

# Case 3: missing or empty 'Sovereign duty:' / 'Usage:', or 'Usage:' placed after code outside the opening comment block, are refused.
reset_fixture
sed -i 's/Sovereign duty:.*/Sovereign duty:   /' "$sandbox/proj/tools/check-sample.sh"
sed -i 's/Usage:.*/Usage:   /' "$sandbox/proj/tools/generate-sample.mjs"
sed -i '/Usage:/d' "$sandbox/proj/tools/sample.test.sh"
printf '# Usage: tools/sample.test.sh\n' >> "$sandbox/proj/tools/sample.test.sh"
out=$("$tool" "$sandbox/proj/tools/check-sample.sh" "$sandbox/proj/tools/generate-sample.mjs" "$sandbox/proj/tools/sample.test.sh" 2>&1)
if [ $? -ne 0 ] \
	&& grep -q "check-sample.sh:2  opening comment block declares no 'Sovereign duty:'" <<< "$out" \
	&& grep -q "generate-sample.mjs:2  opening comment block declares no 'Usage:'" <<< "$out" \
	&& grep -q "sample.test.sh:2  opening comment block declares no 'Usage:'" <<< "$out"; then
	ok "missing, empty, or post-header Sovereign duty and Usage declarations are refused"
else
	no "missing, empty, or post-header Sovereign duty and Usage declarations are refused"
fi

# Case 4: non-ASCII in comments (including after a comment ending in <<EOF) is refused; style-check: allow S17 in a comment line exempts it, while the marker inside a code string does not.
reset_fixture
printf '  // Indented em dash \xe2\x80\x94 inside a source comment.\n' >> "$sandbox/proj/tools/generate-sample.mjs"
printf '# Non-ASCII after <<EOF in earlier comment: \xe2\x80\x94\n' >> "$sandbox/proj/tools/check-sample.sh"
printf 'echo "style-check: allow S17 in code string does not exempt"\n' >> "$sandbox/proj/tools/check-sample.sh"
out=$("$tool" "$sandbox/proj/tools/generate-sample.mjs" "$sandbox/proj/tools/check-sample.sh" 2>&1)
if [ $? -ne 0 ] \
	&& grep -q "generate-sample.mjs:10  non-ASCII character in source comment" <<< "$out" \
	&& grep -q "check-sample.sh:17  non-ASCII character in source comment" <<< "$out"; then
	printf '// style-check: allow S17 (character is the subject)\n' >> "$sandbox/proj/tools/generate-sample.mjs"
	sed -i '2i # GENERATED FILE - do not edit' "$sandbox/proj/tools/check-sample.sh"
	out2=$("$tool" "$sandbox/proj/tools/generate-sample.mjs" "$sandbox/proj/tools/check-sample.sh" 2>&1)
	if [ $? -eq 0 ] && grep -q "clean: 0 file(s), rule S17." <<< "$out2"; then
		ok "non-ASCII in comments is refused, code-string marker does not self-exempt, and comment/GENERATED FILE exemptions work"
	else
		no "comment-line style-check: allow S17 or GENERATED FILE exemption failed"
	fi
else
	no "non-ASCII character in source comment is refused"
fi

# Case 5: all 5 shell and 10 JavaScript commented-out statement patterns are refused while natural prose comments pass.
reset_fixture
cat >> "$sandbox/proj/tools/check-sample.sh" <<'EOF'
# if [ "$x" = 1 ]; then
# for item in a b; do
# while [ "$x" -lt 3 ]; do
# local count=0
# export MODE=prod
EOF
cat >> "$sandbox/proj/tools/generate-sample.mjs" <<'EOF'
// const oldPath = "legacy.json";
// let retries = 3;
// var legacyFlag = true;
// function helper(a, b) {
// import fs from "node:fs";
// export const version = 1;
// return false;
// if (ready) {
// for (const x of items) {
// while (running) {
EOF
out=$("$tool" "$sandbox/proj/tools/check-sample.sh" "$sandbox/proj/tools/generate-sample.mjs" 2>&1)
sh_hits=$(grep -c "check-sample.sh:.*commented-out code in source comment" <<< "$out" || true)
js_hits=$(grep -c "generate-sample.mjs:.*commented-out code in source comment" <<< "$out" || true)
if [ "$sh_hits" -eq 5 ] && [ "$js_hits" -eq 10 ]; then
	ok "all 5 shell and 10 JavaScript commented-out code patterns are refused while prose comments pass"
else
	no "all 5 shell and 10 JavaScript commented-out code patterns are refused (got sh=$sh_hits, js=$js_hits)"
fi

# Case 6: check-all.sh --style-only dispatches documents rules on .md changes, code rules on tools/*.sh and *.mjs changes, strips quotes on medium, and fails closed on unknown medium or invalid --since ref.
reset_fixture
(
	cd "$sandbox/proj"
	git init -q
	git config user.email "test@example.com"
	git config user.name "Test"
	printf '# Guide\n\nPlain ASCII markdown.\n' > README.md
	git add .
	git commit -q -m "initial"

	# 6a: modifying only README.md runs S13 (documents) and skips S17 (code) and non-style gates.
	printf 'Non-ASCII em dash \xe2\x80\x94 in markdown.\n' >> README.md
	out_md=$("$root/tools/check-all.sh" --root "$sandbox/proj" --style-only --since HEAD 2>&1); rc_md=$?
	git checkout -q -- README.md

	# 6b: modifying only tools/generate-sample.mjs runs S17 (code) and skips S13 (documents), even when medium is quoted.
	sed -i 's/^medium: code$/medium: "code"/' style/S17-source-comments-state-duty-and-why.md
	git commit -q -am "quote medium"
	printf '// return false;\n' >> tools/generate-sample.mjs
	out_src=$("$root/tools/check-all.sh" --root "$sandbox/proj" --style-only --since HEAD 2>&1); rc_src=$?
	git checkout -q -- tools/generate-sample.mjs

	# 6c: unknown medium fails closed.
	sed -i 's/^medium: "code"$/medium: slides/' style/S17-source-comments-state-duty-and-why.md
	out_bad_med=$("$root/tools/check-all.sh" --root "$sandbox/proj" --style-only --all 2>&1); rc_bad_med=$?

	# 6d: invalid --since ref exits 2.
	out_bad_ref=$("$root/tools/check-all.sh" --root "$sandbox/proj" --style-only --since non-existent-ref 2>&1); rc_bad_ref=$?

	if [ "$rc_md" -ne 0 ] && grep -q "FAIL  S13" <<< "$out_md" && ! grep -q "=== S17 ===" <<< "$out_md" && ! grep -q "=== repository structure is documented ===" <<< "$out_md" \
		&& [ "$rc_src" -ne 0 ] && grep -q "generate-sample.mjs:10  commented-out code in source comment" <<< "$out_src" && ! grep -q "=== S13 ===" <<< "$out_src" \
		&& [ "$rc_bad_med" -ne 0 ] && grep -q "unknown or missing medium: slides" <<< "$out_bad_med" \
		&& [ "$rc_bad_ref" -eq 2 ] && grep -q "unknown git revision for --since" <<< "$out_bad_ref"; then
		exit 0
	fi
	exit 1
)
if [ $? -eq 0 ]; then
	ok "check-all.sh --style-only dispatches documents vs code media, strips quotes, and fails closed on unknown medium or bad --since"
else
	no "check-all.sh --style-only dispatches documents vs code media, strips quotes, and fails closed on unknown medium or bad --since"
fi

# Case 7: invalid --root or unknown flag exits 2 across s17-source-comments.sh and check-all.sh.
out1=$("$tool" --root 2>&1); rc1=$?; out2=$("$tool" --unknown 2>&1); rc2=$?
out3=$("$root/tools/check-all.sh" --root "$sandbox/no-such-dir" --style-only --all 2>&1); rc3=$?
if [ "$rc1" -eq 2 ] && [ "$rc2" -eq 2 ] && [ "$rc3" -eq 2 ] && grep -q "FAIL  usage" <<< "$out1" && grep -q "FAIL  usage" <<< "$out2" && grep -q "FAIL  usage" <<< "$out3"; then
	ok "invalid --root and unknown flags exit 2"
else
	no "invalid --root and unknown flags exit 2"
fi

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
