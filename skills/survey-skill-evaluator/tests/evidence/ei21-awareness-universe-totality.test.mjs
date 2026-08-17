import assert from "node:assert/strict";
import test from "node:test";
import {
  ConflictError,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import {
  AwarenessLedger,
} from "../../source/executables/orchestrator/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("EI21 every registered awareness obligation reaches AW4 before one exact analyst-scoped unmask grant", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const ledger = new AwarenessLedger({
    rootPath: fixture.rootPath,
    clock: () => 1_700_000_000_000,
    schemaValidator: fixture.schemaValidator,
  });
  await ledger.register({
    obligationId: "ei21-invoked",
    roleClass: "semantic_judge",
    purpose: "semantic",
    parentBinding: { reviewSlotId: "slot-1" },
    expectedInvocation: true,
    maskPolicyDigest: "a".repeat(64),
  });
  await ledger.register({
    obligationId: "ei21-no-invocation",
    roleClass: "downstream_consumer",
    purpose: "utility",
    parentBinding: { assignmentId: "assignment-1" },
    expectedInvocation: false,
    maskPolicyDigest: "b".repeat(64),
  });

  const binding = {
    workOrderId: "judge-work-1",
    parentOrderId: "review-grant-1",
    parentFence: 1,
  };
  await ledger.bindInvocation("ei21-invoked", binding);
  await ledger.assertDispatchable(
    "ei21-invoked",
    hashCanonical("awareness-invocation-binding/v1", binding),
  );
  await ledger.commitContent("ei21-invoked", {
    resultDigest: "c".repeat(64),
  });
  await ledger.issueNeutralRequest("ei21-invoked", {
    prompt: "Report perceived condition or unknown.",
  });
  await ledger.sealResponse("ei21-invoked", {
    perceivedCondition: "unknown",
    confidence: "low",
  });
  await ledger.acknowledgeParent("ei21-invoked", {
    parentRevision: 7,
  });

  const grantRequest = {
    grantId: "ei21-unmask",
    campaignId: "campaign-1",
    expectedObligationIds: ["ei21-invoked", "ei21-no-invocation"],
    armMapDigest: "d".repeat(64),
    analystScope: {
      analysisPlanRef: "analysis-plan.json",
      registeredDimensions: ["semantic"],
      fixtureOnly: true,
    },
    campaignEvidenceEnvelopeDigest: "e".repeat(64),
    unmaskFence: 9,
  };
  await assert.rejects(
    ledger.issueUnmaskGrant({
      ...grantRequest,
      expectedObligationIds: ["ei21-invoked"],
    }),
    ConflictError,
  );
  await assert.rejects(
    ledger.issueUnmaskGrant(grantRequest),
    ConflictError,
  );

  await ledger.sealNoInvocation("ei21-no-invocation", {
    parentOrderId: "ec45-no-invocation-order",
    irrevocablyFenced: true,
  });
  await ledger.acknowledgeParent("ei21-no-invocation", {
    parentRevision: 8,
  });
  const noInvocation = await ledger.load("ei21-no-invocation", {
    required: true,
  });
  assert.equal(noInvocation.disposition.kind, "not_applicable");

  const issued = await ledger.issueUnmaskGrant(grantRequest);
  assert.equal(issued.replayed, false);
  assert.equal(issued.grant.roots.length, 2);
  assert.deepEqual(
    [...issued.grant.expectedObligationIds],
    ["ei21-invoked", "ei21-no-invocation"],
  );
  const replay = await ledger.issueUnmaskGrant(grantRequest);
  assert.equal(replay.replayed, true);
  assert.equal(
    replay.grant.grantCoreDigest,
    issued.grant.grantCoreDigest,
  );
  await assert.rejects(
    ledger.issueUnmaskGrant({
      ...grantRequest,
      grantId: "ei21-second-unmask",
    }),
    ConflictError,
  );
  const campaignEventRoot = "f".repeat(64);
  const dispositionRequest = {
    grant: issued.grant,
    disposition: "consumed",
    dispositionCauseRoot: campaignEventRoot,
    campaignEventRoot,
    sourcePhase: "EC15_ANALYZING",
  };
  const disposed =
    await ledger.disposeUnmaskGrant(dispositionRequest);
  assert.equal(disposed.replayed, false);
  assert.equal(disposed.disposition.disposition, "consumed");
  assert.equal(
    disposed.disposition.campaignEventRoot,
    campaignEventRoot,
  );
  fixture.schemaValidator.assert(
    "protected-unmask-grant-disposition",
    disposed.disposition,
  );
  assert.equal(
    (await ledger.disposeUnmaskGrant(dispositionRequest)).replayed,
    true,
  );
  await assert.rejects(
    ledger.issueUnmaskGrant(grantRequest),
    ConflictError,
  );
});
