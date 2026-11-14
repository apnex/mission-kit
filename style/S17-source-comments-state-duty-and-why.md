---
id: S17
category: style
title: Source comments state the file's duty and why non-obvious code is written that way
status: active
medium: code
enforced-by: tools/s17-source-comments.sh
hydrate-when: You are writing or editing an executable script or source file, or deciding what to put in its opening or inline comments
supersedes: []
related: [S8, S13, A3, A11, K27]
---

# S17 - Source comments state the file's duty and why non-obvious code is written that way

<!-- style-check: allow S8 (source comment blocks are the subject of this entry's examples) -->

## Rule

Comments in source files (`tools/*.sh`, `tools/*.mjs`, and application source) do two jobs that code and identifiers (`K27`) cannot do alone: the opening comment block states the file's single duty and how to invoke it, and inline comments state **why** a non-obvious constraint, edge case, or refusal exists.

1. **Opening header block.** Immediately below the line-1 `#!` shebang, every executable script opens with a contiguous comment block (`#` in shell, `//` in JavaScript) that carries:
   - **Line 2 (`<name> - <one-line summary>`):** the script's stem or filename followed by ASCII ` - ` and a one-line statement of what it holds or does.
   - **`Sovereign duty:` (for every non-test tool):** the single invariant, rule, or responsibility this script owns, and why a second copy would drift (`A3`). A `*.test.sh` fixture script states the tool and refusals it exercises on line 2 and need not repeat `Sovereign duty:`.
   - **`Usage:`:** the runnable command-line invocation forms and flags.
2. **Inline comments state why, not what.** Write an inline comment when a reader seeing only the code could reasonably simplify, reorder, or "fix" it and break an invariant - name the edge case, protocol boundary, or failure mode (`B<n>` or decision ID when applicable) that forced the shape. Do not narrate what a self-explanatory statement already says in code (`# increment i`).
3. **No commented-out code.** Never leave dead code statements inside comments (`# if [ ... ]; then`, `// const x = ...`). Delete unused code and rely on git history; commented-out code rots silently and leaves every later reader guessing whether it was disabled temporarily or abandoned.
4. **Plain ASCII in comments.** Every source comment obeys [`S13`](S13-plain-ascii-in-markdown.md)'s keyboard-typeability test (`0x20` to `0x7E` plus tab): write ` - ` or `--` rather than an em dash, `->` rather than an arrow glyph, and `...` rather than a single-character ellipsis.

---

## Boundary with `S8` and `K27`

- **[`S8`](S8-code-block-comments-not-prose.md) governs markdown code blocks; `S17` governs source files.** In a markdown workflow document (`S8`), prose paragraphs sit outside the code fence, so multi-line explanation inside the fence is smuggled prose and a comment inside the fence only annotates what an adjacent command line does. In a standalone source file (`S17`), there is no surrounding prose paragraph: the code itself already states *what* each line does, so the opening comment block carries the file's sovereign duty and `Usage:`, and inline comments state *why* non-obvious code is written that way.
- **[`K27`](../skills/K27-write-discoverable-code.md) governs identifiers; `S17` governs comments.** If a comment is only compensating for a vague function or variable name, rename the identifier under `K27` and delete the comment. Keep the comment when what must be said is an invariant, a negative constraint, or a reason that no identifier name can hold.

---

## Checking

Enforced by `tools/s17-source-comments.sh` (and regression-tested by `tools/s17-source-comments.test.sh`).

The checker inspects top-level executable scripts in `tools/*.sh` and `tools/*.mjs` when invoked without file arguments (or any `.sh` / `.mjs` files passed to it on the command line) and refuses:

1. A script whose line 2 does not match `(#|//) (<stem>|<filename>) - <summary>`.
2. A non-test script whose opening comment block omits a non-empty `Sovereign duty:`, or any script whose opening comment block omits a non-empty `Usage:`.
3. Any full-line comment (outside shell heredocs) containing non-ASCII bytes outside printable ASCII (`0x20`-`0x7E` and tab).
4. Any full-line comment (outside shell heredocs) whose body matches a commented-out shell or JavaScript statement (`const`, `let`, `var`, `function`, `import`, `export`, `return`, `if (...) {`, `for (...) {`, `while (...) {`, `if [ ... ]; then`, `for ...; do`, `while ...; do`, `local var=`, `export var=`).

Why a non-obvious block is written that way vs restating the code (and trailing end-of-line comments) remains a judgement check during review, just as `S14`'s condition markers catch obvious failures while the discriminator settles borderline triggers.

---

## Rationale

**A tool with no stated duty grows a second one (`A3`).**\
Six style rules were once implemented inside one script because nothing at the top of the file stated which single duty it owned.\
Requiring `Sovereign duty:` in the opening comment block of every non-test script forces the author to name the one invariant the script holds before writing the code.

**Why-comments prevent regressions that tests alone cannot explain.**\
When a line of code handles a subtle edge case - such as stripping inline backtick code before splitting markdown table pipes, or skipping `*.test.sh` in a glob that discovers per-rule checkers - a future reader who sees only the mechanism cannot tell whether a simpler expression is equivalent.\
Naming the failure mode at the line stops the next edit from re-introducing the bug.

**Non-ASCII in source comments breaks `--help` and grep.**\
Many tools print their opening comment block directly for `--help` (`sed -n '2,25p' "$0"`).\
An em dash or ellipsis glyph in a source comment escapes `S13` when `S13` scans only `*.md`, and then surfaces in terminal output and breaks plain-text grep across `tools/`.

---

## Examples

**Bad (missing line-2 `<name> - <summary>` header, missing `Sovereign duty:`, and commented-out code):**

```sh
#!/usr/bin/env bash
#
# Enforce S17 source comments.
# Usage: tools/s17-source-comments.sh

# if [ "$old_mode" = 1 ]; then
```

**Good (line-2 `<name> - <summary>`, `Sovereign duty:`, `Usage:`, plain ASCII, and a why-comment on the non-obvious heredoc skip):**

```sh
#!/usr/bin/env bash
# s17-source-comments - enforce S17: source comments state duty, usage, and why in plain ASCII.
#
# Sovereign duty: this rule and no other.
#
# Usage:  tools/s17-source-comments.sh [--root DIR] [FILE ...]

# Skip heredoc bodies so fixture lines starting with # inside a test script are not misread as outer comments.
```

---

## When to apply

- Creating or editing any `.sh` or `.mjs` script in `tools/` or application source.
- Reviewing a code change where a non-obvious branch or regex was added without stating what breaks if it is removed.
