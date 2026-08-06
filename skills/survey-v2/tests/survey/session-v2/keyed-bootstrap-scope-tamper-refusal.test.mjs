import assert from "node:assert/strict";
import test from "node:test";
import {
  readdir,
  writeFile,
} from "node:fs/promises";
import {
  sessionBootstrapClosureDigest,
  validateSessionSemantics,
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  readCandidateSessionPublicRoot,
  sealSurveySessionRoot,
} from "../../../source/authoring/survey/session-store-adapter.mjs";
import {
  candidateSelector,
  createPersistentCandidate,
  readSessionBytes,
  sessionBytes,
} from "./support.mjs";

function isInitializationBoundaryMismatch(error) {
  assert.equal(
    error?.code,
    "SURVEY_SESSION_INITIALIZATION_BOUNDARY_MISMATCH",
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
    assert.throws(
      () => sessionBootstrapClosureDigest(tampered),
      isInitializationBoundaryMismatch,
    );
    const resealed = sealSurveySessionRoot(tampered);
    await writeFile(
      harness.sessionFile,
      sessionBytes(resealed),
    );
    const attackerBytes = await readSessionBytes(harness);
    const attackerEntries = await readdir(
      harness.runDirectory,
    );

    assert.ok(
      validateSessionSemantics(resealed).some(
        ({ code }) =>
          code ===
            "SURVEY_SESSION_INITIALIZATION_BOUNDARY_MISMATCH",
      ),
    );
    await assert.rejects(
      readCandidateSessionPublicRoot({
        runDirectory: harness.runDirectory,
        selector: candidateSelector,
      }),
      isInitializationBoundaryMismatch,
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
