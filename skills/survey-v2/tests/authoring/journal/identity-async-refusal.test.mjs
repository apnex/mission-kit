import assert from "node:assert/strict";
import test from "node:test";
import {
  compileJournalIdentityPort,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  errorCode,
  makeEvidenceJournalScenario,
} from "./support.mjs";

test("an asynchronous identity operation is rejected before replay", () => {
  const { identity } = makeEvidenceJournalScenario();
  const identityPort = {
    ...identity.identityPort,
    genesisChainDigest: async () =>
      `sha256:${"a".repeat(64)}`,
  };
  assert.equal(errorCode(() => compileJournalIdentityPort({
    identityBinding: identity.identityBinding,
    identityScope: identity.identityScope,
    identityPort,
  })), "JOURNAL_IDENTITY_ASYNC_FORBIDDEN");
});
