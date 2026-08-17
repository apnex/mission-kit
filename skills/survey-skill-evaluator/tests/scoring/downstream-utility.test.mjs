import test from "node:test";
import assert from "node:assert/strict";
import { scoreDownstreamUtility } from "../../source/executables/evidence/index.mjs";

test("downstream utility scores a separately sealed obligation key", () => {
  const result = scoreDownstreamUtility({
    utilityKeyId: "consumer-key",
    obligations: [{ obligationId: "actionable", weight: 2 }],
    findings: [
      {
        obligationId: "actionable",
        status: "preserved",
        evidenceCitations: ["consumer-output:line-4"],
      },
    ],
  });
  assert.equal(result.registryId, "consumer-key");
  assert.equal(result.obligations[0].kind, "utility");
  assert.equal(result.normalizedSummary, 1);
});
