import assert from "node:assert/strict";
import test from "node:test";
import {
  projectEfficiencyTelemetry,
  scoreDownstreamUtility,
  scoreObligationRegistry,
} from "../../source/executables/evidence/index.mjs";

test("EM10 measures semantic and downstream value while minimizing only observed toil", () => {
  const semantic = scoreObligationRegistry({
    registryId: "semantic-key",
    obligations: [{ obligationId: "intent", kind: "intent_atom" }],
    findings: [{
      obligationId: "intent",
      status: "preserved",
      evidenceCitations: ["artifact:1"],
    }],
  });
  const utility = scoreDownstreamUtility({
    utilityKeyId: "utility-key",
    obligations: [{ obligationId: "actionable" }],
    findings: [{
      obligationId: "actionable",
      status: "preserved",
      evidenceCitations: ["task:1"],
    }],
  });
  const telemetry = projectEfficiencyTelemetry({
    ledgerId: "attention",
    observations: [{
      kind: "turns",
      status: "observed",
      nativeValue: 4,
      nativeUnit: "count",
      attentionEconomicClass: "learning_investment",
      adverseOptimizationEligible: false,
    }],
  });
  assert.equal(semantic.normalizedSummary, 1);
  assert.equal(utility.normalizedSummary, 1);
  assert.deepEqual(telemetry.protectedLearningKinds, ["turns"]);
  assert.equal(telemetry.observedToilKinds.includes("turns"), false);
});
