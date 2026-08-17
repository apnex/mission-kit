import assert from "node:assert/strict";
import test from "node:test";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HASH_PROFILE_ID,
  SchemaValidator,
} from "../../source/executables/engine/index.mjs";
import { LearningProtocol } from "../../source/executables/orchestrator/index.mjs";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");
const digest = "a".repeat(64);

test("ordinary producers cannot claim registered payback-observer authority", async () => {
  const learning = new LearningProtocol({
    schemaValidator: await SchemaValidator.fromPackageRoot(packageRoot),
    registeredObserverAuthorityIds: ["observer-registered"],
  });
  const observation = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    paybackObservationId: "payback-1",
    observerId: "observer-registered",
    observerRegistryRevision: digest,
    idempotencyKey: "payback-1/observe",
    observedAfterLr4Root: digest,
    governedWorkRoot: digest,
    learningInvestmentId: "investment-1",
    conceptPatternKey: "concept-1",
    baselineContractRef: digest,
    counterfactualContractRef: digest,
    measureKind: "avoided_rework",
    nativeMeasure: 2,
    nativeUnit: "hours",
    measurementEvidenceRefs: [digest],
    observerAuthorityClass: "registered_payback_observer",
    authoredPreLcr: true,
    immutable: true,
  };

  assert.throws(
    () =>
      learning.registerPaybackObservation(observation, {
        actorAuthorityId: "ordinary-producer",
      }),
    /Only the registered observer authority/u,
  );
  const registered = learning.registerPaybackObservation(observation, {
    actorAuthorityId: "observer-registered",
  });
  assert.match(registered.paybackObservationRoot, /^[a-f0-9]{64}$/u);

  assert.throws(
    () =>
      learning.buildSourceRequest({
        sourceRequestId: "source-payback-1",
        sourceType: "post_lr4_payback_observation",
        sourceObjectId: "observer-work-1",
        sourceEventDigest: digest,
        sourceSemanticRoot: digest,
        upstreamOutboxId: "outbox-1",
        upstreamOutboxDigest: digest,
        correlationId: "correlation-1",
        producerAuthorityId: "ordinary-producer",
        observerAuthorityId: "ordinary-producer",
        paybackObservationId: "payback-1",
        paybackObservationRoot: registered.paybackObservationRoot,
      }),
    /registered observer authority/u,
  );
  const request = learning.buildSourceRequest({
    sourceRequestId: "source-payback-1",
    sourceType: "post_lr4_payback_observation",
    sourceObjectId: "observer-work-1",
    sourceEventDigest: digest,
    sourceSemanticRoot: digest,
    upstreamOutboxId: "outbox-1",
    upstreamOutboxDigest: digest,
    correlationId: "correlation-1",
    producerAuthorityId: "observer-source-projector",
    observerAuthorityId: "observer-registered",
    paybackObservationId: "payback-1",
    paybackObservationRoot: registered.paybackObservationRoot,
  });
  assert.equal(request.request.immutable, true);
  assert.equal(request.request.targetOperation, "LC02");
});
