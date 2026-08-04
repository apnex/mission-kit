import assert from "node:assert/strict";
import test from "node:test";
import {
  journalRecordDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  validateSessionSemantics
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  attachJournal,
  makeJournalRecord,
  makeSession
} from "../../fixtures/survey/session-v2/session-factory.mjs";

const digest = (character) => `sha256:${character.repeat(64)}`;

function coupledSession() {
  const session = makeSession({
    authoringState: "survey_frame_required",
    phaseState: "round_1_drafting"
  });
  return attachJournal(session, [
    makeJournalRecord({
      commitId: "commit-phase-init",
      ordinal: 1,
      commitKind: "transition",
      before: {
        semanticRevision: 0,
        evidenceRevision: 0,
        semanticStateDigest: digest("5")
      },
      after: {
        semanticRevision: 0,
        evidenceRevision: 1,
        semanticStateDigest: digest("5")
      },
      machineEdges: [{
        machineId: "phase",
        transitionId: "T41",
        fromState: "new",
        eventId: "COMPLETE_INITIALIZATION",
        toState: "initialized",
        beforeStateDigest: digest("6"),
        afterStateDigest: digest("7")
      }],
      idempotencyMachine: "phase",
      idempotencyKey: "phase-init-commit"
    }),
    makeJournalRecord({
      commitId: "commit-begin-authoring",
      ordinal: 2,
      commitKind: "transition",
      before: {
        semanticRevision: 0,
        evidenceRevision: 1,
        semanticStateDigest: digest("5")
      },
      after: {
        semanticRevision: 1,
        evidenceRevision: 2,
        semanticStateDigest: "$workspace"
      },
      machineEdges: [
        {
          machineId: "authoring",
          transitionId: "AT01",
          fromState: "new",
          eventId: "BEGIN_SURVEY_AUTHORING",
          toState: "survey_frame_required",
          beforeStateDigest: digest("8"),
          afterStateDigest: digest("9")
        },
        {
          machineId: "phase",
          transitionId: "T02",
          fromState: "initialized",
          eventId: "BEGIN_R1_DESIGN",
          toState: "round_1_drafting",
          beforeStateDigest: digest("7"),
          afterStateDigest: digest("a")
        }
      ],
      idempotencyMachine: "authoring",
      idempotencyKey: "begin-authoring-commit"
    })
  ]);
}

test("the v2 session admits only continuous ordered coupled-machine edges", () => {
  const session = coupledSession();
  assert.deepEqual(validateSessionSemantics(session), []);

  const reversed = structuredClone(session);
  reversed.journal[1].machineEdges.reverse();
  reversed.journal[1].recordDigest = journalRecordDigest(reversed.journal[1]);
  assert.ok(
    validateSessionSemantics(reversed).some(
      (item) => item.code === "SESSION_MACHINE_EDGE_ORDER_INVALID"
    )
  );

  const discontinuous = structuredClone(session);
  discontinuous.journal[1].machineEdges[1].fromState = "new";
  discontinuous.journal[1].recordDigest =
    journalRecordDigest(discontinuous.journal[1]);
  assert.ok(
    validateSessionSemantics(discontinuous).some(
      (item) => item.code === "SESSION_MACHINE_EDGE_DISCONTINUITY"
    )
  );
});
