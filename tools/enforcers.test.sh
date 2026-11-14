#!/usr/bin/env bash
# enforcers.test.sh - hold check-enforcers.sh to frontmatter, body-script, forked-tool, and orphan-tool checks.
#
# Sovereign duty: every refusal and allowance of tools/check-enforcers.sh - valid frontmatter
# enforced-by and body script references, non-script tools/README.md allowance, *.test.sh orphan
# exemption, missing frontmatter enforcer refusal, missing/non-executable body script refusal,
# body script disagreeing with enforced-by: (forked tool), orphan tools/s*-* and tools/ru*-*
# refusal, and --root missing-argument guard.
#
# Usage:  tools/enforcers.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
tool="$root/tools/check-enforcers.sh"
sandbox=$(mktemp -d /tmp/mk-enforcers-test-XXXXXX)
trap 'chmod -R u+w "$sandbox" 2>/dev/null || true; rm -rf "$sandbox"' EXIT

pass=0; fail=0
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

reset_fixture() {
	rm -rf "$sandbox/proj"
	mkdir -p "$sandbox/proj/style" "$sandbox/proj/rules" "$sandbox/proj/tools/lib"
	printf '#!/usr/bin/env bash\nexit 0\n' > "$sandbox/proj/tools/s1-sample.sh"
	printf '#!/usr/bin/env bash\nexit 0\n' > "$sandbox/proj/tools/s1-sample.test.sh"
	printf '#!/usr/bin/env bash\nexit 0\n' > "$sandbox/proj/tools/ru1-sample.sh"
	printf '#!/usr/bin/env bash\nexit 0\n' > "$sandbox/proj/tools/ru1-sample.test.sh"
	chmod +x "$sandbox/proj/tools/s1-sample.sh" "$sandbox/proj/tools/s1-sample.test.sh" "$sandbox/proj/tools/ru1-sample.sh" "$sandbox/proj/tools/ru1-sample.test.sh"
	printf '# docs\n' > "$sandbox/proj/tools/README.md"

	cat > "$sandbox/proj/style/S1-sample.md" <<'EOF'
---
id: S1
category: style
title: Sample style rule
status: active
enforced-by: tools/s1-sample.sh
---

# S1

Enforced by `tools/s1-sample.sh`, tested by `tools/s1-sample.test.sh`, and indexed in `tools/README.md`.
EOF

	cat > "$sandbox/proj/rules/RU1-sample.md" <<'EOF'
---
id: RU1
category: rule
title: Sample conduct rule
status: active
enforced-by: tools/ru1-sample.sh
---

# RU1

Enforced by `tools/ru1-sample.sh`.
EOF
}

# Case 1: valid frontmatter enforcers, valid body scripts, non-script tools/README.md, and *.test.sh pass.
reset_fixture
out=$("$tool" --root "$sandbox/proj" 2>&1)
if [ $? -eq 0 ] && grep -q "enforcers: every rule names a real tool" <<< "$out"; then
	ok "valid frontmatter and body scripts pass while tools/README.md and *.test.sh are allowed"
else
	no "valid frontmatter and body scripts pass while tools/README.md and *.test.sh are allowed"
fi

# Case 2: missing or non-executable frontmatter enforced-by is refused.
reset_fixture
sed -i 's|enforced-by: tools/s1-sample.sh|enforced-by: tools/s1-missing.sh|' "$sandbox/proj/style/S1-sample.md"
if ! grep -q "enforced-by: tools/s1-missing.sh" "$sandbox/proj/style/S1-sample.md"; then
	no "missing frontmatter enforced-by is refused (mutant did not land)"
else
	out=$("$tool" --root "$sandbox/proj" 2>&1)
	if [ $? -ne 0 ] && grep -q "FAIL  no enforcer  style/S1-sample.md names tools/s1-missing.sh, which is not an executable file" <<< "$out"; then
		ok "missing frontmatter enforced-by is refused"
	else
		no "missing frontmatter enforced-by is refused"
	fi
fi

# Case 3: missing or non-executable tools/*.sh or tools/*.mjs script in a rule body is refused, and executable script disagreeing with enforced-by is refused as forked tool.
reset_fixture
cat >> "$sandbox/proj/style/S1-sample.md" <<'EOF'
Retired checker `tools/check-style.sh --rule S1`, subpath `tools/lib/missing-helper.sh`, and mismatched `tools/ru1-sample.sh`.
EOF
if ! grep -q "tools/check-style.sh" "$sandbox/proj/style/S1-sample.md"; then
	no "missing or forked script named in rule body is refused (mutant did not land)"
else
	out=$("$tool" --root "$sandbox/proj" 2>&1)
	if [ $? -ne 0 ] \
		&& grep -q "FAIL  no enforcer  style/S1-sample.md body names tools/check-style.sh, which is not an executable file" <<< "$out" \
		&& grep -q "FAIL  no enforcer  style/S1-sample.md body names tools/lib/missing-helper.sh, which is not an executable file" <<< "$out" \
		&& grep -q "FAIL  forked tool  style/S1-sample.md body names tools/ru1-sample.sh, which disagrees with enforced-by: tools/s1-sample.sh" <<< "$out"; then
		ok "missing, non-executable or forked script named in rule body is refused"
	else
		no "missing, non-executable or forked script named in rule body is refused"
	fi
fi

# Case 4: orphan tools/s[0-9]*-* and tools/ru[0-9]*-* claimed by no rule are both refused.
reset_fixture
printf '#!/usr/bin/env bash\nexit 0\n' > "$sandbox/proj/tools/s99-orphan.sh"
printf '#!/usr/bin/env bash\nexit 0\n' > "$sandbox/proj/tools/ru99-orphan.sh"
chmod +x "$sandbox/proj/tools/s99-orphan.sh" "$sandbox/proj/tools/ru99-orphan.sh"
if [ ! -x "$sandbox/proj/tools/s99-orphan.sh" ] || [ ! -x "$sandbox/proj/tools/ru99-orphan.sh" ]; then
	no "orphan per-rule tools (s* and ru*) are refused (mutant did not land)"
else
	out=$("$tool" --root "$sandbox/proj" 2>&1)
	if [ $? -ne 0 ] \
		&& grep -q "FAIL  orphan tool  tools/s99-orphan.sh is claimed by no rule; expected style/S99-\*.md to name it" <<< "$out" \
		&& grep -q "FAIL  orphan tool  tools/ru99-orphan.sh is claimed by no rule; expected rules/RU99-\*.md to name it" <<< "$out"; then
		ok "orphan per-rule tools (style/s* and rules/ru*) are refused"
	else
		no "orphan per-rule tools (style/s* and rules/ru*) are refused"
	fi
fi

# Case 5: missing --root argument is refused with exit status 2.
out=$("$tool" --root 2>&1)
if [ $? -eq 2 ] && grep -q "FAIL  usage" <<< "$out"; then
	ok "missing --root argument is refused"
else
	no "missing --root argument is refused"
fi

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
