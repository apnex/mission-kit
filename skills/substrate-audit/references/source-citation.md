# Source citation rules

Every nanoprobe output is reproducible. A future operator must be able to
take the citations and verify each one. These rules make that possible.

## Citation format

### Inline citations (in prose)

Use square-bracket prefix format:

- `[code: src/deriver/dialectic.py:88-142]` — code reference
- `[doc: docs/dialectic.md §reasoning_level]` — documentation reference
- `[claim: README §Dialectic API]` — claim reference
- `[gh: plastic-labs/honcho#312]` — GitHub issue/PR
- `[paper: arxiv 2503.xxxxx §3.2]` — academic source

Inline citations let a reviewer verify a single claim without scrolling to
a bibliography.

### Evidence table format

In feature specs, the Evidence table uses fully-qualified references:

| Type | Reference |
|---|---|
| Claim | `<quoted-text-snippet>` — `<full-url>`, retrieved YYYY-MM-DD |
| Doc | `<section-or-field-path>` — `<full-url-or-repo-path>` |
| Source | `<file-path>:<line-range>` @ commit `<short-sha>` |

### sources.md format

The substrate's `sources.md` is a complete index of every touched URL and
path. Format:

```markdown
# Sources

**Substrate:** <substrate-name>
**Pinned SHA:** <full-sha>
**Probe date:** YYYY-MM-DD

## Canonical repo
- https://github.com/org/repo @ <full-sha>

## Satellite repos (referenced, not probed)
- https://github.com/org/repo-sdk-python — purpose: Python client SDK
- https://github.com/org/repo-docs — purpose: docs site source

## Documentation
| URL | Section | Retrieved |
|---|---|---|
| <url> | <section> | YYYY-MM-DD |

## Source files touched
| Path | Purpose |
|---|---|
| `src/foo.py` | derivation entry point |
| `src/bar.py` | retrieval impl |

## GitHub issues / PRs cited
- gh#NNN — <one-line summary>

## Papers
- <author> et al., "<title>", <venue> YYYY — <url>
```

## SHA pinning rules

1. **Pin at the START of the probe.** Decide the SHA before reading any
   code. Use `git rev-parse HEAD` after `git checkout <tag>` if working
   from a tag.
2. **Record the FULL SHA in sources.md.** Use the short SHA (first 7 chars)
   in inline citations for readability.
3. **If the SHA is updated mid-probe** (e.g. upstream pushes a fix you need),
   stop, re-record the new SHA in `00-summary.md` under "Probe metadata", and
   re-verify every Evidence row already written.

## Line-range conventions

- Single line: `src/foo.py:42`
- Range: `src/foo.py:88-142` — inclusive on both ends
- Whole file (rare, avoid): `src/foo.py` — only when the file IS the feature
- Function-scoped: `src/foo.py:Bar.baz` — acceptable when line numbers will
  drift; prefer line ranges with SHA pinning

## URL volatility

External URLs decay. Defensive measures:

- **Always record retrieval date.** A future probe can compare to current
  state.
- **For volatile sources** (blog posts, social media), capture a snapshot:
  `archive.org/web/<timestamp>/<url>`.
- **For docs hosted by the project**, prefer linking to the doc source in
  the repo at the pinned SHA (e.g.
  `github.com/org/repo/blob/<sha>/docs/foo.md`) over the rendered docs
  site URL.

## Anti-patterns

- **"See README"** — not a citation. Cite the section or quote the text.
- **"In the source code"** — not a citation. Give file:line at a specific SHA.
- **Bare URLs without context** — readers can't tell if the URL is claim,
  doc, source, or noise. Always prefix with the type tag.
- **Plain "main" branch references** — `src/foo.py:42` without a SHA is
  unverifiable the moment upstream pushes.
- **Permalinks without retrieval date** — even GitHub permalinks can refer
  to content that's been edited via force-push (rare but real for some repos).
