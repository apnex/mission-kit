import assert from "node:assert/strict";
import test from "node:test";
import {
  ConflictError,
  ValidationError,
  canonicalize,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import {
  AwarenessLedger,
} from "../../source/executables/orchestrator/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("EM19 content seals before neutral awareness and remains immutable through missing response and unmask", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const ledger = new AwarenessLedger({
    rootPath: fixture.rootPath,
    schemaValidator: fixture.schemaValidator,
  });
  await ledger.register({
    obligationId: "em19-awareness",
    roleClass: "survey_executor",
    purpose: "post-content condition report",
    parentBinding: { assignmentId: "assignment-1" },
    expectedInvocation: true,
    maskPolicyDigest: "a".repeat(64),
  });
  const binding = {
    workOrderId: "executor-work-1",
    parentOrderId: "assignment-grant-1",
    parentFence: 2,
  };
  await ledger.bindInvocation("em19-awareness", binding);
  await ledger.assertDispatchable(
    "em19-awareness",
    hashCanonical("awareness-invocation-binding/v1", binding),
  );
  const contentCommit = {
    roleEvidenceDigest: "b".repeat(64),
    contentDigest: "c".repeat(64),
  };
  await ledger.commitContent("em19-awareness", contentCommit);
  await assert.rejects(
    ledger.issueNeutralRequest("em19-awareness", {
      prompt: "Which arm did you see?",
      armMap: { treatment: "candidate" },
    }),
    ValidationError,
  );
  await ledger.issueNeutralRequest("em19-awareness", {
    prompt: "Report perceived condition or unknown.",
  });
  await assert.rejects(
    ledger.commitContent("em19-awareness", {
      roleEvidenceDigest: "d".repeat(64),
      contentDigest: "e".repeat(64),
    }),
    ConflictError,
  );
  await ledger.sealMissingAfterContent("em19-awareness", {
    reason: "registered-timeout",
  });
  await ledger.acknowledgeParent("em19-awareness", {
    parentRevision: 9,
  });

  const closed = await ledger.load("em19-awareness", { required: true });
  assert.equal(closed.state, "AW4_CLOSED");
  assert.equal(closed.disposition.kind, "missing_after_content");
  assert.equal(
    canonicalize(closed.contentCommit),
    canonicalize(contentCommit),
  );
  const issued = await ledger.issueUnmaskGrant({
    grantId: "em19-unmask",
    campaignId: "campaign-1",
    expectedObligationIds: ["em19-awareness"],
    armMapDigest: "f".repeat(64),
    analystScope: {
      analysisPlanRef: "analysis-plan.json",
      registeredDimensions: ["semantic"],
      fixtureOnly: true,
    },
    campaignEvidenceEnvelopeDigest: "0".repeat(64),
    unmaskFence: 1,
  });
  assert.equal(issued.grant.roots[0].disposition, "missing_after_content");
});
