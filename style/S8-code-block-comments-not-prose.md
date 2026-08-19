---
id: S8
category: style
title: Code-block comments are for what-the-line-does, not prose substitutes
status: active
enforced-by: tools/s8-code-block-comments.sh
hydrate-when: You are about to put explanatory text inside a code block
supersedes: []
related: [S2, S5, S6, S7]
---

# S8 - Code-block comments are for what-the-line-does, not prose substitutes

## Rule

Comments inside code blocks (`# ...`, `// ...`, `-- ...`) explain what an adjacent code line does.\
They are NOT a substitute for prose paragraphs.\
Multi-line explanatory text, side notes, flag descriptions, design rationale, or "here's some context about this workflow" all belong in prose **between** code blocks, not as comment runs **inside** them.

The test: if you removed the comment, would the adjacent code line be less clear about what IT does?\
If yes -> comment belongs there.\
If no -> it's narration about a different scope (workflow, design, alternatives) and should be prose.

---

## Rationale

**Prose is searchable + indexable + screen-readable.**\
A paragraph between code blocks gets a stable position in the doc structure; it shows up in markdown TOCs, in plain-text search, in renderers' typography (distinguishable from code by font + color).\
Comments inside code blocks are formatted as code - visually identical to the executable lines, harder to distinguish at a glance.

**Operator cognitive load.**\
When a reader sees `# Add --revert-cmdline for X` above a `sudo ./scripts/remove.sh` line, they have to mentally disambiguate: is this comment telling me to ADD that flag (i.e., modify the command), or is it just listing flags I could optionally use?\
Prose makes that distinction visible by separating the executable from the explanatory.

**Doc-block tooling.**\
AI doc-parsers, syntax highlighters, copy-on-click buttons all work on the boundary "this is a code block."\
Prose hidden in a code block as comments is invisible to that tooling.

**Copy-paste hygiene.**\
An operator copying the code block expects to get executable commands.\
They don't want to also paste 4 lines of "side note about kernel cmdline philosophy."\
Prose-as-comments forces them to clean up after pasting.

---

## Examples

**Bad (prose hidden as comments inside the block):**

````markdown
## Remove

```bash
# Layer 3 first (workload), then Layer 2 (this container), then Layer 1 (host).
# Run uninstall to gracefully unload modules before tearing down the container.
sudo docker compose run --rm driver-injector uninstall
sudo docker compose down

# Reverse Layer 1.
# Add --revert-cmdline to strip kernel args; --purge for true blank-equivalent;
# --skip-k3s to leave RuntimeClass + containerd config alone.
sudo ./scripts/remove.sh
```
````

**Good (prose separated; comments only annotate adjacent commands):**

````markdown
## Remove

Reverse the install order: Layer 3 (workload) -> Layer 2 (this container) ->
Layer 1 (host).

Gracefully unload modules and tear down the container:

```bash
sudo docker compose run --rm driver-injector uninstall   # graceful rmmod
sudo docker compose down                                 # remove container
```

Reverse Layer 1 host config:

```bash
sudo ./scripts/remove.sh
```

Flags for `remove.sh`: `--revert-cmdline` strips kernel args; `--purge` for
true blank-equivalent; `--skip-k3s` to leave RuntimeClass + containerd config
alone.
````

(Comments inside the block describe individual commands.\
Prose between blocks describes the workflow + flag options.\
Each medium does its proper job.)

---

## When to apply

- Writing or editing workflow docs that mix executable steps with explanatory
  context.
- Reviewing a doc PR - scan for code blocks containing 2+ consecutive comment
  lines; that's the signal that prose was smuggled in.
