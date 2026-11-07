# Ledger delivery - 2026-11-03

How the ledger reached, and failed to reach, a Claude Code session, measured; and the loader built from the measurements.\
Evidence for the rulings and backlog rows that cite it.

Every claim below is tagged.\
`[MEASURED]` means a command was run, or a transcript read, and its output is what the sentence says; `[INFERRED]` means neither.\
The probes ran on Claude Code 2.1.317 on Linux, in headless `-p` mode.\
The session they started from ran from 2026-06-06 to 2026-11-03, on versions 2.1.167 to 2.1.316.\
All of it was run and scored by the author of the change, so it is the party's own report in `E8`'s sense until someone else re-runs it; the commands are under *Reproduce*.

---

## The failure

**What the session record shows.**\
`[MEASURED]`, from the session's transcript, read by a fresh reviewer and re-read by the author.

- The workspace's harness settings held no hook of any kind; the only `SessionStart` context the session ever received came from an unrelated plugin's hook, which fired on every compaction.
- The `K3` check did run: on 2026-08-25, four days after the check entered `AGENTS.md`, the agent wrote that it could not name `K3`, concluded the ledger had not reached it, and fetched it.
- The ledger was fetched by hand 9 times between 2026-08-25 and 2026-10-31, each fetch landing in the conversation.
- The session was compacted 242 times over its life. Nothing reloaded the ledger after a compaction.
- On the last day the agent cited an axiom from a one-line paraphrase in a project's own notes, without the ledger and without running the check, and the director caught it.

**What it does not show.**\
Whether the ledger was absent at each of the 242 compactions, and whether the check was skipped at each, was not scanned.\
`[INFERRED]` from the record's shape: a hand-fetched ledger lives in the conversation, which is what compaction rewrites.

**What `AGENTS.md` said.**\
Section 2: *It is normally loaded into context at session start, so it should already be in front of you.*\
`[MEASURED]` The self-check after it is phrased as confirming that load.\
That the phrasing made the check easier to skip is `[INFERRED]`; the check did run once, on the first day.

**A second drift.**\
The workspace's copy of the standing context was one rule behind `main` - the 2026-10-18 addition to section 5.5 - and nothing compared them.\
`[MEASURED]`

---

## What the harness does with a hook's context

Probes registered `SessionStart` hooks emitting known payloads, started a session, and read its transcript's `hook_additional_context` attachments directly.

**A large `additionalContext` is not delivered inline.**\
`[MEASURED]` Payloads of 2,980, 5,980, 8,980 and 9,880 characters arrived whole.\
Payloads of 10,082, 11,982, 14,982 and 19,982 characters were saved to a file, and the context held `Output too large ... Preview (first 2KB)`.\
The cap lies between 9,880 and 10,082 characters.\
The ledger is 33,172 characters, so a loader that injects it whole delivers a 2 KB preview - the ledger's introduction and not one entry row.

**The cap is per hook.**\
`[MEASURED]` Five parts of the ledger, registered as five hooks under the cap, all arrived whole in one session, about 33,000 characters together.

**Parts do not arrive in registration order, and the order varies.**\
`[MEASURED]` Five parts registered 1 to 5 arrived as 2, 4, 3, 5, 1 in one session, and as 2, 4, 3, 5, 1, then 4, 3, 5, 2, 1, then 2, 5, 3, 4, 1 across the deliveries of another.\
That the order is the order in which the hooks finish is `[INFERRED]`.

**Compaction fires `SessionStart` with source `compact`.**\
`[MEASURED]` In the long session, every one of the 242 compactions - 203 automatic, 39 manual - is followed by a `SessionStart:compact` hook run and its context.\
In a probe session, a forced `/compact` re-ran all five registered parts with `event=compact`, recorded in the transcript straight after the compaction boundary.

**`-p` mode delivers `SessionStart` context.**\
`[MEASURED]` That interactive mode does the same is `[INFERRED]` from the long session, which was interactive and recorded `SessionStart:compact` context after every compaction.

---

## The loader, and why it is built this way

`plugins/ledger-loader/` registers one `SessionStart` hook per part, on `startup`, `resume`, `clear` and `compact`.\
Each choice answers a measurement above.

| Choice | Answers |
| --- | --- |
| The ledger is cut at line boundaries into parts of at most 8,000 characters, one part per hook | The cap per hook, with room for each part's header and part 1's drift warnings |
| Every part names the ledger's sha256 and how many parts to expect | Parts from two fetches, if `main` moved between them, would otherwise mix silently, and a missing part would not show |
| Each part not opening on a layer heading restates the heading it continues under | Parts arrive out of order |
| The last part ends with `END-OF-LEDGER` only when every row fits the registered parts, and with `LEDGER-INCOMPLETE` otherwise | A cut-off delivery is otherwise indistinguishable from a whole one |
| A failed fetch, a body not starting `# Index`, or a bad argument puts a warning and the recovery command in context | A loader that fails quietly recreates the original fault |
| Part 1 checks the `CLAUDE.md` files the harness loads against `main`'s `AGENTS.md`, allowing appended local content | The drift between the workspace copy and `main` |
| Every run appends a line to a local log | Whether the loader ran is otherwise visible only in the transcript |

`AGENTS.md` cannot carry any of this: it is harness-neutral by contract.\
Its share of the fix is the check in section 2, which the file can state for every harness.

---

## Results

Fresh sessions were asked, from context alone and without tools, about the ledger.\
`[MEASURED]` The `K3`, sentinel and `A14` cells are the model's answer; the delivery cells are read from the transcript.

| Arm | Runs | Question | `K3` | Sentinel | Delivery, from the transcript |
| --- | --- | --- | --- | --- | --- |
| Whole ledger, one hook | 3 | `K3`, the sentinel, the last row | CANNOT, 3 of 3 | NONE, 3 of 3 | a 2 KB preview, 3 of 3 |
| Split, five hooks | 1 | `K3`, the sentinel, the parts and shas, `A14`'s trigger | `repo-audit - code-grounded repo audit` | quoted exactly | 5 of 5 parts, one sha; `A14`'s trigger quoted exactly |
| Split, five hooks, the README's own commands | 1 | `K3` and the sentinel | `repo-audit - code-grounded repo audit` | quoted exactly | 5 of 5 parts, one sha |
| No hooks, the control | 3 | each of the three questions once | CANNOT, 3 of 3 | NONE, 3 of 3 | none |
| Split, after a forced `/compact`, asked through `--resume` | 1 | `K3`, the sentinel, the events seen | `repo-audit - code-grounded repo audit` | quoted exactly | parts headed `compact` and `resume` |

The compaction row is confounded: the question was asked in a resumed run, which re-delivers every part on its own, so the answer cannot be credited to the `compact` reload.\
What is measured for compaction is the reload itself, recorded straight after the compaction boundary.

The control shows `K3` is not answerable from model knowledge or from `AGENTS.md` in this harness, in 3 runs out of 3.\
That is enough to show the probe can tell the arms apart here, not the rate at which it does.

The five parts as delivered to the session at the shipped cut reassemble to the fetched `INDEX.md`: 242 of 242 non-blank lines equal.\
`[MEASURED]`

---

## What this does not cover

- **Other harnesses.** The loader is a Claude Code plugin; a harness with no loader is defended only by the check in `AGENTS.md`, which is prose. `[INFERRED]`
- **Subagents.** Subagents started in the long session after the loader was installed received no `SessionStart` context. `[MEASURED]` for those; the general case `[INFERRED]`.
- **A hook the harness kills or never runs** puts nothing in context; only the `AGENTS.md` check catches that. `[INFERRED]`
- **Resume cost.** A resume re-delivers all five parts, about 33,000 characters, even when the context already holds the ledger; after a forced `/compact` and a resume, the probe session held both copies. `[MEASURED]`
- **The cap is the harness's, not a contract.** It was measured on one version; a change would show as a missing sentinel. `[INFERRED]`
- **A false pass on `K3`.** The check is self-graded; a model that guesses a plausible title passes it. Its false-pass rate is unmeasured. `[INFERRED]`
- **Whether a ledger loaded at session start survives a compaction** in context without a reload was not probed; the loader reloads it either way. `[INFERRED]`
- **Evaluation runs launched through a configured harness** receive `main`'s ledger, the confound `B40` records; the loader makes that delivery reliable, which makes the confound reliable too. `[INFERRED]`

---

## Reproduce

The probe hook used for the cap, emitting about `n` characters between two markers:
```sh
#!/bin/bash
cat >/dev/null; n=$1; body=$(head -c $((n-40)) /dev/zero | tr '\0' 'y')
jq -n --arg c "START-$n
$body
END-$n" '{hookSpecificOutput:{hookEventName:"SessionStart",additionalContext:$c}}'
```

Register it at several sizes through `--settings`, run `claude -p 'Reply OK.' < /dev/null`, and read the session transcript's `hook_additional_context` attachments: an inline payload carries its `END-` marker, a persisted one begins `<persisted-output>`.

The loader's own checks are its README's *Test* section, run as written for the result above.\
The fuller question, asked with and without `--settings '{"disableAllHooks": true}'`:
```text
Do not use any tools and do not look anything up. Answer from your context only, in exactly four lines.
Line 1: the title of mission-kit ledger entry K3, or CANNOT. Line 2: the END-OF-LEDGER line verbatim, or NONE.
Line 3: how many ledger parts you received and whether their sha256 values all match.
Line 4: the hydrate-when text of entry A14, or CANNOT.
```
