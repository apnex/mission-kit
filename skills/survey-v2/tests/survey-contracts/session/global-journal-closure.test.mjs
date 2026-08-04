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

  const changedRecord = structuredClone(session);
  changedRecord.journal[1].recordDigest = digest("0");
  assert.ok(
    validateSessionSemantics(changedRecord).some(
      (item) => item.code === "JOURNAL_RECORD_DIGEST_MISMATCH"
    )
  );
});
