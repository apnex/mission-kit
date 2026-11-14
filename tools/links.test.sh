#!/usr/bin/env bash
# links.test.sh - hold check-links.mjs to verifying relative markdown links and #fragment anchors.
#
# Sovereign duty: every refusal and allowance of tools/check-links.mjs - valid relative links and
# #fragment heading anchors (cross-file, duplicate-heading -1 suffix, snake_case heading, directory
# README.md#frag, HTML id/name anchor, and same-file), broken relative link refusal, broken
# #fragment anchor refusal, fenced and multi-backtick inline-code exemption, RU2 frozen-history
# exemption (and explicit file override), and --root missing-argument guard.
#
# Usage:  tools/links.test.sh

set -uo pipefail
root=$(cd "$(dirname "$0")/.." && pwd)
tool="$root/tools/check-links.mjs"
sandbox=$(mktemp -d /tmp/mk-links-test-XXXXXX)
trap 'chmod -R u+w "$sandbox" 2>/dev/null || true; rm -rf "$sandbox"' EXIT

pass=0; fail=0
ok() { printf '  ok    %s\n' "$1"; pass=$((pass + 1)); }
no() { printf '  FAIL  %s\n' "$1"; fail=$((fail + 1)); }

mkdir -p "$sandbox/proj/docs/audits" "$sandbox/proj/artifacts"
cat > "$sandbox/proj/artifacts/README.md" <<'EOF'
# AR0

## Overview

## Overview

## Calling `update_work` safely

<a id="custom-anchor"></a>
EOF

cat > "$sandbox/proj/docs/README.md" <<'EOF'
# docs

Valid link to [AR0](../artifacts/README.md#overview), [dup](../artifacts/README.md#overview-1), [dir](../artifacts#overview), [snake](../artifacts/README.md#calling-update_work-safely), [id](../artifacts/README.md#custom-anchor), and same-file [heading](#docs).
Inline code `[broken](../missing/inline.md)` and double-backtick `` `[also broken](../missing/double.md)` `` stay ignored.
External [site](https://example.com/a) and placeholder [tpl](../<layer>/README.md) stay ignored.

```markdown
[fenced broken](../missing/fenced.md)
```
EOF

cat > "$sandbox/proj/docs/audits/historical.md" <<'EOF'
# frozen audit
Historical link to [retired](../retired-layer/README.md#gone) is exempt under RU2.
EOF

# Case 1: valid relative links, #fragment anchors (duplicate -1, dir#frag, snake_case, id=, local), code spans, external URLs, placeholders, and RU2 frozen files pass.
out=$(node "$tool" --root "$sandbox/proj" 2>&1)
if [ $? -eq 0 ] && grep -q "links: 2 live markdown file(s) and 6 relative link(s) resolve." <<< "$out"; then
	ok "valid links and #fragment anchors (duplicate -1, dir#frag, snake_case, id=, local) pass while code and RU2 frozen files are ignored"
else
	no "valid links and #fragment anchors (duplicate -1, dir#frag, snake_case, id=, local) pass while code and RU2 frozen files are ignored"
fi

# Case 2: broken relative link in a live markdown file is refused with file, line and target.
cat >> "$sandbox/proj/docs/README.md" <<'EOF'
Broken link to [`backlog/`](../backlog/README.md).
EOF
if ! grep -q "backlog/README.md" "$sandbox/proj/docs/README.md"; then
	no "broken relative link in live file is refused (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox/proj" 2>&1)
	if [ $? -ne 0 ] && grep -q "FAIL  broken link    docs/README.md:10 -> ../backlog/README.md (backlog/README.md does not exist)" <<< "$out"; then
		ok "broken relative link in live file is refused"
	else
		no "broken relative link in live file is refused"
	fi
fi

# Case 3: relative link escaping repository root is refused even if target exists outside root.
cat > "$sandbox/outside.md" <<'EOF'
# outside
EOF
sed -i 's|\.\./backlog/README\.md|../../outside.md|' "$sandbox/proj/docs/README.md"
if ! grep -q "../../outside.md" "$sandbox/proj/docs/README.md"; then
	no "relative link escaping root is refused (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox/proj" 2>&1)
	if [ $? -ne 0 ] && grep -q "FAIL  broken link    docs/README.md:10 -> ../../outside.md" <<< "$out"; then
		ok "relative link escaping repository root is refused"
	else
		no "relative link escaping repository root is refused"
	fi
fi

# Case 4: broken #fragment heading anchor (cross-file and same-file) is refused.
sed -i 's|\.\./\.\./outside\.md|../artifacts/README.md#missing-section|' "$sandbox/proj/docs/README.md"
cat >> "$sandbox/proj/docs/README.md" <<'EOF'
Broken local [anchor](#no-such-heading).
EOF
if ! grep -q "missing-section" "$sandbox/proj/docs/README.md" || ! grep -q "no-such-heading" "$sandbox/proj/docs/README.md"; then
	no "broken #fragment heading anchor is refused (mutant did not land)"
else
	out=$(node "$tool" --root "$sandbox/proj" 2>&1)
	if [ $? -ne 0 ] \
		&& grep -q "FAIL  broken anchor  docs/README.md:10 -> ../artifacts/README.md#missing-section (#missing-section not found in artifacts/README.md)" <<< "$out" \
		&& grep -q "FAIL  broken anchor  docs/README.md:11 -> #no-such-heading (#no-such-heading not found in docs/README.md)" <<< "$out"; then
		ok "broken #fragment heading anchor is refused"
	else
		no "broken #fragment heading anchor is refused"
	fi
fi

# Case 5: explicit file argument checks a file under a frozen prefix directly.
out=$(node "$tool" --root "$sandbox/proj" docs/audits/historical.md 2>&1)
if [ $? -ne 0 ] && grep -q "FAIL  broken link    docs/audits/historical.md:2 -> ../retired-layer/README.md#gone" <<< "$out"; then
	ok "explicit file argument checks a frozen-prefix file directly"
else
	no "explicit file argument checks a frozen-prefix file directly"
fi

# Case 6: missing --root argument is refused with exit status 2.
out=$(node "$tool" --root 2>&1)
if [ $? -eq 2 ] && grep -q "FAIL  usage" <<< "$out"; then
	ok "missing --root argument is refused"
else
	no "missing --root argument is refused"
fi

printf '%d passed, %d failed\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
