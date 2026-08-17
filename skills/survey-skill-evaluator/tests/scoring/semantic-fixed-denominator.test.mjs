import test from "node:test";
import assert from "node:assert/strict";
import { scoreObligationRegistry } from "../../source/executables/evidence/index.mjs";

test("semantic scoring keeps the sealed obligation denominator when a finding is not judgeable", () => {
  const result = scoreObligationRegistry({
    registryId: "semantic-key-1",
    obligations: [
      { obligationId: "intent", kind: "intent_atom" },
      { obligationId: "tension", kind: "tension" },
    ],
    findings: [
      {
        obligationId: "intent",
        status: "preserved",
        evidenceCitations: ["evidence:1"],
      },
    ],
  });
  assert.equal(result.fixedObligationDenominator, 2);
  assert.equal(result.judgeableObligationCount, 1);
  assert.equal(result.notJudgeableObligationCount, 1);
  assert.equal(result.obligations[1].status, "not_judgeable");
});
