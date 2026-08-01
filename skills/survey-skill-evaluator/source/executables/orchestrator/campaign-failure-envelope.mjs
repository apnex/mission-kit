import {
  canonicalize,
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import {
  IntegrityError,
  ValidationError,
} from "../engine/errors.mjs";
import {
  HASH_PROFILE_ID,
  hashCanonical,
} from "../engine/hash.mjs";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u;
const DIGEST = /^[a-f0-9]{64}$/u;
const POSITION_CLASSES = new Set([
  "assignment",
  "attempt",
  "review",
  "reserve",
  "capacity",
]);
const POSITION_DISPOSITIONS = new Set([
  "terminal",
  "quarantined",
  "terminalized_unconsumed",
  "never_granted",
  "retired",
]);
const CLOSED_GRANT_DISPOSITIONS = new Set([
  "consumed",
  "terminalized_unconsumed",
  "quarantined",
  "never_granted",
  "retired",
]);
const POPULATION_CLASSES = Object.freeze([
  "all_assigned",
  "instrument_valid",
  "release_eligible",
]);
const POPULATION_STAGES = Object.freeze([
  "survey",
  "downstream",
]);

function assertObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${label} must be an object`);
  }
}

function assertExactKeys(value, expected, label) {
  assertObject(value, label);
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (canonicalize(actual) !== canonicalize(required)) {
    throw new ValidationError(`${label} has an unauthorized field set`, {
      expected: required,
      actual,
    });
  }
}

function assertIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    throw new ValidationError(`${label} is invalid`, { value });
  }
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !DIGEST.test(value)) {
    throw new ValidationError(`${label} must be a SHA-256 digest`, { value });
  }
}

function assertUnique(values, label, key = (value) => value) {
  const seen = new Set();
  for (const value of values) {
    const identity = key(value);
    if (seen.has(identity)) {
      throw new ValidationError(`${label} contains a duplicate`, {
        identity,
      });
    }
    seen.add(identity);
  }
}

function normalizeExpectedPositions(unsafePositions) {
  if (!Array.isArray(unsafePositions)) {
    throw new ValidationError("Expected failure positions must be an array");
  }
  const positions = deepCloneCanonical(unsafePositions);
  for (const position of positions) {
    assertExactKeys(
      position,
      ["positionId", "positionClass"],
      "expected failure position",
    );
    assertIdentifier(position.positionId, "expected position ID");
    if (!POSITION_CLASSES.has(position.positionClass)) {
      throw new ValidationError("Expected position class is invalid", {
        positionId: position.positionId,
        positionClass: position.positionClass,
      });
    }
  }
  assertUnique(positions, "Expected failure positions", (position) =>
    `${position.positionClass}:${position.positionId}`
  );
  return positions.sort((left, right) =>
    Buffer.from(
      `${left.positionClass}:${left.positionId}`,
      "utf8",
    ).compare(
      Buffer.from(`${right.positionClass}:${right.positionId}`, "utf8"),
    )
  );
}

function normalizePositionDispositions(unsafeDispositions) {
  if (!Array.isArray(unsafeDispositions)) {
    throw new ValidationError("Failure position dispositions must be an array");
  }
  const dispositions = deepCloneCanonical(unsafeDispositions);
  for (const position of dispositions) {
    assertExactKeys(
      position,
      ["positionId", "positionClass", "disposition", "receiptRoot"],
      "failure position disposition",
    );
    assertIdentifier(position.positionId, "failure position ID");
    if (
      !POSITION_CLASSES.has(position.positionClass) ||
      !POSITION_DISPOSITIONS.has(position.disposition)
    ) {
      throw new ValidationError("Failure position disposition is invalid", {
        positionId: position.positionId,
        positionClass: position.positionClass,
        disposition: position.disposition,
      });
    }
    assertDigest(position.receiptRoot, "failure position receipt root");
  }
  assertUnique(dispositions, "Failure position dispositions", (position) =>
    `${position.positionClass}:${position.positionId}`
  );
  return dispositions.sort((left, right) =>
    Buffer.from(
      `${left.positionClass}:${left.positionId}`,
      "utf8",
    ).compare(
      Buffer.from(`${right.positionClass}:${right.positionId}`, "utf8"),
    )
  );
}

function normalizeAwarenessClosures(unsafeClosures) {
  if (!Array.isArray(unsafeClosures)) {
    throw new ValidationError("Awareness closures must be an array");
  }
  const closures = deepCloneCanonical(unsafeClosures);
  for (const closure of closures) {
    assertExactKeys(
      closure,
      [
        "obligationId",
        "state",
        "awarenessStateRoot",
        "parentReceiptRoot",
      ],
      "awareness closure",
    );
    assertIdentifier(closure.obligationId, "awareness obligation ID");
    if (closure.state !== "AW4_CLOSED") {
      throw new IntegrityError(
        "A campaign failure envelope requires every realized awareness obligation at AW4",
        {
          obligationId: closure.obligationId,
          state: closure.state,
        },
      );
    }
    assertDigest(closure.awarenessStateRoot, "awareness state root");
    assertDigest(closure.parentReceiptRoot, "awareness parent receipt root");
  }
  assertUnique(
    closures,
    "Awareness closures",
    (closure) => closure.obligationId,
  );
  return closures.sort((left, right) =>
    Buffer.from(left.obligationId, "utf8").compare(
      Buffer.from(right.obligationId, "utf8"),
    )
  );
}

function normalizeGrantDispositions(unsafeGrants) {
  if (!Array.isArray(unsafeGrants)) {
    throw new ValidationError("Grant dispositions must be an array");
  }
  const grants = deepCloneCanonical(unsafeGrants);
  for (const grant of grants) {
    assertExactKeys(
      grant,
      ["grantId", "disposition", "receiptRoot"],
      "grant disposition",
    );
    assertIdentifier(grant.grantId, "grant ID");
    if (!CLOSED_GRANT_DISPOSITIONS.has(grant.disposition)) {
      throw new IntegrityError(
        "Issued or retirement-pending grants cannot cross campaign failure closure",
        {
          grantId: grant.grantId,
          disposition: grant.disposition,
        },
      );
    }
    assertDigest(grant.receiptRoot, "grant receipt root");
  }
  assertUnique(grants, "Grant dispositions", (grant) => grant.grantId);
  return grants.sort((left, right) =>
    Buffer.from(left.grantId, "utf8").compare(
      Buffer.from(right.grantId, "utf8"),
    )
  );
}

function normalizePopulationViews(unsafeViews) {
  if (!Array.isArray(unsafeViews)) {
    throw new ValidationError(
      "Failure population views must be an array",
    );
  }
  const views = deepCloneCanonical(unsafeViews);
  for (const view of views) {
    assertExactKeys(
      view,
      [
        "populationClass",
        "assignmentCount",
        "observedCount",
        "missingCount",
        "failureCount",
        "contaminationCount",
        "denominatorDigest",
      ],
      "failure population view",
    );
    if (!POPULATION_CLASSES.includes(view.populationClass)) {
      throw new ValidationError(
        "Failure population class is invalid",
        { populationClass: view.populationClass },
      );
    }
    for (const field of [
      "assignmentCount",
      "observedCount",
      "missingCount",
      "failureCount",
      "contaminationCount",
    ]) {
      if (
        !Number.isSafeInteger(view[field]) ||
        view[field] < 0 ||
        view[field] > view.assignmentCount
      ) {
        throw new ValidationError(
          "Failure population count is outside its denominator",
          {
            populationClass: view.populationClass,
            field,
            value: view[field],
            assignmentCount: view.assignmentCount,
          },
        );
      }
    }
    if (
      view.observedCount + view.missingCount !==
      view.assignmentCount
    ) {
      throw new IntegrityError(
        "Failure population observed and missing counts do not reconcile",
        {
          populationClass: view.populationClass,
          assignmentCount: view.assignmentCount,
          observedCount: view.observedCount,
          missingCount: view.missingCount,
        },
      );
    }
    assertDigest(
      view.denominatorDigest,
      "failure population denominator digest",
    );
  }
  assertUnique(
    views,
    "Failure population views",
    (view) => view.populationClass,
  );
  if (
    views.length !== POPULATION_CLASSES.length ||
    POPULATION_CLASSES.some(
      (populationClass) =>
        !views.some(
          (view) => view.populationClass === populationClass,
        ),
    )
  ) {
    throw new IntegrityError(
      "Failure population views do not cover the three registered denominators",
    );
  }
  const assignmentCounts = new Set(
    views.map((view) => view.assignmentCount),
  );
  if (assignmentCounts.size !== 1) {
    throw new IntegrityError(
      "Failure population views changed the all-assigned denominator",
    );
  }
  return POPULATION_CLASSES.map((populationClass) =>
    views.find((view) => view.populationClass === populationClass)
  );
}

function normalizeStagePopulationViews(unsafeViews) {
  if (!Array.isArray(unsafeViews)) {
    throw new ValidationError(
      "Failure stage population views must be an array",
    );
  }
  const views = deepCloneCanonical(unsafeViews);
  for (const view of views) {
    assertExactKeys(
      view,
      [
        "stage",
        "populationClass",
        "assignmentCount",
        "observedCount",
        "missingCount",
        "failureCount",
        "contaminationCount",
        "denominatorDigest",
      ],
      "failure stage population view",
    );
    if (
      !POPULATION_STAGES.includes(view.stage) ||
      !POPULATION_CLASSES.includes(view.populationClass)
    ) {
      throw new ValidationError(
        "Failure stage population identity is invalid",
        {
          stage: view.stage,
          populationClass: view.populationClass,
        },
      );
    }
    for (const field of [
      "assignmentCount",
      "observedCount",
      "missingCount",
      "failureCount",
      "contaminationCount",
    ]) {
      if (
        !Number.isSafeInteger(view[field]) ||
        view[field] < 0 ||
        view[field] > view.assignmentCount
      ) {
        throw new ValidationError(
          "Failure stage population count is outside its denominator",
          {
            stage: view.stage,
            populationClass: view.populationClass,
            field,
            value: view[field],
            assignmentCount: view.assignmentCount,
          },
        );
      }
    }
    if (
      view.observedCount + view.missingCount !==
      view.assignmentCount
    ) {
      throw new IntegrityError(
        "Failure stage population observed and missing counts do not reconcile",
        {
          stage: view.stage,
          populationClass: view.populationClass,
          assignmentCount: view.assignmentCount,
          observedCount: view.observedCount,
          missingCount: view.missingCount,
        },
      );
    }
    assertDigest(
      view.denominatorDigest,
      "failure stage population denominator digest",
    );
  }
  assertUnique(
    views,
    "Failure stage population views",
    (view) => `${view.stage}:${view.populationClass}`,
  );
  const expectedKeys = POPULATION_STAGES.flatMap((stage) =>
    POPULATION_CLASSES.map(
      (populationClass) => `${stage}:${populationClass}`,
    )
  );
  if (
    views.length !== expectedKeys.length ||
    expectedKeys.some(
      (key) =>
        !views.some(
          (view) => `${view.stage}:${view.populationClass}` === key,
        ),
    )
  ) {
    throw new IntegrityError(
      "Failure stage population views do not cover both registered stages and all three denominators",
    );
  }
  const assignmentCounts = new Set(
    views.map((view) => view.assignmentCount),
  );
  if (assignmentCounts.size !== 1) {
    throw new IntegrityError(
      "Failure stage population views changed the all-assigned denominator",
    );
  }
  return expectedKeys.map((key) =>
    views.find(
      (view) => `${view.stage}:${view.populationClass}` === key,
    )
  );
}

/**
 * Builds the minimal digest-only envelope for an already drained campaign
 * failure. This function has no failure-closing authority: callers must supply
 * the complete equality-checked position universe, AW4 closures, and terminal
 * grant receipts produced by the sovereign lifecycle mechanisms.
 */
export function buildCampaignFailureEnvelope({
  campaignId,
  sourcePhase,
  failureCause,
  failureEvidence,
  readableSourceRoots,
  unavailableSourceClasses = [],
  failurePreparationRoot = null,
  expectedPositions,
  positionDispositions,
  populationViews,
  stagePopulationViews,
  awarenessClosures,
  grantDispositions,
  missingnessPolicyRoot,
  unsupportedClaimIds,
  schemaValidator = null,
}) {
  assertIdentifier(campaignId, "campaign ID");
  assertIdentifier(sourcePhase, "failure source phase");
  assertIdentifier(failureCause, "failure cause");
  assertObject(failureEvidence, "failure evidence");
  const expected = normalizeExpectedPositions(expectedPositions);
  const dispositions = normalizePositionDispositions(positionDispositions);
  const expectedKeys = expected.map(
    (position) => `${position.positionClass}:${position.positionId}`,
  );
  const dispositionKeys = dispositions.map(
    (position) => `${position.positionClass}:${position.positionId}`,
  );
  if (canonicalize(expectedKeys) !== canonicalize(dispositionKeys)) {
    throw new IntegrityError(
      "Campaign failure dispositions do not exactly cover the realized position cut",
      { expectedKeys, dispositionKeys },
    );
  }
  if (expected.length > 0) {
    assertDigest(
      failurePreparationRoot,
      "active failure preparation root",
    );
  } else if (failurePreparationRoot !== null) {
    assertDigest(failurePreparationRoot, "failure preparation root");
  }
  if (
    !Array.isArray(readableSourceRoots) ||
    !Array.isArray(unavailableSourceClasses) ||
    !Array.isArray(unsupportedClaimIds)
  ) {
    throw new ValidationError(
      "Failure source roots, unavailable classes, and unsupported claims must be arrays",
    );
  }
  for (const root of readableSourceRoots) {
    assertDigest(root, "readable source root");
  }
  for (const value of [
    ...unavailableSourceClasses,
    ...unsupportedClaimIds,
  ]) {
    assertIdentifier(value, "failure envelope identifier");
  }
  assertUnique(readableSourceRoots, "Readable source roots");
  assertUnique(unavailableSourceClasses, "Unavailable source classes");
  assertUnique(unsupportedClaimIds, "Unsupported claim IDs");
  assertDigest(missingnessPolicyRoot, "missingness policy root");
  const awareness = normalizeAwarenessClosures(awarenessClosures);
  const grants = normalizeGrantDispositions(grantDispositions);
  const populations = normalizePopulationViews(populationViews);
  const stagePopulations = normalizeStagePopulationViews(
    stagePopulationViews,
  );
  const defectRef = hashCanonical(
    "campaign-failure-defect/v1",
    deepCloneCanonical(failureEvidence),
  );
  const envelope = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    campaignFailureEnvelopeId:
      `${campaignId}:failure:${defectRef.slice(0, 20)}`,
    campaignId,
    sourcePhase,
    failureCause,
    readableSourceRoots: [...readableSourceRoots].sort(),
    unavailableSourceClasses: [...unavailableSourceClasses].sort(),
    failurePreparationRoot,
    realizedChildCutRoot: hashCanonical(
      "campaign-failure-realized-child-cut/v1",
      expected,
    ),
    positionDispositions: dispositions,
    populationViews: populations,
    stagePopulationViews: stagePopulations,
    denominatorReconciliationRoot: hashCanonical(
      "campaign-failure-denominator-reconciliation/v1",
      {
        expectedPositions: expected,
        dispositions,
        populationViews: populations,
        stagePopulationViews: stagePopulations,
      },
    ),
    awarenessClosureRoot: hashCanonical(
      "campaign-failure-awareness-closure/v1",
      awareness,
    ),
    receiptLedgerRoot: hashCanonical(
      "campaign-failure-receipt-ledger/v1",
      {
        positionReceipts: dispositions.map((position) => ({
          positionId: position.positionId,
          positionClass: position.positionClass,
          receiptRoot: position.receiptRoot,
        })),
        grantDispositions: grants,
        awarenessParentReceipts: awareness.map((closure) => ({
          obligationId: closure.obligationId,
          parentReceiptRoot: closure.parentReceiptRoot,
        })),
      },
    ),
    missingnessPolicyRoot,
    unsupportedClaimIds: [...unsupportedClaimIds].sort(),
    admissible: false,
    defectRef,
    issuedOrRetirementPendingGrantsRemaining: false,
  };
  schemaValidator?.assert("campaign-failure-envelope", envelope);
  return deepFreeze({
    envelope,
    envelopeDigest: hashCanonical(
      "campaign-failure-envelope/v1",
      envelope,
    ),
  });
}
