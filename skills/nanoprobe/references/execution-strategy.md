# Execution strategy

How to size and decompose a nanoprobe so it actually finishes. The main
SKILL.md describes WHAT to produce; this doc describes HOW to get there
without burning the budget.

## Execution-tier triage (run this BEFORE step 1 of the workflow)

| Tier | Signal | Pattern |
|---|---|---|
| **Small** | <5k LOC OR <5 subsystems OR single-file library | Single inline pass — do it yourself, turn by turn, in-context. |
| **Medium** | 5-50k LOC OR 5-15 subsystems | Single subagent shot with inlined scaffold + explicit incremental-write discipline. |
| **Large** | 50k+ LOC OR 15+ subsystems OR monorepo with package boundaries | Decomposed multi-shot pattern (below). |

Signals are OR — any one triggers the larger tier. When in doubt, go up
one tier; the cost of over-decomposing is small (extra synthesis overhead),
the cost of under-decomposing is a 10-minute timeout with zero files
written.

Use `search_files(target='files')` + `wc -l` over `src/` (or equivalent) to
get LOC; eyeball the top-level subdirs for subsystem count.

## The decomposed pattern (Large tier)

Five subagent shots. Shot 1 + shot 5 sequential; shots 2-4 parallel.

### Shot 1 — Scaffolding (sequential, blocking)

**Inputs:**
- canonical repo URL + pinned SHA + local clone path
- domain folder + goals doc content (verbatim, not by reference)
- output skeleton already created (parent does this before delegation)

**Work:**
- Survey repo structure + verify license
- Read README + docs/ in one pass
- Produce probe plan (step 4 of main workflow) AND WRITE IT to a known
  path (e.g. `<output-folder>/_probe-plan.md` — underscore-prefixed so
  it's distinguishable from final artefacts; can be deleted at the end)
- Produce sources.md skeleton (URLs, sections, retrieval dates)
- Produce feature filename inventory (empty files in `features/` created
  by the parent ahead of time, OR shot 1 emits the list and parent
  creates them)

**Deliverable:** `_probe-plan.md` + populated `sources.md` skeleton +
`features/<name>.md` empty stubs.

### Shots 2, 3, 4 — Path probes (PARALLEL)

One shot per code path (so 2-4 shots depending on probe plan). Each shot
gets:
- The probe plan from shot 1
- ITS assigned code path (file list — used as READING ORDER, not output
  structure)
- ITS assigned features (subset of features/<name>.md to populate)
- ITS assigned section(s) of the substrate-architecture (e.g. shot 2
  owns subsystems A+B in `02-architecture.md`, shot 3 owns C+D, etc.)
- The same "no cross-substrate references" + substrate-native vocabulary
  constraints
- The output templates inlined (not by skill_view reference)

**Deliverables per shot:**
- Its assigned sections of `02-architecture.md` — substrate-shaped
  (subsystems / primitives / topology), NOT a path-walk. Use section
  markers like `<!-- BEGIN SUBSYSTEM:deriver -->` ...
  `<!-- END SUBSYSTEM:deriver -->` so synthesis can reassemble.
  Tier 1+2 only — strip all interpretation, that goes to assessment.
- Its features/<name>.md files fully triangulated (Tier 1+2 with
  labelled Tier 3 in "Behaviour notes" only)
- Its assessment entries appended to a scratch `_shot-N-assessments.md`
  for shot 5 to merge into `04-assessment.md`
- Appended rows to sources.md (or its own section to be merged)

The code path is the shot's READING ORDER. The deliverable shape is
the substrate's architecture. See pitfall #16 in SKILL.md.

### Shot 5 — Synthesis (sequential, blocking)

**Inputs:** all shot 2-4 outputs in place on disk, including scratch
`_shot-N-assessments.md` fragments.

**Work:**
- Reassemble `02-architecture.md` sections in substrate-architectural
  order (NOT shot order — the substrate's own organisation: runtime
  topology → subsystems → primitives → storage → pluggable surfaces).
  Strip any Tier 3 interpretation that leaked through; move it to
  `04-assessment.md`.
- Merge `_shot-N-assessments.md` fragments into `04-assessment.md` with
  consistent dating and A1/A2/... numbering. Resolve duplicates.
- Write 03-mapping.md (G1-Gn against discovered features)
- Write 00-summary.md LAST (per main workflow step 10)
- Run the verification checklist
- Delete `_probe-plan.md` and `_shot-N-assessments.md` scratch files
  (work-docs, not final artefacts)

**Deliverable:** complete probe ready for review + commit.

## Subagent context-passing checklist

When delegating a probe shot (any tier), the context block MUST include:

- [ ] Canonical repo URL + pinned SHA (full + short)
- [ ] Local clone path (already prepared by parent)
- [ ] Domain folder absolute path + output destination absolute path
- [ ] Goals doc content **inlined verbatim** — not "read from path X"
- [ ] Substrate-native vocabulary lock (terms to preserve)
- [ ] OUT-OF-SCOPE directories list (with reason)
- [ ] OUT-OF-SCOPE constraints (no commits, no cross-substrate refs, etc.)
- [ ] Expected deliverables with absolute paths
- [ ] Per-shot: the slice of work it owns (path N + features X,Y,Z)
- [ ] Templates inlined verbatim (NOT by skill_view reference — see below)
- [ ] SKILL.md content inlined verbatim if the skill was created/patched
      this session

## Skill loader cache — the critical gotcha

The skill registry is loaded at session start and cached. A skill that
was **created or patched mid-session** is NOT visible via `skill_view` or
`skills_list` for the rest of that session, NOR for any subagent spawned
from it. The subagent's `skill_view('nanoprobe')` will return stub-shaped
content with no body.

**Workaround:** when you need to use a fresh / patched skill in the same
session you authored it:

1. Read the skill files directly from disk
   (`/opt/data/skills/<category>/<name>/`)
2. Concatenate SKILL.md + all references + all templates into a single
   bundle (~30-50k chars typical)
3. Inline the bundle into the subagent's context block under a clear
   header like "NANOPROBE METHODOLOGY (INLINED FROM <path>) — skill_view
   will not work in your session, do not call it"
4. Explicitly instruct the subagent NOT to call `skill_view` for this skill

This is heavy but it's the only reliable way to use a same-session skill
update. Next session the loader picks up the changes and normal
`skill_view` calls work.

## Incremental-write discipline (all tiers)

The failure mode that burns subagent budgets is: read source for 9
minutes, batch-write at the end, hit the timeout, deliver zero files.

Rules:
- Write `02-architecture.md`'s section for subsystem N as soon as you
  finish reading enough of it to describe it. Don't wait until all
  subsystems are read.
- Write each `features/<name>.md` file the moment you have triangulated
  it. Don't queue them.
- Append assessment entries to your scratch `_shot-N-assessments.md`
  as you spot them — interpretation captured at the moment of discovery
  is sharper than reconstructed-from-notes interpretation later.
- Write to disk frequently. Saved partial output is recoverable; lost
  in-context state is not.

For inline (small-tier) execution this is less critical because the
parent agent sees turn boundaries naturally. For subagent shots it's
load-bearing.

## When NOT to decompose

- Substrate is small enough for inline (small tier)
- You haven't done a probe in this domain before — single inline pass
  surfaces methodology friction better than parallelised subagents
- The goals doc is still in flux — decomposition assumes stable
  mapping criteria
