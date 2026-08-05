import assert from "node:assert/strict";
import test from "node:test";
import {
  compileJournalIdentityPort,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  errorCode,
  makeEvidenceJournalScenario,
} from "./support.mjs";

test("genesis authority comes from the immutable scope rather than terminal Workspace", () => {
  const { identity } = makeEvidenceJournalScenario();
  const identityScope = structuredClone(identity.identityScope);
  identityScope.genesisRevisionState.evidenceRevision = 9;
  assert.equal(errorCode(() => compileJournalIdentityPort({
    identityBinding: identity.identityBinding,
    identityScope,
    identityPort: identity.identityPort,
  })), "JOURNAL_IDENTITY_SCOPE_DIGEST_MISMATCH");
});
