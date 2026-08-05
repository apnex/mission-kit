import assert from "node:assert/strict";
import test from "node:test";
import {
  readdir,
  writeFile,
} from "node:fs/promises";
import {
  journalIdentityScopeDigest,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  sessionBootstrapClosureDigest,
  validateSessionSemantics,
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  readCandidateSessionPublicRoot,
  readVerifiedCandidateSession,
  sealSurveySessionRoot,
} from "../../../source/authoring/survey/session-store-adapter.mjs";
import {
  authenticationKey,
  candidateSelector,
  createPersistentCandidate,
  readSessionBytes,
  sessionBytes,
} from "./support.mjs";

function isKeyedBindingMismatch(error) {
  assert.equal(
    error?.code,
    "SURVEY_SESSION_IDENTITY_BINDING_MISMATCH",
  );
  return true;
}

test(
  "an attacker cannot authorize a changed bootstrap by recomputing only public digests",
  async (testContext) => {
    const harness = await createPersistentCandidate(
      testContext,
    );
    const tampered = structuredClone(harness.session);
    tampered.dependencies.resolverReceipts[0].resultDigest =
      `sha256:${"7".repeat(64)}`;
    const scope =
      tampered.authoring.persistence.identityScope;
    scope.adapterScope.bootstrapClosureDigest =
      sessionBootstrapClosureDigest(tampered);
    tampered.authoring.persistence.identityBinding.scopeDigest =
      journalIdentityScopeDigest(scope);
    const resealed = sealSurveySessionRoot(tampered);
    await writeFile(
      harness.sessionFile,
      sessionBytes(resealed),
    );
    const attackerBytes = await readSessionBytes(harness);
    const attackerEntries = await readdir(
      harness.runDirectory,
    );

    assert.deepEqual(
      validateSessionSemantics(resealed),
      [],
    );
    await readCandidateSessionPublicRoot({
      runDirectory: harness.runDirectory,
      selector: candidateSelector,
    });
    await assert.rejects(
      readVerifiedCandidateSession({
        runDirectory: harness.runDirectory,
        selector: candidateSelector,
        authenticationKey,
      }),
      isKeyedBindingMismatch,
    );

    assert.deepEqual(
      await readSessionBytes(harness),
      attackerBytes,
    );
    assert.deepEqual(
      await readdir(harness.runDirectory),
      attackerEntries,
    );
    assert.equal(
      attackerEntries.includes("session.lock"),
      false,
    );
  },
);
