# Delta-1 stage 1 - mechanism

Exit criterion 1 asks for a mutation proof: each malformed fixture fails the gate, and passes once corrected.

---

## What changed

- **Schema:** `RU` and `PC` in the id pattern; `method`, `rule` and `practice` in the category enum; a `trace` property, required of every `rule` entry and at least twenty characters. `methodology` stays in the enum until stage 3 renames the layer.
- **Schema tests:** `methods`, `rules` and `practices` added to the catalogue directories, `methodology` kept through the rename; two tests holding the new refusals.
- **`tools/check-enforcers.sh`:** a rule in `rules/` that names an enforcer must name a real tool, as a style rule must.

---

## Mutation proof

Each clause was removed from the schema, the schema suite run, and the clause restored; the suite was green before and after.

| Clause removed | Suite |
|---|---|
| `trace` required of a rule | 1 failure |
| `trace` at least twenty characters | 1 failure |
| the id pattern's digits-only suffix, so `RUX1` would pass | 1 failure |

The third fixture the delta names - an entry in `practices/` declaring the wrong category - is caught by `generate-index.mjs`'s misfiled check, which reads the layer's charter.\
`practices/` has no charter until stage 2, so that fixture is proved in stage 2.
