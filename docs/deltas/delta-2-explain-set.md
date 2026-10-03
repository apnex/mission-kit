# Delta-2 - the explain set - a set spanning layers

```yaml
status:       ratified, revision 4 - stages 1 and 2 done; stage 3, the human check, next
row:          B38, B42
intent:       docs/surveys/b38-director-communication-requirements.md
evidence:     docs/evals/human/runs/moves-2-*, guidance-1-*; docs/evals/human/MATRIX.md
guidance:     docs/evals/human/guidance-1/guidance-as-tested.txt - the text the director preferred 4 of 4
from-state:   docs/ARCHITECTURE.md, at d39808e
```

Revisions 1 and 2 are retained in history; revision 2 was withdrawn because it rested on agents scoring agents, not on the human the set is for.

---

## 0. From-state -> to-state

**From.**\
The corpus has no guidance for an agent communicating with a human of limited context.\
The director stated the need, and a limit was derived from the axioms for each of *understand* and *decide*; the director confirmed the first explicitly and the second by choosing to proceed from it.
**Evidence, by run:**

- **The tested text** (`guidance-1`): a fresh agent given it, against a fresh agent without it, on four new scenarios - **preferred 4 of 4**.
- **An earlier rewrite to the same limits** (`moves-2`): four of the agent's real messages against a rewrite - preferred 4 of 4. It did not use the Continue / Explore / Return prefixes or the request-for-action line, which were adopted after it.
- **An isolated test** (`moves-1`, abandoned as invalid): two point-first pairs, both judged the same - the pairs differed too little, and the display flattened both.

So the evidence is for the tested text as a whole, from one human, in four pairs; no single move's share is known (`B42`).

**To.**

| Layer or entry | What it is | Prefix | Category |
|---|---|---|---|
| `sets/` | charters of populations that span layers | `ST` | `set` |
| `ST0` | the layer's charter: what earns a spanning set, and that the set declares its members | | |
| `ST1` | the explain set's charter | | |
| `M10` | **guided dialogue** - the method: steps to understanding, then a decision, then the decision recorded | `M` | `method` |
| `S15` | **a message to a human** - the style moves, one entry | `S` | `style` |

**Why one style entry, not one per move.**\
Admission requires an observed difference, and the difference was observed for the moves together.\
`S15` holds them as one rule with its evidence level stated; a move splits into its own entry when an isolated pair shows it helps alone, and leaves when one shows it does not (`B42`).

**Placement of every line of the tested text**, by `M0`'s sequence; reviewed by a fresh agent as criterion 3:

| Lines | Content | Kind | Goes to |
|---|---|---|---|
| 3-4 | when to use it; who the reader is | scope | both, as each entry's trigger and audience |
| 8-9 | the two limits | the result the method produces | `M10` |
| 13, 15, 17 | know the finish line; establish understanding before a decision; record the decision | produces a result - a confirmed, recorded decision | `M10` |
| 14, 16 | one step per message; one decision per message | the message's form | `S15`; `M10` cites it, does not restate it |
| 21-25, 27 | point first; one question; where you are; names explained; no hidden request; picks with prefixes | the message's form | `S15` |
| 26 | the decision frame | split: the frame's form - labelled recommendation, pick at the end - is style; *every option with its cost, including doing nothing, nothing hidden* needs the real options to check, so it is `M10`'s step | `S15` and `M10` |
| 31 | narrative only where it carries understanding | governs what a message contains, judged from the message | `S15`, a style rule needing judgement |

Nothing becomes a practice: no line governs conduct while leaving no trace.
---

## 1. The fence

### Content

`M10` and `S15` carry the tested guidance's text, placed line by line as the table above says; the only additions are frontmatter, headings, each entry's evidence statement, and the cross-reference that replaces line 16's *(below)*.\
Each states its evidence: preferred by the director in the package, with the run paths.

### The mechanism for a spanning set

| Part | Shape |
|---|---|
| **Membership** | declared by the charter, in a `members` list - the set's territory gives membership its meaning, so the relationship sits on the charter's side |
| **Check** | every `members` id exists and is active; the generator fails otherwise |
| **Index** | generated into each set charter from `members`, and `sets/` appears in `INDEX.md` like any layer |
| **Contract** | `ST` in the id pattern; `set` in the category enum; `members` required of every set other than `ST0`, at least one item, and allowed on no other category |
| **Also required** | `sets/` in the root layer table; `sets` and the missing `traits` in the schema test's directories; the generator reading block lists, writing a set's index into its own file, and checking each member is active |
| **Reachability** | `E3` amended under a banner: a spanning set's member reaches its charter through the ledger's `sets/` section, not through its own `category` |

### `ST1`, the explain set

**Purpose:** a human with limited context, who may be reading cold, can understand what an agent tells them and decide what it asks.\
**Territory:**

| Moment | Members |
|---|---|
| **the form of any message to a human** | `S15` |
| **guiding a human to understanding, then a decision** | `M10` |
| **a live walkthrough with the director** | `W24` - the work-type in which `M10` is the procedure, to be cited when `W0` is converted |

**Related, with recorded tensions, not members:** `K5` survey asks three questions a round, against *one question at a time*; `AR3` board offers many moves at once, against *one decision at a time*; `RU1` honest yield is triggered by sweeps and audits, not by any report. Each is reconciled before it joins.\
**Axiom alignment:** `A13`, `A12`, `A5`, `A4`, `A8` - the axioms the two limits were derived from; cited, not enrolled.\
**Gaps recorded:** bad news and teaching were tested in one pair each; no move is yet isolated; `M10` is a new procedure rather than a strengthening of `W24` because `W24` is a unit of work and `M10` how it is conducted, as work-types cite procedures (`B24`).

### Also

- `S0` amended: its scope covers messages to a human, and `S15` is the first style rule for one medium.
- `B39`'s trigger fires; one rule does not earn a sub-set, so the medium is recorded in `S15` and the trigger moves to *a second single-medium rule*.

---

## 2. Build order

1. **Mechanism.** Schema, generator, structure checks; mutation-proved: an unknown `members` id fails, a superseded member fails, removing an id removes it from the index.
2. **Entries.** `ST0`, `ST1`, `M10`, `S15`, `S0`'s scope.
3. **Evaluation.** Before anything reaches `main` (`B40`).

---

## 3. Coverage map

| Decision | This delta | Criterion |
|---|---|---|
| spanning sets live in `sets/` | proves | 1, 2 |
| the explain set | proves | 2, 6 |
| the guidance lands, by kind (option C) | proves | 3, 5 |
| moves earn their own entries by isolated evidence | defers to `B42`; `S15` states the rule | - |

---

## 4. Verification targets

- `tools/check-all.sh`, with the stage-1 mutants: an unknown member, a superseded member, a draft member, an empty `members`, a block-list `members`, and `members` on a non-set entry.
- A script mapping every line of `guidance-as-tested.txt` to `M10` or `S15` per the placement table.
- `tools/eval-human.mjs`, rendered in chat, for criterion 5.
- `tools/eval.mjs` for criteria 6 and 7.

---

## 5. Exit criteria

1. Each stage-1 mutant fails the gate, confirmed applied by an agent other than the author, and passes once corrected.
2. `ST1`'s members are reviewed by a fresh agent against its territory and the director's goal before it lands; any member it finds misplaced is removed or the finding is ruled on by the director.\
   *Applied at stage 2:* the review found `W24` director-led and not agent-executable, with no observed difference for it; it was moved to related, and `W23` and `AR4` added as related. Members: `S15`, `M10`.
3. A fresh agent reviews the placement table against `M0`'s sequence and finds no line misplaced; the script then finds every line of the tested text in its assigned entry, and no text in either entry beyond the allowed additions.
4. `tools/check-all.sh` passes.
5. **The human check.**
   - Six scenarios - bad news, a status update, an explanation, teaching a concept, a single decision, two linked decisions - written by a fresh agent from the friction log and the director's statement, committed before any message is generated.
   - A fresh agent given only the landed `M10` and `S15`, and a fresh agent given nothing, each write one message per scenario.
   - Shown to the director in chat as written, unaltered, one pair per turn, positions random.
   - **Passes if the director prefers the guided message in at least five of six; a tie counts against.** By chance that is about one in nine.
6. Findability: a cold agent with the corpus, given each of the six moments in a prompt written by a fresh agent, names `M10` or `S15` in at least two of three runs for each.
7. No standing suite regresses, under the rule in `docs/evals/README.md`.

**Who evaluates.** 1, 3 and 4 mechanical, with fresh-agent review; 5 the director; 2, 6 and 7 fresh agents.\
Ratification is the director's.

---

## 6. Named costs and non-claims

- One new layer, starting with one set.
- `S15` bundles moves whose individual worth is unknown; that is stated in the entry, not hidden.
- Evidence is from one human. It shows the guidance works for this director; it does not show it generalises.

---

## 7. Anti-scope

- No change to the tested text beyond placing it by line and the allowed additions.
- No new move, and no isolated-move evaluation; that is `B42`.
- No `style/` sub-directory.
