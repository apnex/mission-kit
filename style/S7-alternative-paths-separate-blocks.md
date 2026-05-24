---
id: S7
category: style
title: Alternative paths in separate code blocks under subsections
added: 2026-05-24
status: active
supersedes: []
related: [S2, S5, S8, P1]
---

# S7 — Alternative paths in separate code blocks under subsections

## Rule

When showing alternative workflows (Path A vs Path B, OS X vs OS Y, two ways
to do the same thing), each alternative gets its own clearly-headed
subsection with its own fenced code block. **Do not** pack alternatives into
a single block separated by `# This is Path A:` / `# This is Path B:`
comments.

Each block must be independently copy-pasteable — running it in isolation
must produce one valid path's result, not a hybrid or an error.

## Rationale

**Copy-paste safety.** A single block with comment dividers tempts a careless
operator to copy the whole block — running Path A's commands AND Path B's
commands, even though they're alternatives, not a sequence.

**Visual structure mirrors logical structure.** If two things are
alternatives, they should LOOK like alternatives in the doc. A reader
scanning for "the Kubernetes path" should be able to skip directly to the
Path B subsection without parsing every line of a single block to find which
comments mark their path.

**Independent maintenance.** When Path A changes, the diff touches only Path
A's block. Mixed blocks invite changes that accidentally reflow or restructure
the OTHER path's text.

**Reader trust.** Comment-dividers-as-section-markers feel like a structural
hack — the doc is fighting markdown's own affordances (headers, separate
blocks). Using headers + separate blocks signals "this doc respects its
medium."

## Examples

**Bad (single block, comments as path dividers):**

````markdown
## Install

```bash
# Path A — docker-compose:
docker compose up -d

# Path B — k3s DaemonSet:
kubectl apply -f k8s/daemonset.yaml
kubectl rollout status -n kube-system ds/foo
```
````

(A reader copying the whole block runs Path A AND Path B. Worse, the comment
"Path A — docker-compose:" is not a section marker in markdown's sense — it
won't appear in a TOC, won't show up in `grep '^#'`, won't render with header
styling.)

**Good (separate subsections, separate blocks):**

````markdown
## Install

### Path A — docker-compose

```bash
docker compose up -d
```

### Path B — k3s DaemonSet

```bash
kubectl apply -f k8s/daemonset.yaml
kubectl rollout status -n kube-system ds/foo
```
````

(Each path is a markdown subsection — appears in TOC, renders with header
styling, independently copy-pasteable, independently maintainable.)

## When to apply

- Writing or editing install / teardown / upgrade docs with alternative
  deployment paths.
- Any doc showing "do this OR that" patterns where each branch has multiple
  commands.
- Pairing with [[P1]] which establishes the Path A / Path B labeling
  convention — S7 is how P1's labels render in markdown.

## Origin

2026-05-24 README style audit — install + remove sections packed Path A
(docker-compose) and Path B (k3s) commands into single bash blocks with
`# Path A:` / `# Path B:` comments as dividers. A reader following the doc
literally would run BOTH paths if they copy-pasted the whole block.
