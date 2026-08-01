import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  applySurveyCommand,
  createSurveySession
} from "../../source/executables/runtime/lib/engine.mjs";
import { surveyRoot } from "../fixtures/root.mjs";
import {
  dependencyRepository
} from "../fixtures/dependency-fixture.mjs";
import {
  host,
  proposer
} from "../fixtures/runtime-fixture.mjs";

test("typed dependency hooks resolve, block and retry without semantic injection", async () => {
  const sessionsRoot = await mkdtemp(path.join(os.tmpdir(), "survey-v2-retry-sessions-"));
  const repository = await dependencyRepository();
  try {
    const created = await createSurveySession(surveyRoot, {
      slug: "typed-retry",
      sessionId: "typed-retry-session",
      workItem: "Capture dependency retry intent.",
      outcomeAxes: ["quality"],
      directorRef: "director-fixture",
      proposerRef: "proposer-fixture",
      sessionsRoot,
      axiomCorpus: true
    });
    assert.equal(created.session.phase, "initializing");
    assert.equal(created.session.runtimeStatus, "blocked_recoverable");
    const remediation = {
      type: "host-registry-rebind",
      attemptId: "typed-retry-session:binding:2",
      registryId: "test-host-registry",
      dependencyId: created.session.dependencies.plan[0]
    };
    await assert.rejects(
      applySurveyCommand(surveyRoot, created.runDirectory, {
        event: "RETRY",
        eventId: "typed-retry:injection",
        expectedRevision: created.session.revision,
        payload: {
          remediation: {
            ...remediation,
            snapshot: { attacker: true }
          }
        }
      }, host(), { registry: repository.registry }),
      (error) => error.code === "REMEDIATION_INVALID"
    );
    let result = await applySurveyCommand(surveyRoot, created.runDirectory, {
      event: "RETRY",
      eventId: "typed-retry:RT05",
      expectedRevision: created.session.revision,
      payload: { remediation }
    }, host(), { registry: repository.registry });
    const receipt = result.session.dependencies.resolverReceipts.at(-1);
    assert.equal(receipt.applicability, "applicable");
    result = await applySurveyCommand(surveyRoot, created.runDirectory, {
      event: "REHYDRATION_PASS",
      eventId: "typed-retry:RT06",
      expectedRevision: result.session.revision,
      payload: {}
    }, host());
    await assert.rejects(
      applySurveyCommand(surveyRoot, created.runDirectory, {
        event: "COMPLETE_INITIALIZATION",
        eventId: "typed-retry:T41-injection",
        expectedRevision: result.session.revision,
        payload: {
          resolverReceiptId: receipt.receiptId,
          initializationOutput: { attacker: true }
        }
      }, proposer()),
      (error) => error.code === "INITIALIZATION_COMMAND_INVALID"
    );
    result = await applySurveyCommand(surveyRoot, created.runDirectory, {
      event: "COMPLETE_INITIALIZATION",
      eventId: "typed-retry:T41",
      expectedRevision: result.session.revision,
      payload: { resolverReceiptId: receipt.receiptId }
    }, proposer());
    assert.equal(result.session.phase, "initialized");
    assert.equal(result.session.dependencies.outputs.initResolve.resultDigest, receipt.resultDigest);
    assert.equal(JSON.stringify(result.session).includes(repository.root), false);
  } finally {
    await repository.cleanup();
    await rm(sessionsRoot, { recursive: true, force: true });
  }
});
