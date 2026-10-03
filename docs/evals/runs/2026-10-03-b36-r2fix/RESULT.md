<!-- GENERATED FILE by tools/eval.mjs score; do not edit by hand. -->
# Result

Readers per corpus: 3. Scored blind by a separate agent; mapping in `sealed/`.

| Probe | before | after |
|---|---|---|
| design-rulings.R1 | 2 | 2 |
| design-rulings.R2 | 2 | 2 |
| design-rulings.R3 | 2 | 2 |
| design-rulings.R4 | 2 | 2 |
| design-rulings.R5 | 1.33 | 1 |
| design-rulings.R6 | 2 | 2 |
| system-boundary.S1 | 2 | 2 |
| system-boundary.S2 | 1.33 | 1.67 |
| system-boundary.S3 | 2 | 2 |
| system-boundary.S4 | 2 | 2 |
| system-boundary.S5 | 2 | 1.67 |
| system-boundary.S6 | 2 | 2 |
| **Total / 24** | **22.66** | **22.34** |

## What this measures

- Agents reading a corpus, scored against keys an author wrote, by agents of the same family: one measurement family, not 3 independent ones, and not a human judgement.
- Every reader also received the harness's always-on context, so a comparison against no corpus is confounded; a comparison between two corpora is not.
- 3 readers per corpus: a difference of one reader on one probe moves its mean by 0.67.
