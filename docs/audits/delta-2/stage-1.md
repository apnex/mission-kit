# Delta-2 stage 1 - mechanism

---

## What changed

- **Schema:** `ST` in the id pattern; `set` in the category enum; `members`, an array of at least one id, required of every set other than `ST0` and refused on any other category.
- **Schema tests:** `sets` added to the directories validated - and `traits`, which had never been validated, its prefix `T` also missing from the id pattern; all five trait entries now pass.
- **Generator:** reads block lists in frontmatter; refuses a set member that does not exist, is not active, or a set with none, and `members` on a non-set; writes each set's index into the set's own file.
- **Root layer table:** `sets/`, with a stage-1 placeholder charter `ST0`, replaced in stage 2.
- **`tools/sets.test.sh`**, in the gate.

---

## Criterion 1 - mutation proof, confirmed by a second agent

An agent other than the author disabled each check by its own hand-written edit, confirmed each edit applied by diff, ran the test, and restored the file byte for byte:

| Check disabled | `sets.test.sh` |
|---|---|
| member is an existing entry | 1 failure |
| member is active | 3 failures |
| a set has a member | 1 failure |
| block-list parsing | 2 failures |

Schema clauses, by the schema suite: an empty `members` and `members` on a style entry are each refused.

**A defect in the author's first proof, caught before it counted.**\
The first fixtures were written with `printf %s`, which does not expand `\n`, so every fixture was malformed and every check appeared not to fire - an unlanded mutation.\
The second attempt's test then failed for another reason: under `pipefail` the generator's own refusal exit failed the pipeline even when the message matched.\
The permanent test now confirms each fixture applied before judging it.
