# Delta-1 stage 3 - the moves

---

## What moved

| Old | New | Layer |
|---|---|---|
| `M3` default-reject, honest yield | `RU1` | `rules/` |
| `M4` frozen history | `RU2` | `rules/` |
| `M5` anti-amnesia deferral | `RU3` | `rules/` |
| `K2` publishing rewritten history | `RU4` | `rules/` |
| `M6` author from exemplar | `PC1` | `practices/` |
| `K1` history content scrub | `M9` | `methods/` |

`methodology/` renamed `methods/`; category `methodology` became `method` on every entry in it and was removed from the schema's enum; the charter is titled *Methods*.\
Each old id stays at its path, `status: superseded`, its body one line naming its successor; each successor declares `supersedes`.\
Each rule declares its `trace`.

---

## Exit criteria for this stage

- **Criterion 3, references.** `tools/check-moves.sh`, new and in the gate: every superseded entry names a live successor that claims it, and no live entry outside `docs/` and generated indexes cites a superseded id. Mutation-proved: a stub naming a missing successor failed it, and a live citation of `M5` added to `A0` failed it.
- **Criterion 4, bodies unedited.** Each moved body diffed against its predecessor at `719351d`: every changed line is an id or path retarget - one line each for `RU1` to `RU3` and `PC1` (the heading's id), six for `M9`, five for `RU4`.
- **Criterion 5.** `tools/check-all.sh` passes, 22 checks.

---

## A defect in the author's own move, caught by the gate and reverted

The path rewrite also matched the word *methodology/* in prose - *reusable methodology/substrate/governance change* - inside two packaged skills the delta's fence excludes.\
The gate's style checks flagged one; the diff showed both; both files were restored.\
The prose use in `D6`, which names this corpus's own layers, was kept as a reference to the renamed layer.
