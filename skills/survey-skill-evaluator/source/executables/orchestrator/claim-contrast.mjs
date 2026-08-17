import {
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import { ValidationError } from "../engine/errors.mjs";

const DIGEST = /^[a-f0-9]{64}$/u;

const CLAIM_CONTRASTS = Object.freeze({
  "upgrade-effect": Object.freeze({
    treatmentClasses: Object.freeze(["candidate"]),
    controlClasses: Object.freeze(["frozen-prior"]),
    additionalArmClasses: Object.freeze(["frozen-prior"]),
  }),
  "absolute-leverage": Object.freeze({
    treatmentClasses: Object.freeze(["candidate"]),
    controlClasses: Object.freeze(["neutral-control", "no-method-control"]),
    additionalArmClasses: Object.freeze([
      "neutral-control",
      "no-method-control",
    ]),
  }),
  "variant-selection": Object.freeze({
    treatmentClasses: Object.freeze(["candidate"]),
    controlClasses: Object.freeze(["alternate-candidate"]),
    additionalArmClasses: Object.freeze(["alternate-candidate"]),
  }),
  "mechanism-attribution": Object.freeze({
    treatmentClasses: Object.freeze(["candidate"]),
    controlClasses: Object.freeze(["mechanism-ablation"]),
    additionalArmClasses: Object.freeze(["mechanism-ablation"]),
  }),
  robustness: Object.freeze({
    treatmentClasses: Object.freeze(["canonical-stratum"]),
    controlClasses: Object.freeze(["adversarial-stratum"]),
    additionalArmClasses: Object.freeze(["adversarial-stratum"]),
  }),
  efficiency: Object.freeze({
    treatmentClasses: Object.freeze(["candidate"]),
    controlClasses: Object.freeze(["matched-control"]),
    additionalArmClasses: Object.freeze(["matched-control"]),
  }),
  "downstream-utility": Object.freeze({
    treatmentClasses: Object.freeze(["candidate"]),
    controlClasses: Object.freeze(["matched-control"]),
    additionalArmClasses: Object.freeze(["matched-control"]),
  }),
});

function assertIdentifier(value, label) {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u.test(value)
  ) {
    throw new ValidationError(`${label} must be an identifier`);
  }
}

function assertArm(arm) {
  if (
    arm === null ||
    typeof arm !== "object" ||
    Array.isArray(arm) ||
    Object.keys(arm).sort().join(",") !==
      "armId,conditionClass,environmentDigest,snapshotDigest"
  ) {
    throw new ValidationError(
      "A contrast arm must contain only its sealed identity and condition class",
    );
  }
  assertIdentifier(arm.armId, "arm ID");
  assertIdentifier(arm.conditionClass, "arm condition class");
  if (!DIGEST.test(arm.snapshotDigest) || !DIGEST.test(arm.environmentDigest)) {
    throw new ValidationError("A contrast arm must bind sealed package and environment digests", {
      armId: arm.armId,
    });
  }
}

export function requiredAdditionalArmClasses(claimClass) {
  const contract = CLAIM_CONTRASTS[claimClass];
  if (!contract) {
    throw new ValidationError("Claim class has no registered contrast", {
      claimClass,
    });
  }
  return deepFreeze([...contract.additionalArmClasses]);
}

export function validateClaimContrast(unsafeClaim, unsafeArms) {
  const claim = deepCloneCanonical(unsafeClaim);
  if (
    claim === null ||
    typeof claim !== "object" ||
    Array.isArray(claim) ||
    Object.keys(claim).sort().join(",") !==
      "claimClass,controlArmId,treatmentArmId"
  ) {
    throw new ValidationError(
      "Claim contrast must name exactly one class, treatment, and control",
    );
  }
  const contract = CLAIM_CONTRASTS[claim.claimClass];
  if (!contract) {
    throw new ValidationError("Claim class has no registered contrast", {
      claimClass: claim.claimClass,
    });
  }
  assertIdentifier(claim.treatmentArmId, "treatment arm ID");
  assertIdentifier(claim.controlArmId, "control arm ID");
  if (claim.treatmentArmId === claim.controlArmId) {
    throw new ValidationError("Treatment and counterfactual arms must be distinct");
  }
  const arms = deepCloneCanonical(unsafeArms);
  if (!Array.isArray(arms) || arms.length < 2) {
    throw new ValidationError(
      "A claim contrast requires sealed treatment and counterfactual arms",
    );
  }
  const byId = new Map();
  for (const arm of arms) {
    assertArm(arm);
    if (byId.has(arm.armId)) {
      throw new ValidationError("A claim contrast repeats an arm ID", {
        armId: arm.armId,
      });
    }
    byId.set(arm.armId, arm);
  }
  const treatment = byId.get(claim.treatmentArmId);
  const control = byId.get(claim.controlArmId);
  if (!treatment || !control) {
    throw new ValidationError(
      "A claim contrast does not resolve both sealed arm identities",
    );
  }
  if (!contract.treatmentClasses.includes(treatment.conditionClass)) {
    throw new ValidationError(
      "Treatment condition is invalid for the registered claim class",
      {
        claimClass: claim.claimClass,
        conditionClass: treatment.conditionClass,
      },
    );
  }
  if (!contract.controlClasses.includes(control.conditionClass)) {
    throw new ValidationError(
      "Counterfactual condition is invalid for the registered claim class",
      {
        claimClass: claim.claimClass,
        conditionClass: control.conditionClass,
      },
    );
  }
  if (treatment.snapshotDigest === control.snapshotDigest) {
    throw new ValidationError(
      "Treatment and counterfactual must bind distinct package snapshots",
    );
  }
  return deepFreeze({
    claimClass: claim.claimClass,
    treatmentArmId: treatment.armId,
    controlArmId: control.armId,
    treatmentConditionClass: treatment.conditionClass,
    controlConditionClass: control.conditionClass,
    treatmentSnapshotDigest: treatment.snapshotDigest,
    controlSnapshotDigest: control.snapshotDigest,
    treatmentEnvironmentDigest: treatment.environmentDigest,
    controlEnvironmentDigest: control.environmentDigest,
    registeredContrast: true,
  });
}

export const CLAIM_CONTRAST_CLASSES = Object.freeze(
  Object.keys(CLAIM_CONTRASTS),
);
