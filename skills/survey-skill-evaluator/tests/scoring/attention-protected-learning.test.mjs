import test from "node:test";
import assert from "node:assert/strict";
import {
  attentionDecisionSurface,
  projectAttentionLedger,
} from "../../source/executables/evidence/index.mjs";

test("learning investment and Director strategic judgment remain protected from adverse optimization", () => {
  const ledger = projectAttentionLedger({
    attentionLedgerId: "attention-1",
    sourceCutRoot: "a".repeat(64),
    observations: [
      {
        sourceEventDigest: "b".repeat(64),
        nativeMeasure: 4,
        nativeUnit: "minutes",
        evidenceRefs: ["c".repeat(64)],
        classificationStatus: "resolved",
        components: [
          {
            class: "learning_investment",
            subtype: "director_strategic_judgment",
            nativeMeasure: 4,
            nativeUnit: "minutes",
          },
        ],
      },
    ],
  });
  const surface = attentionDecisionSurface(ledger);
  assert.deepEqual(surface.adverseObjectives.toilByUnit, {});
  assert.equal(
    surface.protectedLearningInvestment.directorStrategicJudgmentByUnit.minutes,
    4,
  );
  assert.equal(surface.protectedLearningCanWorsenRank, false);
});
