import test from "node:test";
import assert from "node:assert/strict";
import { auditControlDelta } from "../../source/executables/statistics/index.mjs";

test("control-delta audit fails on hidden treatment doctrine even when structural deltas are allowed", () => {
  const result = auditControlDelta({
    treatment: { mechanism: { mode: "single-question" }, prompt: "neutral" },
    control: {
      mechanism: { mode: "batch" },
      prompt: "Use the single-question treatment doctrine",
    },
    allowedDifferencePaths: ["$.mechanism.mode", "$.prompt"],
    forbiddenDoctrineTerms: ["single-question treatment"],
    manipulationChecks: [
      {
        checkId: "mechanism-differs",
        evaluate(treatment, control) {
          return treatment.mechanism.mode !== control.mechanism.mode;
        },
      },
    ],
  });
  assert.equal(result.passed, false);
  assert.deepEqual(result.doctrineLeaks, ["single-question treatment"]);
  assert.equal(
    result.manipulationCheckTrustBoundary,
    "registered_package_function",
  );
  assert.equal(result.expectedDirectionConsumed, false);
});
