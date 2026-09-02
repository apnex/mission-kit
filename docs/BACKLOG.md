# mission-kit - backlog

The durable record of what this corpus has found about itself and not yet done.

An [`AR5`](../artifacts/AR5-backlog.md) instance, held by the corpus that publishes the type.\
It is the record; a board, when one exists, will be the plan.

**This is not [`backlog/`](../backlog/README.md).**\
That layer holds `MREQ` entries - addressable, routable catalogue entries requesting a future mission, citable from anywhere in the corpus.\
A row here is a project-local finding about mission-kit, with evidence and a trigger, and is not addressable outside this file.\
Whether the two should remain separate is itself row `B14`.

---

## Adding a row

A row is required whenever a finding about this corpus is made and not acted on in the same change.\
That includes a defect found and deferred, a design question surfaced and parked, and a decision taken that leaves consequent work.

Every row carries:

- an `id`, stable and never reused, so a board and other records can cite it;
- the finding, stated so it can be scored rather than merely recognised;
- **cited evidence** - a path, a line, or the command that establishes it. An assertion is not evidence, and a row that cites none is rejected;
- a state, and a **revival trigger** naming an observable condition unless the state is closed.

Explicit deferral is permitted; silence is not.\
Revival re-triages rather than resumes: when a trigger fires the row returns to intake and is re-examined against the world as it is then.

---

## Open

| id | finding | evidence | revival trigger |
|---|---|---|---|
| **B1** | **The corpus prescribes a document set it does not hold.** No `VISION.md`, no `docs/` tree, no architecture, no board. It published a placement rule and a bootstrap methodology and is non-conformant with both. `AR0` names this fault itself: *the drifted specification - the corpus and the running system disagree, and the corpus is the one nobody checks.* | `[V, ls *.md returns AGENTS/INDEX/README/_template/_template-standing-context only; docs/ absent before this file; artifacts/README.md "Where instances live"; methodology/M8-artifact-bootstrap.md]` | **Open.** Vision, backlog and architecture now exist at prescribed addresses. Closes when a board exists and the set is conformant. |
| **B2** | **No canonical instance filenames are prescribed.** `AR0` fixes the tree - `VISION.md` at component root, everything else under `docs/` - but only `VISION.md` appears as a literal, and it appears inside a diagram rather than as a statement. The other five types have no prescribed filename; `AR3`'s template gives the H1 `# <system> - board` and never names the file. Two adopters independently chose `ARCHITECTURE.md`, `BOARD.md`, `DECISIONS.md`, which is convention rather than rule. | `[V, grep -nE 'VISION\|docs/\|filename' artifacts/AR[1-6]*.md returns nothing; artifacts/README.md holds the only placement text]` | **Open. TRIGGER: a third adopter names a file differently, or the set entity (`B5`) is authored, whichever is first.** Undecided whether filenames belong per-entry or in one table read by all. |
| **B3** | **No set declares the territory it claims to cover, so no set can find its own gaps.** `A0` declares the axioms orthogonal and conjunctive - which detects redundancy and cannot detect absence. Orthogonality asks whether members overlap, never whether they span. Measured across 13 charters, none states a denominator. | `[V, axioms/README.md "How the set composes"; charter section census - no charter carries a coverage or territory section]` | **Open. TRIGGER: any set is asked whether it is complete and the question is unanswerable, or `B5` lands.** |
| **B4** | **Charters have no shared shape and each reinvents what a charter covers.** Measured across 13 layer READMEs: `What earns an entry` appears in 5, `Faults` in 8, `Index` in 8, an axiom-alignment section in 3, and no charter carries a body-shape section at all. The two most load-bearing concerns - admission and member shape - are the least consistently present. | `[V, section census over */README.md: 5/13, 8/13, 8/13, 3/13, 0/13]` | **Open. TRIGGER: `B5` lands, or a fourteenth layer is added and reinvents the shape again.** |
| **B5** | **"Set" is an undefined term the corpus leans on.** A set owns how members inter-relate, how the population changes, where members live and what shape they take; a member owns what it is and why. Nothing states the split, which is why 13 charters diverged. Sets nest - a parent registers a child and delegates governance entirely, rather than the child inheriting - and a set can be smaller than a layer. `category` already functions as a set-membership pointer that nobody calls one and that resolves to nothing a reader can open. | `[V, entities/README.md E0 trigger "two readers could act differently on the same sentence"; the 13-charter divergence in B4 is that divergence realised; E2 defines layer and cannot express nesting]` | **Open. TRIGGER: a sub-set is authored under `docs/`, or a charter is written and its shape has to be invented again.** |
| **B6** | **A member cannot state its own canonical name, because naming is a set property it has no way to reference.** Read in isolation an entry answers what it is and why, and cannot answer what it is called as an instance or what set governs it. | `[V, artifacts/AR6-vision.md carries no filename statement; no frontmatter field names a governing set]` | **Open. TRIGGER: `B5` lands, since the pointer is a property of the set entity.** |
| **B7** | **`AR2` has no instance naming or ordinal scheme, and a component accumulates many deltas.** Its template gives `# Delta-N - <name> - <shape>` and says nothing about the filename, the directory, or how `N` is allocated. The one programme examined invented two parallel tracks and had to rule on the naming retroactively. | `[V, artifacts/AR2-delta.md Template section; the observed programme carries a ratified decision renaming its delta track after the fact]` | **Open. TRIGGER: this corpus authors its second delta, or `MREQ-8` revives.** |
| **B8** | **`AR1` forbids the hand-authored current projection that a brownfield adopter cannot avoid.** The current instant must be derived from the exit criteria of completed transitions; a project at bootstrap has run none. The one real current-state instance observed is hand-authored and therefore fails `AR1`'s own falsifier, structurally rather than carelessly. | `[V, artifacts/AR1-system-architecture.md line 33 and the falsifier at line 93; the observed programme has zero delta documents and a hand-authored architecture declaring instant: current]` | **Open, and now met.** `docs/ARCHITECTURE.md` is hand-authored, fails `AR1`'s falsifier, and says so in its own opening. The prediction held exactly. **TRIGGER: this corpus runs its first delta, at which point a derived projection becomes possible and the rule can be tested rather than reasoned about.** |
| **B9** | **`AR3` and `AR5` have never been checked against a real instance.** Every other artifact type has been audited against one; these two were reasoned about from the entries alone, which is how `AR5`'s recurrence tier was got wrong and had to be restored. | `[V, session audits covered AR1, AR2, AR4, AR6 against instances; AR5's tier was downgraded on entry-only reasoning and reverted at 02f04ec]` | **Open. TRIGGER: an `AR3` instance becomes available to read.** `AR5` is discharged - this file is one, and authoring it surfaced no defect in the type. `AR3` remains the only artifact type never checked against an instance. |
| **B10** | **`CSSA`/`TSSA` is one downstream programme's vocabulary presented as a corpus convention.** `AR1` says the two projections are *conventionally named* CSSA and TSSA. Measured across the estate, the abbreviation appears in exactly one programme; two others instantiate the concept without it. | `[V, cross-repo grep: 79 files in one programme, zero elsewhere; two further programmes carry current/target documents under other names]` | **Open. TRIGGER: a second programme adopts the abbreviations, or `E`-layer entities are authored for them.** Three options: keep, drop "conventionally", or promote deliberately as entities. |
| **B11** | **`AR6`'s instruction to author from a peer instance has no addressable peer in the corpus.** `AR1` and `AR6` ship no template deliberately and route to `M6`. An external adopter holds nothing, and the instruction resolved only because one downstream repository happens to be public. That is luck rather than portability, in a corpus whose first claimed property is portability. | `[V, artifacts/AR6-vision.md Template section; the peer used in the first external onboarding was reachable only because that repository is public]` | **CLOSED** - this corpus now carries a ratified `VISION.md` at its own root, so `AR6`'s instruction to author from a peer resolves inside the corpus rather than by luck. The peer is reachable at the same address every adopter already fetches from. |
| **B12** | **The recovery methodology for a brownfield vision is unwritten and its reasoning is untested.** *Recover rather than invent*, *expect inconsistency*, *do not soften the vision* were all reasoned in one session and none has survived contact with a repository. `M8` covers the spine; the recovery half is deliberately absent. | `[V, methodology/M8-artifact-bootstrap.md exists; no recovery entry; the reasoning originates in one un-run onboarding prompt]` | **Open. TRIGGER: the first external brownfield adopter reports back.** Waiting is deliberate - their run is the only evidence available and costs nothing. |
| **B13** | **The artifact layer's composition with the work axes is unresolved, and the finding was filed too narrowly.** `MREQ-9` records that no work-type cites an artifact type. The broader truth is that the layer had no procedural surface at all - not work-types, not methodology, not skills. `M8` is now the first methodology entry to cite an artifact type, which weakens `MREQ-9`'s third reading that the layers are correctly independent. | `[V, MREQ-9; grep -l 'AR[0-9]' methodology/*.md returned nothing before M8 and returns M8 now]` | **Open. TRIGGER: `MREQ-9`'s own triggers, plus this evidence.** `MREQ-9` should be amended rather than duplicated. |
| **B14** | **`backlog/` and `AR5` are two different objects wearing one word.** An `MREQ` is an addressable, routable catalogue entry with a `hydrate-when`, citable from anywhere; an `AR5` row is a project-local finding that is neither. Retiring `backlog/` would demote ten routable entries into table rows and break live citations from `AR0`, `AR2` and `MREQ-9`. | `[V, backlog/README.md "deferred requests to run a future mission, not the missions themselves"; MREQ-3 and MREQ-8 cited from artifacts/README.md, artifacts/AR2-delta.md, backlog/mreq-9-*.md]` | **Open. TRIGGER: a board exists to triage it against.** Deliberately deferred - it is a real decision with a real cost, not housekeeping. |

| **B15** | **No decision register.** This corpus prescribes `AR4` to adopters and holds none. Its rulings - the recurrence tier removal, sovereignty as a declared field, placement, the set/charter direction - live in commit messages only, so rationale is recoverable by reading history rather than by citation. `AR4` explicitly permits a register carrier, so the gap is the absence rather than the form. | `[V, ls docs/ returns README, BACKLOG, ARCHITECTURE; artifacts/AR4-decision-record.md admits a register form; the session's rulings appear only in git log]` | **Open. TRIGGER: a ruling is re-litigated because nobody could find why it was taken, or a board item requires citing one.** |

---

## Parked

| id | finding | evidence | revival trigger |
|---|---|---|---|
| - | none yet | - | - |

---

## Retired

| id | finding | reason cut | revives on |
|---|---|---|---|
| - | none yet | - | - |
