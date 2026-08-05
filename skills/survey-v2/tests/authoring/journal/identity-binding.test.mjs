import assert from "node:assert/strict";
import test from "node:test";
import {
  compileJournalIdentityPort,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  errorCode,
  makeEvidenceJournalScenario,
} from "./support.mjs";

test("changed runtime code identity is rejected before replay", () => {
  const { identity } = makeEvidenceJournalScenario();
  const identityBinding = {
    ...identity.identityBinding,
    digest: `sha256:${"f".repeat(64)}`,
  };
  assert.equal(errorCode(() => compileJournalIdentityPort({
    identityBinding,
    identityScope: identity.identityScope,
    identityPort: identity.identityPort,
  })), "JOURNAL_IDENTITY_BINDING_MISMATCH");
});
