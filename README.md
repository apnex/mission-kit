# mission-kit

The portable specification of how an engineering organisation operates.

This is the charter, and it deliberately carries no `A` prefix: it governs the corpus, while the axioms govern the systems the corpus is used to build.

Not a wiki, and not a lessons file.\
This repository holds the constitution, the composable axes of work, the methods and conventions, the executable capabilities, and the machinery that keeps all of it true.

---

## Mandate

mission-kit is complete enough that an agent holding nothing can instantiate the organisation, compile strategic intent into correct work, and have that correctness measured rather than trusted.

Four properties, each falsifiable:

- **Portable.** The corpus is self-contained and resolves from any host, any working directory, any harness. A rule that only works on one machine is a project artifact, not an entry here.
- **Addressable.** Every entry has a stable ID and is reachable by it. An entry nothing can cite cannot be applied.
- **Routable.** Every entry states the condition under which to open it. An entry that exists but is never reached has the same value as no entry.
- **Checkable.** What can be verified by a script is verified by a script. Prose states intent; mechanism holds it.

---

## Mechanics

**Three axes compose, rather than enumerate.**\
Work is generated, not catalogued:
```
role x work-type x domain
   -> WorkItem template + evidence authority + independence constraints
```

`roles/README.md` owns the role axis, `domains/README.md` the domain axis, and `work-types/README.md` the composition rule and the closeability preflight.\
The constraint set is authored once in the cross-axis reference and never forked into the entries that use it.

**Layers, each owning one concern.**

| Prefix | Layer | Owns |
| --- | --- | --- |
| `A` | [`axioms/`](axioms/) | First principles. Why a design is correct rather than merely working. |
| `R` | [`roles/`](roles/) | Who may attest, approve or decide. The M axis. |
| `D` | [`domains/`](domains/) | Subject surfaces. The N axis. |
| `W` | [`work-types/`](work-types/) | Units of work and their evidence contracts. |
| `M` | [`methodology/`](methodology/) | How work is conducted: review, audit, deferral. |
| `S` | [`style/`](style/) | How artifacts are written. |
| `P` | [`patterns/`](patterns/) | Recurring solutions. |
| `K` | [`skills/`](skills/) | Executable operator capability. |
| `MREQ` | [`backlog/`](backlog/) | Deferred requirements, each carrying a revival trigger. |
| - | [`bundles/`](bundles/README.md) | Skills composed into operator-facing roles, by declared edge rather than by name. |
| `C` | [`schemas/`](schemas/) | Machine-verifiable entity contracts, validatable without importing a runtime. |
| - | [`tools/`](tools/README.md) | The scripts that hold the corpus to its own rules. |
| - | [`plugins/`](plugins/README.md) | Operator-facing artifacts that run inside a specific agent host. |

**Identity is stable and never reused.**\
A replaced entry keeps its ID and flips `status`, and the replacement carries `supersedes`.\
[`INDEX.md`](INDEX.md) is the flat ledger across every category.

**Composition is expressed as edges, not as names.**\
A skill declares what it requires and what it composes; depth is derived from the graph.\
Encoding hierarchy into a name freezes it and it rots on the first change.

**Enforcement lives with the corpus.**\
[`tools/`](tools/) carries the checkers, so a clone anywhere can verify itself.\
A rule that becomes mechanically checkable moves into a script, leaving only its name behind.

**Admission is a test, not a preference.**\
Could a different team, on different hardware, in a different problem domain, follow this directly?\
If no, it belongs in the project repository.

Three further admission rules, each of which has been broken here:

- **No point-in-time content.** No current state of anything, no as-of dates, no version pins in prose. Qualify a version rather than fixing it.
- **Every entry derives from a real finding.** Codify what has been proven, not what sounds correct. Speculation admitted once is indistinguishable from evidence later.
- **Examples are generic.** Write the shape, not the incident. Project-specific phrasing belongs in the project repository.

---

## Rationale

An organisation staffed by humans accumulates practice in heads.\
An organisation staffed by agents cannot, because its workers start cold and retain nothing between sessions.

Institutional memory therefore has to be external, or it does not exist.\
That much follows from [`A0`](axioms/A0-sovereign-intelligence-engine.md) and [`A14`](axioms/A14-compounding-learning.md).

External is not sufficient.\
A specification an agent cannot route through is not reachable, and one it cannot verify against is not trustworthy.\
So the corpus is addressable, routable and checkable, which is [`A2`](axioms/A2-isomorphic-specification.md) applied to the organisation itself: the specification is the system.

Composition rather than enumeration is [`A3`](axioms/A3-sovereign-composition.md).\
An enumerated table of every valid role, work-type and domain triple freezes a many-to-many relation and dies on the first role that wears two hats.\
Generating from axes survives that.

The corpus is expected to change itself.\
Friction surfaced during work becomes an entry, per [`A10`](axioms/A10-autopoietic-evolution.md), and fidelity of capture is governed by [`A4`](axioms/A4-zero-loss-knowledge.md).

---

## Faults

Named failure modes for this corpus.\
Each one has occurred.

- **The dump.** Content admitted because it was written, not because it passed the admission test. The corpus grows and its signal falls.
- **The forked constraint.** A rule restated in a second place instead of referenced. Both copies read as authoritative and they drift silently.
- **The typed index.** A ledger maintained by hand rather than derived from the entries. It omits what nobody remembered to add, and nothing detects the omission.
- **The unreachable entry.** Correct, addressable, and carrying no trigger. It is found only by someone who already knew it existed.
- **The broken axis.** A layer stops composing, so work is hand-authored instead of generated, and the taxonomy becomes decoration.
- **The drifted specification.** The corpus and the running system disagree, and the corpus is the one nobody checks.
- **The local rule.** Project-specific content wearing a cross-project ID. It fails the first time anyone else applies it.
- **The unread checker.** A rule shipping a verification command that nothing ever runs.

---

## Success signals

- Every entry resolves from its ID, and every internal link resolves.
- Every entry carries a trigger, and an agent can decide whether to open it without opening it.
- Indexes are generated from entries, so an omission is impossible rather than merely rare.
- The checkers in [`tools/`](tools/) pass against the corpus that publishes them.
- A fresh clone on an unrelated host validates itself with no configuration.
- Work is composed from the axes rather than authored by hand.

---

## Adding an entry

1. Copy [`_template.md`](_template.md) into the category folder.
2. Take the next free ID in that category, checking [`INDEX.md`](INDEX.md).
3. Fill in the frontmatter and body. Frontmatter is machine-parseable and is validated by the contract in [`schemas/`](schemas/).
4. State the trigger. An entry without one is unreachable.
5. Add the entry to [`INDEX.md`](INDEX.md) and to the category's own README.
6. Run the checkers in [`tools/`](tools/).

Body sections stay close to rule, rationale, examples, and when to apply.\
Axiom entries take a different shape, described in [`axioms/README.md`](axioms/README.md).

---

## Referencing from a project repository

Link back rather than duplicate.\
A project cites the entry ID where it applies the rule, so the rule keeps one home and the project keeps its own context.
