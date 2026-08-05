import assert from "node:assert/strict";
import test from "node:test";
import {
  compileJournalIdentityPort,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  errorCode,
  makeEvidenceJournalScenario,
} from "./support.mjs";

test("a nondeterministic identity operation is rejected during port compilation", () => {
  const { identity } = makeEvidenceJournalScenario();
  let count = 0;
  const identityPort = {
    ...identity.identityPort,
    genesisChainDigest: () =>
      `sha256:${(count++ % 2 === 0 ? "a" : "b").repeat(64)}`,
  };
  assert.equal(errorCode(() => compileJournalIdentityPort({
    identityBinding: identity.identityBinding,
    identityScope: identity.identityScope,
    identityPort,
  })), "JOURNAL_IDENTITY_NONDETERMINISTIC");
});
