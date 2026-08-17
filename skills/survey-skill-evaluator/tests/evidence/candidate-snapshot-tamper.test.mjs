import assert from "node:assert/strict";
import test from "node:test";
import {
  validateCandidateSnapshot,
} from "../../source/executables/orchestrator/index.mjs";
import {
  makeCandidateCapture,
} from "../helpers/candidate-capture-fixture.mjs";

test("candidate snapshot validation rejects a forged inventory root", async () => {
  const fixture = await makeCandidateCapture();
  try {
    const tampered = structuredClone(fixture.captured.snapshot);
    tampered.candidatePackageRoot = "0".repeat(64);
    await assert.rejects(
      validateCandidateSnapshot({
        snapshot: tampered,
        payloadRoot: fixture.captured.payloadRoot,
      }),
      /inventory does not match its exact payload/u,
    );
  } finally {
    await fixture.cleanup();
  }
});
