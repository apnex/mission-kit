# mission-kit

Cross-project engineering knowledge — precision-engineered, managed
content. **What lives here:** rules, methodologies, patterns, and
skills that survive any specific project. **What doesn't:** point-in-time
state, migration records, hardware-specific notes, project-only
artifacts.

## Why

Solo engineers + small teams accumulate hard-won practice as you ship
projects. That practice tends to live in three places: in your head,
in scattered project README files, and in chat logs. None of those
are searchable or referenceable later. `mission-kit` is the
forward-application repo: codify the rule once, link it from project
repos when you apply it.

## Entry shape

Every entry has the same frontmatter + body skeleton — see
[`_template.md`](_template.md). Frontmatter is machine-parseable; the
body sticks to *rule + rationale + good/bad examples + when to apply +
origin*.

Axiom entries (prefix `A`, folder [`axioms/`](axioms/)) are the
exception: they carry a tele-native body shape — *Mandate / Mechanics /
Rationale / Faults / Success signals / Provenance* — rather than the
standard skeleton, and add an `applies-to` frontmatter field declaring
the axiom's domain of validity (the architectural assumptions under
which it is load-bearing). See [`axioms/README.md`](axioms/README.md).

## ID scheme

Each entry has a stable ID, prefixed by category:

| Prefix | Category | Folder |
|---|---|---|
| `A` | **Axiom** — foundational always-in-force principles | [`axioms/`](axioms/) |
| `S` | **Style** — doc + commit + naming conventions | [`style/`](style/) |
| `M` | **Methodology** — ways of working | [`methodology/`](methodology/) |
| `P` | **Pattern** — recurring designs | [`patterns/`](patterns/) |
| `K` | **Skill** — operator-level capabilities + tooling | [`skills/`](skills/) |

IDs never get re-used. If an entry is replaced, the new entry gets a
new ID and the old one's `status:` flips to `superseded` with a
`supersedes:` cross-link. The full ledger lives in
[`INDEX.md`](INDEX.md).

## Hard rules

These are non-negotiable; they're what makes the repo "precision
engineered" rather than a dumping ground.

1. **Cross-project only.** Entry must be applicable to a project that
   isn't this one. The test: *"could a different team, on different
   hardware, in a different problem domain, follow this directly?"*
   If no → it belongs in the project's repo, not here.

2. **No point-in-time content.** No "current state of X", no "as of
   2026-XX", no version pins in the body ("Kubernetes 1.32.5"). If
   you must mention a version, qualify it ("Kubernetes 1.25+"). The
   only date in an entry is the `added:` field in frontmatter (for
   chronological provenance).

3. **No archival.** Don't keep stale entries "for history." Use
   `status: superseded` + a cross-link to the replacement. The OLD
   entry stays at its ID; the NEW entry gets a fresh ID.

4. **Each entry derives from at least one real finding.** Don't
   speculate. Codify what you've actually proven on a project. The
   `Origin` section says where.

5. **Examples are generic.** Don't write "in nvidia-driver-injector
   we did X." Write "when you have producer/consumer split, do X."
   Project-specific phrasing belongs in the project repo.

## How to add a new entry

1. Copy [`_template.md`](_template.md) to the right category folder.
2. Pick the next free ID in that category (check
   [`INDEX.md`](INDEX.md)).
3. Fill in frontmatter + body following the template.
4. Add a row to [`INDEX.md`](INDEX.md).
5. Add a row to that category's `README.md` (the local index).
6. Commit. Reference the entry ID in any project repo that applies
   the rule from now on.

## How to reference from a project repo

Project repos link back rather than duplicate. Example, in a
project's `docs/style-guide.md`:

```markdown
The doc style rules this repo follows live in [mission-kit][1].
Applied entries: S1, S2, S3, S4.

[1]: https://github.com/<your-org>/mission-kit
```


## Bundles

The `bundles/` directory composes skills into operator-facing roles.
A bundle is a small YAML file listing the skills required to perform
a particular kind of work (e.g. `nanoprobe.yaml` composes the skills
needed for code-grounded substrate research).

Bundles are deliberately separate from the entry taxonomy:

- **Entries** (S/M/P/K) are units of *knowledge*. They are authored,
  reviewed, and curated.
- **Bundles** are units of *deployment composition*. They tell a
  consumer system (e.g. a GitOps skill loader like `skill-sync`)
  which skill subdirectories to pull when assembling a given role.

Bundles MUST stay agent-agnostic — no harness-specific fields, no
tool names. Any agent that consumes SKILL.md trees from a directory
should be able to resolve a bundle by reading its `skills:` list.

Bundles do not get IDs in `INDEX.md`. They are convention-managed by
filename (`bundles/<role>.yaml`).

## Schemas

The [`schemas/`](schemas/README.md) directory owns reusable, machine-verifiable
entity contracts that are independent of any one skill or project.
Schema resources use a small Kubernetes-like `apiVersion` / `kind` /
`metadata` / `spec` envelope and carry their own examples and executable
validation tests.
Schemas do not receive knowledge-entry IDs in `INDEX.md`.

## Status

Bootstrap commit seeded with 12 entries from the
`nvidia-driver-injector` project's first cycles. Grows
opportunistically as new findings surface; not exhaustively.
