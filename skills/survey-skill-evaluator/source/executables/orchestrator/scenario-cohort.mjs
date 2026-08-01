import {
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import { ConflictError, ValidationError } from "../engine/errors.mjs";
import { HASH_PROFILE_ID, hashCanonical } from "../engine/hash.mjs";

function exactKeys(value, expected, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    Object.keys(value).sort().join(",") !== [...expected].sort().join(",")
  ) {
    throw new ValidationError(`${label} has an invalid field set`);
  }
}

function identifier(value, label) {
  if (
    typeof value !== "string" ||
    !/^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u.test(value)
  ) {
    throw new ValidationError(`${label} must be an identifier`);
  }
}

function validateState(state) {
  exactKeys(
    state,
    [
      "cohortId",
      "mode",
      "lineageId",
      "revision",
      "remainingUses",
      "consumptions",
    ],
    "Scenario cohort state",
  );
  identifier(state.cohortId, "Cohort ID");
  identifier(state.lineageId, "Cohort lineage ID");
  if (
    !["single_use", "bounded_reusable_holdout"].includes(state.mode) ||
    !Number.isSafeInteger(state.revision) ||
    state.revision < 0 ||
    !Number.isSafeInteger(state.remainingUses) ||
    state.remainingUses < 0 ||
    !Array.isArray(state.consumptions)
  ) {
    throw new ValidationError("Scenario cohort state is invalid");
  }
  if (
    state.mode === "single_use" &&
    state.remainingUses + state.consumptions.length !== 1
  ) {
    throw new ValidationError(
      "Single-use scenario cohort accounting is inconsistent",
    );
  }
  const useIds = new Set();
  for (const consumption of state.consumptions) {
    exactKeys(
      consumption,
      ["useId", "requestDigest", "receipt"],
      "Scenario cohort consumption",
    );
    identifier(consumption.useId, "Cohort use ID");
    if (
      useIds.has(consumption.useId) ||
      !/^[a-f0-9]{64}$/u.test(consumption.requestDigest) ||
      consumption.receipt?.useId !== consumption.useId ||
      consumption.receipt?.requestDigest !== consumption.requestDigest
    ) {
      throw new ValidationError("Scenario cohort consumption is invalid");
    }
    const receiptCore = { ...consumption.receipt };
    const receiptDigest = receiptCore.receiptDigest;
    delete receiptCore.receiptDigest;
    if (
      !/^[a-f0-9]{64}$/u.test(receiptDigest) ||
      hashCanonical("scenario-cohort-use-receipt/v1", receiptCore) !==
        receiptDigest
    ) {
      throw new ValidationError(
        "Scenario cohort consumption receipt is unverifiable",
      );
    }
    useIds.add(consumption.useId);
  }
}

function validateRequest(request) {
  exactKeys(
    request,
    [
      "useId",
      "lineageId",
      "scenarioAuthorityExposure",
      "candidateMaterialExposed",
      "armMapExposed",
      "expectedDirectionExposed",
    ],
    "Scenario cohort use request",
  );
  identifier(request.useId, "Cohort use ID");
  identifier(request.lineageId, "Cohort use lineage ID");
  if (
    request.scenarioAuthorityExposure !== "candidate_independent" ||
    request.candidateMaterialExposed !== false ||
    request.armMapExposed !== false ||
    request.expectedDirectionExposed !== false
  ) {
    throw new ValidationError(
      "Confirmatory scenario material must be authored candidate-independently",
    );
  }
}

export function consumeScenarioCohortUse(unsafeState, unsafeRequest) {
  const state = deepCloneCanonical(unsafeState);
  const request = deepCloneCanonical(unsafeRequest);
  validateState(state);
  validateRequest(request);
  if (request.lineageId !== state.lineageId) {
    throw new ConflictError(
      "A scenario cohort use cannot cross its sealed lineage",
    );
  }
  const requestDigest = hashCanonical("scenario-cohort-use-request/v1", request);
  const existing = state.consumptions.find(
    (consumption) => consumption.useId === request.useId,
  );
  if (existing) {
    if (existing.requestDigest !== requestDigest) {
      throw new ConflictError(
        "A cohort use ID cannot be replayed with changed bytes",
      );
    }
    return deepFreeze({
      replayed: true,
      state,
      receipt: deepCloneCanonical(existing.receipt),
    });
  }
  if (state.remainingUses === 0) {
    throw new ConflictError(
      "Scenario cohort use budget is exhausted and cannot be refunded",
    );
  }
  if (state.mode === "single_use" && state.consumptions.length !== 0) {
    throw new ConflictError("Single-use scenario cohort was already consumed");
  }
  const receiptCore = {
    hashProfileId: HASH_PROFILE_ID,
    cohortId: state.cohortId,
    cohortLineageId: state.lineageId,
    cohortRevision: state.revision,
    useId: request.useId,
    requestDigest,
    ordinal: state.consumptions.length + 1,
    remainingUses: state.remainingUses - 1,
    noRefund: true,
  };
  const receiptDigest = hashCanonical(
    "scenario-cohort-use-receipt/v1",
    receiptCore,
  );
  const receipt = {
    ...receiptCore,
    receiptDigest,
  };
  const nextState = {
    ...state,
    revision: state.revision + 1,
    remainingUses: state.remainingUses - 1,
    consumptions: [
      ...state.consumptions,
      {
        useId: request.useId,
        requestDigest,
        receipt,
      },
    ],
  };
  validateState(nextState);
  return deepFreeze({
    replayed: false,
    state: nextState,
    receipt,
  });
}
