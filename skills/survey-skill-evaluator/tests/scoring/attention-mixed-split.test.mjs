import test from "node:test";
import assert from "node:assert/strict";
import { projectAttentionLedger } from "../../source/executables/evidence/index.mjs";

test("a mixed attention event must split its complete native measure into typed components", () => {
  assert.throws(
    () =>
      projectAttentionLedger({
        attentionLedgerId: "attention-1",
        sourceCutRoot: "a".repeat(64),
        observations: [
          {
            sourceEventDigest: "b".repeat(64),
            nativeMeasure: 10,
            nativeUnit: "minutes",
            evidenceRefs: ["c".repeat(64)],
            classificationStatus: "resolved",
            components: [
              {
                class: "toil",
                subtype: "chasing",
                nativeMeasure: 2,
                nativeUnit: "minutes",
              },
              {
                class: "learning_investment",
                subtype: "clarification",
                nativeMeasure: 3,
                nativeUnit: "minutes",
              },
            ],
          },
        ],
      }),
    /split its complete native measure/,
  );
});
