import assert from "node:assert/strict";
import test from "node:test";
import {
  compileJournalIdentityPort,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  errorCode,
  makeEvidenceJournalScenario,
} from "./support.mjs";

test("a throwing identity operation is rejected before replay", () => {
  const { identity } = makeEvidenceJournalScenario();
  const identityPort = {
    ...identity.identityPort,
    machineStateDigest: () => {
      throw new Error("ambient failure");
    },
  };
  assert.equal(errorCode(() => compileJournalIdentityPort({
    identityBinding: identity.identityBinding,
    identityScope: identity.identityScope,
    identityPort,
  })), "JOURNAL_IDENTITY_EXECUTION_FAILED");
});
