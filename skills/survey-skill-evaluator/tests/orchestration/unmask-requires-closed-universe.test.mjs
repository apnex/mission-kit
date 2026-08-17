import test from "node:test";
import assert from "node:assert/strict";
import { AwarenessLedger } from "../../source/executables/orchestrator/index.mjs";
import { ConflictError } from "../../source/executables/engine/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("protected unmask is impossible until every expected awareness object is AW4", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const ledger = new AwarenessLedger({
    rootPath: fixture.rootPath,
    schemaValidator: fixture.schemaValidator,
  });
  await ledger.register({
    obligationId: "aw-closed",
    roleClass: "downstream_consumer",
    purpose: "utility",
    parentBinding: { assignmentId: "a1" },
    expectedInvocation: false,
    maskPolicyDigest: "a".repeat(64),
  });
  await assert.rejects(
    ledger.issueUnmaskGrant({
      grantId: "grant-early",
      campaignId: "c1",
      expectedObligationIds: ["aw-closed"],
      armMapDigest: "b".repeat(64),
      analystScope: {
        analysisPlanRef: "analysis-plan.json",
        registeredDimensions: ["semantic"],
        fixtureOnly: true,
      },
      campaignEvidenceEnvelopeDigest: "c".repeat(64),
      unmaskFence: 3,
    }),
    (error) => error instanceof ConflictError,
  );
  await ledger.sealNoInvocation("aw-closed", { parentOrderId: "no-work" });
  await ledger.acknowledgeParent("aw-closed", { parentRevision: 2 });
  const result = await ledger.issueUnmaskGrant({
    grantId: "grant-final",
    campaignId: "c1",
    expectedObligationIds: ["aw-closed"],
    armMapDigest: "b".repeat(64),
    analystScope: {
      analysisPlanRef: "analysis-plan.json",
      registeredDimensions: ["semantic"],
      fixtureOnly: true,
    },
    campaignEvidenceEnvelopeDigest: "c".repeat(64),
    unmaskFence: 3,
  });
  assert.match(result.grant.grantCoreDigest, /^[0-9a-f]{64}$/);
  fixture.schemaValidator.assert(
    "protected-unmask-grant",
    result.grant,
  );
  const failurePreparationRoot = "d".repeat(64);
  const disposed = await ledger.disposeUnmaskGrant({
    grant: result.grant,
    disposition: "terminalized_unconsumed",
    dispositionCauseRoot: failurePreparationRoot,
    failurePreparationRoot,
    sourcePhase: "EC14B_FINAL_EVIDENCE_SEALED",
  });
  assert.equal(
    disposed.disposition.disposition,
    "terminalized_unconsumed",
  );
  assert.equal(
    disposed.disposition.failurePreparationRoot,
    failurePreparationRoot,
  );
  fixture.schemaValidator.assert(
    "protected-unmask-grant-disposition",
    disposed.disposition,
  );
  await assert.rejects(
    ledger.issueUnmaskGrant({
      grantId: "grant-final",
      campaignId: "c1",
      expectedObligationIds: ["aw-closed"],
      armMapDigest: "b".repeat(64),
      analystScope: {
        analysisPlanRef: "analysis-plan.json",
        registeredDimensions: ["semantic"],
        fixtureOnly: true,
      },
      campaignEvidenceEnvelopeDigest: "c".repeat(64),
      unmaskFence: 3,
    }),
    ConflictError,
  );
});
