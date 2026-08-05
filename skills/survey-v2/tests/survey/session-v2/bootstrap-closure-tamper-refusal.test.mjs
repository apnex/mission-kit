import assert from "node:assert/strict";
import test from "node:test";
import {
  readdir,
  writeFile,
} from "node:fs/promises";
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

function isBootstrapScopeMismatch(error) {
  assert.equal(
    error?.code,
    "SESSION_JOURNAL_ADAPTER_SCOPE_MISMATCH",
  );
  return true;
}

test(
  "a resealed immutable bootstrap change is rejected before key lookup or runtime replay",
  async (testContext) => {
    const harness = await createPersistentCandidate(
      testContext,
    );
    const tampered = structuredClone(harness.session);
    tampered.dependencies.resolverReceipts[0].resultDigest =
      `sha256:${"6".repeat(64)}`;
    const resealed = sealSurveySessionRoot(tampered);
    await writeFile(
      harness.sessionFile,
      sessionBytes(resealed),
    );
    const attackerBytes = await readSessionBytes(harness);
    const attackerEntries = await readdir(
      harness.runDirectory,
    );

    await assert.rejects(
      readCandidateSessionPublicRoot({
        runDirectory: harness.runDirectory,
        selector: candidateSelector,
      }),
      isBootstrapScopeMismatch,
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
