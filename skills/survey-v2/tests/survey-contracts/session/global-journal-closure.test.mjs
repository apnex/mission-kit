import assert from "node:assert/strict";
import test from "node:test";
import {
  journalRecordDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  sessionGenesisRevisionState,
  sessionGenesisSealDigest,
  validateSessionSemantics
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  attachJournal,
  makeJournalRecord,
  makeSession
} from "../../fixtures/survey/session-v2/session-factory.mjs";

const digest = (character) => `sha256:${character.repeat(64)}`;

function journalSession() {
  const session = makeSession();
  const semanticStateDigest =
    session.authoring.workspace.spec.integrity.semanticStateDigest;
  return attachJournal(session, [
    makeJournalRecord({
      commitId: "commit-1",
      ordinal: 1,
      before: {
        semanticRevision: 0,
        evidenceRevision: 0,
        semanticStateDigest
      },
      after: {
        semanticRevision: 0,
        evidenceRevision: 1,
        semanticStateDigest
      }
    }),
    makeJournalRecord({
      commitId: "commit-2",
      ordinal: 2,
      before: {
        semanticRevision: 0,
        evidenceRevision: 1,
        semanticStateDigest
      },
      after: {
        semanticRevision: 0,
        evidenceRevision: 2,
        semanticStateDigest: "$workspace"
      }
    })
  ]);
}

function unrelatedEdgeJumpSession() {
  const session = makeSession({
    authoringState: "survey_frame_required",
    phaseState: "round_1_drafting"
  });
  const before = sessionGenesisRevisionState(session);
  return attachJournal(session, [
    makeJournalRecord({
      commitId: "unrelated-runtime-open",
      ordinal: 1,
      commitKind: "transition",
      before,
      after: {
        semanticRevision: 1,
        evidenceRevision: 1,
        semanticStateDigest: "$workspace"
      },
      machineEdges: [{
        machineId: "runtime",
        transitionId: "RT01",
        fromState: "start",
        eventId: "OPEN_SESSION",
        toState: "rehydrating",
        beforeStateDigest: digest("6"),
        afterStateDigest: digest("7")
      }],
      idempotencyMachine: "runtime",
      idempotencyKey: "unrelated-runtime-open"
    })
  ]);
}

test("the v2 session journal closes its commit revision, length, ordinal sequence, and referenced records", () => {
  const session = journalSession();
  assert.deepEqual(validateSessionSemantics(session), []);

  const wrongLength = structuredClone(session);
  wrongLength.commitRevision = 1;
  assert.ok(
    validateSessionSemantics(wrongLength).some(
      (item) => item.code === "SESSION_COMMIT_REVISION_MISMATCH"
    )
  );

  const wrongOrdinal = structuredClone(session);
  wrongOrdinal.journal[1].ordinal = 4;
  wrongOrdinal.journal[1].recordDigest =
    journalRecordDigest(wrongOrdinal.journal[1]);
  assert.ok(
    validateSessionSemantics(wrongOrdinal).some(
      (item) => item.code === "SESSION_JOURNAL_ORDINAL_MISMATCH"
    )
  );

  const brokenChain = structuredClone(session);
  brokenChain.journal[1].before.evidenceRevision = 0;
  brokenChain.journal[1].recordDigest =
    journalRecordDigest(brokenChain.journal[1]);
  assert.ok(
    validateSessionSemantics(brokenChain).some(
      (item) => item.code === "SESSION_JOURNAL_REVISION_DISCONTINUITY"
    )
  );

  const wrongGenesisSeal = structuredClone(session);
  wrongGenesisSeal.journal[0].previousSealDigest = digest("a");
  wrongGenesisSeal.journal[0].recordDigest =
    journalRecordDigest(wrongGenesisSeal.journal[0]);
  assert.ok(
    validateSessionSemantics(wrongGenesisSeal).some(
      (item) => item.code === "SESSION_JOURNAL_GENESIS_SEAL_MISMATCH"
    )
  );

  const wrongSealLink = structuredClone(session);
  wrongSealLink.journal[1].previousSealDigest = digest("b");
  wrongSealLink.journal[1].recordDigest =
    journalRecordDigest(wrongSealLink.journal[1]);
  assert.ok(
    validateSessionSemantics(wrongSealLink).some(
      (item) => item.code === "SESSION_JOURNAL_SEAL_CHAIN_MISMATCH"
    )
  );

  const spliced = structuredClone(session);
  spliced.journal[0].payloadDigest = digest("c");
  spliced.journal[0].recordDigest =
    journalRecordDigest(spliced.journal[0]);
  assert.ok(
    validateSessionSemantics(spliced).some(
      (item) => item.code === "SESSION_JOURNAL_SEAL_CHAIN_MISMATCH"
    )
  );

  const truncated = structuredClone(session);
  truncated.journal.shift();
  truncated.commitRevision = 1;
  truncated.journal[0].ordinal = 1;
  truncated.journal[0].previousSealDigest =
    sessionGenesisSealDigest(truncated);
  truncated.journal[0].recordDigest =
    journalRecordDigest(truncated.journal[0]);
  assert.ok(
    validateSessionSemantics(truncated).some(
      (item) => item.code === "SESSION_JOURNAL_GENESIS_STATE_MISMATCH"
    )
  );

  const changedRecord = structuredClone(session);
  changedRecord.journal[1].recordDigest = digest("0");
  assert.ok(
    validateSessionSemantics(changedRecord).some(
      (item) => item.code === "JOURNAL_RECORD_DIGEST_MISMATCH"
    )
  );

  const unrelatedJump = unrelatedEdgeJumpSession();
  const unrelatedJumpIssues = validateSessionSemantics(unrelatedJump);
  assert.ok(
    unrelatedJumpIssues.some(
      (item) => item.code === "SESSION_MACHINE_EDGE_GENESIS_MISMATCH"
    ),
    "an unrelated first edge cannot invent a pre-genesis machine occurrence"
  );
  assert.equal(
    unrelatedJumpIssues.filter(
      (item) => item.code === "SESSION_MACHINE_EDGE_FINAL_STATE_MISMATCH"
    ).length,
    2,
    "persisted authoring and phase states must each be reached by their own journal edges"
  );
});
