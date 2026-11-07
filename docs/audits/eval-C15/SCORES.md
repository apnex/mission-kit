# C15 entity-graph cold read - scores

Key: `KEY.md` in this folder, frozen.\
Document: `components/C15-entity-graph.md`: the entry at `82115e6` (run 1), its revision of 2026-11-07 (run 2), and the final text after the review's fixes (run 3).\
Method: `M2`, reasoning documents.\
Readers held only the document, or nothing, and were told to label every claim SAYS or GUESS; each answer set was scored by two independent scorers, anonymised in run 1.\
Run folder: `docs/evals/runs/2026-11-07-c15-cold-read` (local), holding all three runs.\
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
| `Q1` | 1.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | yes |
| `Q2` | 1.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | yes |
| `Q3` | 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | no |
| `Q4` | 1.50 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | no |
| `Q5` | 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | no |
| `Q6` | 1.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | yes |
| `Q7` | 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | no |
| `Q8` | 1.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | yes |
| `Q9` | 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | no |
| `Q10` | 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | 2.00 / 2.00 | no |

The keys of runs 2 and 3 differ from run 1's where the director's rulings of 2026-11-07, or the revised text, changed the right answer; `KEY.md` marks each such probe.\
The two scorers agreed on 30 of 30 decision scores in run 2 and 30 of 30 in run 3.

---

## What the runs found

- Readers holding the entry decide adoption (`Q1`), durability (`Q2`) and field-validation routing (`Q6`) better than readers holding nothing; `Q3`, `Q5` and `Q7` do not separate, since capable readers decide them unaided.
- Readers of every version are at the ceiling, so runs 2 and 3 can show damage and cannot show improvement: none was found, and on every probe whose right answer the director's rulings changed, readers of the revision gave the new answer.
- Run 1 readers could not decide what to do while the entry is a draft, how a browser client commits, how the view is first filled, what a commit returns, undo after another writer's change, traversal direction, or the invariant shape, which the entry stated two ways; the director ruled the design questions open, and the revision states them as design owed.
- Run 2 readers found no path for a project with no implementation, `0116` and `B106` cited unexplained, `related` not matching the body, an undefined measure of brokenness, and a capacity example reaching into `C11`'s geometry; the final text answers each.
- Run 3 readers found the entry failing its own insufficiency test where design is owed, identity across undo stated as a goal inside a contract row, and "either records" ambiguous; the committed text answers these three.
- Run 3 readers also found the interim guidance a deadlock for a project with no implementation and no timeline; that is left for the director, since the guidance follows `C0`'s rule against forks.

---

## What this record cannot claim

- It cannot show any revision improves on the original on these probes: every version is at the ceiling.
- The committed text carries wording changes made after run 3, in answer to its readers; they change no probe's right answer, and no fourth run has read them.
- The keys' order before the readers is evidenced by hashes kept in the local run folder, not by a commit, which `M2` rule 1 asks for.
- The keys of runs 2 and 3 were written by the agent that made the revision, so ties go to the original; none arose.
