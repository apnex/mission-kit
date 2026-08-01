import assert from "node:assert/strict";
import test from "node:test";
import {
  validateClaimContrast,
} from "../../source/executables/orchestrator/index.mjs";

const digest = (character) => character.repeat(64);

test("causal contrast admission requires distinct sealed treatment and counterfactual arm identities", () => {
  const claim = {
    claimClass: "upgrade-effect",
    treatmentArmId: "candidate",
    controlArmId: "prior",
  };
  const treatment = {
    armId: "candidate",
    conditionClass: "candidate",
    snapshotDigest: digest("a"),
    environmentDigest: digest("c"),
  };
  const control = {
    armId: "prior",
    conditionClass: "frozen-prior",
    snapshotDigest: digest("b"),
    environmentDigest: digest("c"),
  };
  const admitted = validateClaimContrast(claim, [treatment, control]);
  assert.equal(admitted.registeredContrast, true);
  assert.equal(admitted.controlConditionClass, "frozen-prior");

  assert.throws(
    () => validateClaimContrast(claim, [treatment]),
    /requires sealed treatment and counterfactual arms/u,
  );
  assert.throws(
    () =>
      validateClaimContrast(claim, [
        treatment,
        { ...control, snapshotDigest: treatment.snapshotDigest },
      ]),
    /distinct package snapshots/u,
  );
  assert.throws(
    () =>
      validateClaimContrast(
        { ...claim, controlArmId: claim.treatmentArmId },
        [treatment, control],
      ),
    /must be distinct/u,
  );
});
