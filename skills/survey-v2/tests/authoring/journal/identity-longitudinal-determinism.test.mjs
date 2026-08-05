import assert from "node:assert/strict";
import test from "node:test";
import {
  compileJournalIdentityPort,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  errorCode,
  makeEvidenceJournalScenario,
} from "./support.mjs";

test("identity determinism remains pinned across later invocations", () => {
  const { identity } = makeEvidenceJournalScenario();
  let invocation = 0;
  const initial = identity.identity.genesisChainDigest();
  const identityPort = {
    ...identity.identityPort,
    genesisChainDigest: () => {
      invocation += 1;
      return invocation <= 2
        ? initial
        : `sha256:${"f".repeat(64)}`;
    },
  };
  const compiled = compileJournalIdentityPort({
    identityBinding: identity.identityBinding,
    identityScope: identity.identityScope,
    identityPort,
  });

  assert.equal(
    errorCode(() => compiled.genesisChainDigest()),
    "JOURNAL_IDENTITY_NONDETERMINISTIC",
  );
});
