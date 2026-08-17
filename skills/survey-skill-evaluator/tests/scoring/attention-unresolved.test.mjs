import test from "node:test";
import assert from "node:assert/strict";
import {
  attentionDecisionSurface,
  projectAttentionLedger,
} from "../../source/executables/evidence/index.mjs";

test("unresolved attention remains typed missingness and cannot enter a composite", () => {
  const ledger = projectAttentionLedger({
    attentionLedgerId: "attention-1",
    sourceCutRoot: "a".repeat(64),
    observations: [
      {
        sourceEventDigest: "b".repeat(64),
        nativeMeasure: 2,
        nativeUnit: "minutes",
        evidenceRefs: ["c".repeat(64)],
        classificationStatus: "unresolved",
      },
    ],
  });
  const surface = attentionDecisionSurface(ledger);
  assert.deepEqual(ledger.components, []);
  assert.deepEqual(ledger.unresolvedObservationRefs, ["b".repeat(64)]);
  assert.equal(surface.unresolvedEligibleForComposite, false);
});
