import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  createSurveySession,
  retrySurveyInitialization
} from "../../source/executables/runtime/lib/engine.mjs";
import { dependencyRepository } from "../fixtures/dependency-fixture.mjs";
import { host } from "../fixtures/runtime-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("axiom stages bind complete interpretations to one frozen session snapshot", async () => {
  const sessionsRoot = await mkdtemp(path.join(os.tmpdir(), "survey-v2-stage-sessions-"));
  const repository = await dependencyRepository();
  try {
    const created = await createSurveySession(surveyRoot, {
      slug: "stage-binding",
      sessionId: "stage-binding-session",
      workItem: "Capture stage binding intent.",
      outcomeAxes: ["quality"],
      directorRef: "director-fixture",
      proposerRef: "proposer-fixture",
      sessionsRoot,
      axiomCorpus: true
    });
    const result = await retrySurveyInitialization(surveyRoot, created.runDirectory, {
      eventIdPrefix: "stage-binding",
      expectedRevision: created.session.revision,
      registry: repository.registry,
      attemptId: "stage-binding-session:binding:2",
      registryId: "test-host-registry"
    }, host());
    const output = result.session.dependencies.outputs.initResolve;
    assert.deepEqual(output.remainingStages, [
      "commit-r1",
      "commit-r2",
      "pre-candidate",
      "rehydrate"
    ]);
    assert.equal(output.snapshot.aggregateDigest, result.session.dependencies.resolverReceipts.at(-1).snapshot.aggregateDigest);
    const proof = result.session.dependencies.rehydrationOutputs.at(-1);
    assert.equal(proof.initializationResultDigest, output.resultDigest);
    assert.equal(proof.frozenSnapshotDigest, output.snapshot.aggregateDigest);
  } finally {
    await repository.cleanup();
    await rm(sessionsRoot, { recursive: true, force: true });
  }
});
