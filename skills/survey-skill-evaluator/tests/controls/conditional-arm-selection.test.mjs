import assert from "node:assert/strict";
import test from "node:test";
import {
  requiredAdditionalArmClasses,
  validateClaimContrast,
} from "../../source/executables/orchestrator/index.mjs";

const digest = (character) => character.repeat(64);

function arms(controlClass) {
  return [
    {
      armId: "candidate",
      conditionClass: "candidate",
      snapshotDigest: digest("a"),
      environmentDigest: digest("e"),
    },
    {
      armId: "counterfactual",
      conditionClass: controlClass,
      snapshotDigest: digest("b"),
      environmentDigest: digest("e"),
    },
  ];
}

test("claim class selects only the prior, neutral, alternate-version, or ablation condition needed by its contrast", () => {
  const cases = [
    ["upgrade-effect", "frozen-prior"],
    ["absolute-leverage", "neutral-control"],
    ["variant-selection", "alternate-candidate"],
    ["mechanism-attribution", "mechanism-ablation"],
  ];
  for (const [claimClass, controlClass] of cases) {
    const required = requiredAdditionalArmClasses(claimClass);
    assert.equal(required.includes(controlClass), true);
    const admitted = validateClaimContrast(
      {
        claimClass,
        treatmentArmId: "candidate",
        controlArmId: "counterfactual",
      },
      arms(controlClass),
    );
    assert.equal(admitted.controlConditionClass, controlClass);

    const wrongClass = cases.find((entry) => entry[1] !== controlClass)[1];
    assert.throws(
      () =>
        validateClaimContrast(
          {
            claimClass,
            treatmentArmId: "candidate",
            controlArmId: "counterfactual",
          },
          arms(wrongClass),
        ),
      /Counterfactual condition is invalid/u,
    );
  }
  assert.throws(
    () => requiredAdditionalArmClasses("universal-four-arm-bundle"),
    /no registered contrast/u,
  );
});
