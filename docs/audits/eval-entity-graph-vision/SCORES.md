# entity-graph vision cold read - scores

Key: `KEY.md` in this folder, frozen.\
Document: `apnex/entity-graph` `VISION.md`: the draft at `bf078b4` (run 1), its revision of 2026-11-07 under the director's rulings `D2` to `D6` (run 2), and the final text after the review's fixes (run 3).\
Method: `M2`, reasoning documents.\
Readers held only the document, or nothing, and were told to label every claim SAYS or GUESS; each answer set was scored by two independent scorers, anonymised in run 1.\
Run folder: `docs/evals/runs/2026-11-07-entity-graph-vision-cold-read` (local), holding all three runs.\
Run 1: three readers holding the original, two holding nothing.\
Runs 2 and 3: three readers each, holding the revision and then the final text; the readers holding nothing were not repeated, and run 1's record stands for separation, as `M2` rule 4 allows.\
Every reader and scorer was the same model family, so agreement across them is one measurement family, not several.

---

## Scores

Mean of two scorers over each group's readers, 0 to 2, as decision / grounded.\
Decision scores judge what a reader decided; grounded scores apply the key's rules, including the cap on claims labelled GUESS.\
A probe separates when readers holding the original exceed readers holding nothing by at least 0.75 on decisions, stated before run 1; the first column gives decisions only.

| probe | run 1, nothing held | run 1, original | run 2, revision | run 3, final | separates in run 1 |
|---|---|---|---|---|---|
| `V1` | 1.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | yes |
| `V2` | 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | no |
| `V3` | 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | no |
| `V4` | 1.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | yes |
| `V5` | 1.50 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | no |
| `V6` | 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | no |
| `V7` | 1.00 | 2.00 / 2.00 | 2.00 / 1.67 | 2.00 / 2.00 | yes |
| `V8` | 1.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | yes |
| `V9` | 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | no |
| `V10` | 1.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | yes |

The keys of runs 2 and 3 differ from run 1's where the director's rulings of 2026-11-07, or the revised text, changed the right answer; `KEY.md` marks each such probe.\
The two scorers agreed on 30 of 30 decision scores in run 2 and 30 of 30 in run 3.

---

## What the runs found

- Readers holding the draft decide a persisted snapshot (`V1`), merging concurrent edits (`V4`), authority (`V7`), a different index mechanism (`V8`) and ownership (`V10`) better than readers holding nothing.
- In run 1 all three readers concluded the draft forbade a different index mechanism, so it bound the design; the director ruled the vision states purpose only (`D2`), and readers of the revision answered that the mechanism is the design effort's to choose.
- Readers of every version are at the ceiling on decisions; no probe scored lower on a revision.
- Run 2 readers found the status line citing rulings the body did not, a Reversibility measure promising identity without the open question, an ambiguous Reuse sentence, scheduling under the query-engine heading, and undo after a later change outside the open conflict question; the final text answers each.
- Run 3 readers found "An embeddable library" read as settling `D5`, which the committed text answers, and three points that follow the ratified sibling visions and are left as they are: outside references a cold reader cannot resolve, a Leanness measure with no threshold, and a dated status line beside "no current state".

---

## What this record cannot claim

- It cannot show any revision improves on the original on these probes: every version is at the ceiling.
- The committed text carries wording changes made after run 3, in answer to its readers; they change no probe's right answer, and no fourth run has read them.
- The keys' order before the readers is evidenced by hashes kept in the local run folder, not by a commit, which `M2` rule 1 asks for.
- The keys of runs 2 and 3 were written by the agent that made the revision, so ties go to the original; none arose.
