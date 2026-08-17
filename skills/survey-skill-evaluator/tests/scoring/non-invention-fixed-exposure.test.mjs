import test from "node:test";
import assert from "node:assert/strict";
import { scoreNonInvention } from "../../source/executables/evidence/index.mjs";

test("non-invention uses sealed semantic-key exposure rather than candidate verbosity", () => {
  const result = scoreNonInvention({
    unsupportedMaterialClaims: 2,
    fixedExposureDenominator: 8,
    evidenceCitations: ["claim:2", "claim:7"],
  });
  assert.equal(result.unsupportedClaimRate, 0.25);
  assert.equal(result.exposureSource, "sealed_semantic_key");
  assert.equal(result.candidateVerbosityCanEnlargeDenominator, false);
});
