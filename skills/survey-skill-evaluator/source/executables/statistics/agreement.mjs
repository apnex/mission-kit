import { ValidationError } from "../engine/errors.mjs";
import { stabilizeJson } from "./input-boundary.mjs";

const SCALES = new Set(["nominal", "ordinal", "interval"]);
const FORBIDDEN_TRIGGER_KEYS = new Set([
  "arm",
  "armId",
  "armMap",
  "candidateId",
  "candidateRank",
  "expectedDirection",
  "crossArmRank",
]);

export function validateIndependentBallotSet(unsafeBallots, minimumCount = 2) {
  const ballots = stabilizeJson(unsafeBallots);
  minimumCount = stabilizeJson(minimumCount);
  if (
    !Array.isArray(ballots) ||
    !Number.isSafeInteger(minimumCount) ||
    minimumCount < 2 ||
    ballots.length < minimumCount
  ) {
    throw new ValidationError(
      "Semantic or ordinal scoring requires at least two committed ballots",
    );
  }
  const judgeIds = new Set();
  const workOrderIds = new Set();
  const commitmentDigests = new Set();
  for (const ballot of ballots) {
    if (
      ballot === null ||
      typeof ballot !== "object" ||
      Array.isArray(ballot) ||
      Object.keys(ballot).sort().join(",") !==
        "ballotDigest,blindCommitmentDigest,judgeId,workOrderId" ||
      typeof ballot.judgeId !== "string" ||
      typeof ballot.workOrderId !== "string" ||
      !/^[a-f0-9]{64}$/u.test(ballot.blindCommitmentDigest) ||
      !/^[a-f0-9]{64}$/u.test(ballot.ballotDigest) ||
      judgeIds.has(ballot.judgeId) ||
      workOrderIds.has(ballot.workOrderId) ||
      commitmentDigests.has(ballot.blindCommitmentDigest)
    ) {
      throw new ValidationError(
        "Ballots must have independent judges, work orders, and blind commitments",
      );
    }
    judgeIds.add(ballot.judgeId);
    workOrderIds.add(ballot.workOrderId);
    commitmentDigests.add(ballot.blindCommitmentDigest);
  }
  return Object.freeze({
    ballotCount: ballots.length,
    minimumCount,
    minimumSatisfied: true,
    independentlyCommitted: true,
  });
}

function assertNoForbiddenTriggerInput(value, path = "$") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoForbiddenTriggerInput(item, `${path}[${index}]`),
    );
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_TRIGGER_KEYS.has(key)) {
      throw new ValidationError(
        "Adjudication trigger cannot consume arm or rank information",
        { path: `${path}.${key}` },
      );
    }
    assertNoForbiddenTriggerInput(child, `${path}.${key}`);
  }
}

function distanceFactory(scale, ordinalValues) {
  if (!SCALES.has(scale)) {
    throw new ValidationError("Agreement scale is unknown", { scale });
  }
  if (scale === "nominal") {
    return (left, right) => (left === right ? 0 : 1);
  }
  if (scale === "ordinal") {
    if (
      !Array.isArray(ordinalValues) ||
      ordinalValues.length < 2 ||
      new Set(ordinalValues).size !== ordinalValues.length
    ) {
      throw new ValidationError(
        "Ordinal agreement requires a unique declared scale order",
      );
    }
    const ranks = new Map(ordinalValues.map((value, index) => [value, index]));
    return (left, right) => {
      if (!ranks.has(left) || !ranks.has(right)) {
        throw new ValidationError("Ordinal rating is outside the declared scale", {
          left,
          right,
        });
      }
      return ((ranks.get(left) - ranks.get(right)) / (ordinalValues.length - 1)) ** 2;
    };
  }
  return (left, right) => {
    if (!Number.isFinite(left) || !Number.isFinite(right)) {
      throw new ValidationError("Interval agreement requires finite ratings");
    }
    return (left - right) ** 2;
  };
}

function pairDisagreement(values, distance) {
  let sum = 0;
  for (let left = 0; left < values.length; left += 1) {
    for (let right = left + 1; right < values.length; right += 1) {
      sum += distance(values[left], values[right]);
    }
  }
  return sum;
}

export function krippendorffAlpha(
  units,
  options = {},
) {
  units = stabilizeJson(units);
  const { scale = "nominal", ordinalValues = undefined } =
    stabilizeJson(options);
  if (!Array.isArray(units)) {
    throw new ValidationError("Agreement units must be an array");
  }
  const distance = distanceFactory(scale, ordinalValues);
  const usable = units
    .map((unit) =>
      (Array.isArray(unit) ? unit : unit?.ratings ?? []).filter(
        (value) => value !== null && value !== undefined,
      ),
    )
    .filter((ratings) => ratings.length >= 2);
  const allRatings = usable.flat();
  if (allRatings.length < 2) {
    return {
      alpha: null,
      status: "not_estimable",
      unitCount: usable.length,
      ratingCount: allRatings.length,
      scale,
    };
  }
  let observedNumerator = 0;
  for (const ratings of usable) {
    observedNumerator +=
      (2 * pairDisagreement(ratings, distance)) / (ratings.length - 1);
  }
  const observedDisagreement = observedNumerator / allRatings.length;
  const expectedDisagreement =
    (2 * pairDisagreement(allRatings, distance)) /
    (allRatings.length * (allRatings.length - 1));
  const alpha =
    expectedDisagreement === 0
      ? observedDisagreement === 0
        ? 1
        : null
      : 1 - observedDisagreement / expectedDisagreement;
  return {
    alpha,
    status: alpha === null ? "not_estimable" : "estimated",
    unitCount: usable.length,
    ratingCount: allRatings.length,
    observedDisagreement,
    expectedDisagreement,
    scale,
    distance:
      scale === "nominal"
        ? "nominal_mismatch"
        : scale === "ordinal"
          ? "squared_declared_rank"
          : "squared_interval",
    preAdjudication: true,
  };
}

function mean(values) {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function crossedJudgeEffects(
  ratings,
  options = {},
) {
  ratings = stabilizeJson(ratings);
  const {
    unitField = "unitId",
    judgeField = "judgeId",
    valueField = "value",
  } = stabilizeJson(options);
  if (
    !Array.isArray(ratings) ||
    ratings.length < 2 ||
    ratings.some(
      (rating) =>
        typeof rating?.[unitField] !== "string" ||
        rating[unitField].length === 0 ||
        typeof rating?.[judgeField] !== "string" ||
        rating[judgeField].length === 0 ||
        !Number.isFinite(rating?.[valueField]),
    )
  ) {
    throw new ValidationError(
      "Judge-effects analysis requires finite unit-by-judge ratings",
    );
  }
  const unitIds = [...new Set(ratings.map((rating) => rating[unitField]))];
  const judgeIds = [...new Set(ratings.map((rating) => rating[judgeField]))];
  const cells = new Set();
  for (const rating of ratings) {
    const cell = `${String(rating[unitField]).length}:${String(
      rating[unitField],
    )}|${String(rating[judgeField]).length}:${String(rating[judgeField])}`;
    if (cells.has(cell)) {
      throw new ValidationError(
        "Crossed judge panel contains a duplicate unit-by-judge cell",
        { unitId: rating[unitField], judgeId: rating[judgeField] },
      );
    }
    cells.add(cell);
  }
  if (cells.size !== unitIds.length * judgeIds.length) {
    throw new ValidationError(
      "Crossed judge variance shares require a complete balanced panel",
      {
        observedCellCount: cells.size,
        expectedCellCount: unitIds.length * judgeIds.length,
      },
    );
  }
  const values = ratings.map((rating) => rating[valueField]);
  const grandMean = mean(values);
  const unitMeans = new Map(
    unitIds.map((unitId) => [
      unitId,
      mean(
        ratings
          .filter((rating) => rating[unitField] === unitId)
          .map((rating) => rating[valueField]),
      ),
    ]),
  );
  const judgeMeans = new Map(
    judgeIds.map((judgeId) => [
      judgeId,
      mean(
        ratings
          .filter((rating) => rating[judgeField] === judgeId)
          .map((rating) => rating[valueField]),
      ),
    ]),
  );
  const totalSumSquares = values.reduce(
    (sum, value) => sum + (value - grandMean) ** 2,
    0,
  );
  const unitSumSquares = unitIds.reduce((sum, unitId) => {
    const count = ratings.filter((rating) => rating[unitField] === unitId).length;
    return sum + count * (unitMeans.get(unitId) - grandMean) ** 2;
  }, 0);
  const judgeSumSquares = judgeIds.reduce((sum, judgeId) => {
    const count = ratings.filter((rating) => rating[judgeField] === judgeId).length;
    return sum + count * (judgeMeans.get(judgeId) - grandMean) ** 2;
  }, 0);
  const residualSumSquares = ratings.reduce((sum, rating) => {
    const residual =
      rating[valueField] -
      unitMeans.get(rating[unitField]) -
      judgeMeans.get(rating[judgeField]) +
      grandMean;
    return sum + residual ** 2;
  }, 0);
  return {
    experimentalUnitCount: unitIds.length,
    judgeCount: judgeIds.length,
    ratingCount: ratings.length,
    judgeRatingsInflateExperimentalN: false,
    grandMean,
    unitEffects: Object.fromEntries(
      unitIds.map((unitId) => [unitId, unitMeans.get(unitId) - grandMean]),
    ),
    judgeEffects: Object.fromEntries(
      judgeIds.map((judgeId) => [judgeId, judgeMeans.get(judgeId) - grandMean]),
    ),
    varianceShares:
      totalSumSquares === 0
        ? { unit: 0, judge: 0, residual: 0 }
        : {
            unit: unitSumSquares / totalSumSquares,
            judge: judgeSumSquares / totalSumSquares,
            residual: residualSumSquares / totalSumSquares,
          },
    model: "crossed_additive_measurement_effects",
  };
}

function pairwiseScoreDistances(ballots) {
  const distances = [];
  for (let left = 0; left < ballots.length; left += 1) {
    for (let right = left + 1; right < ballots.length; right += 1) {
      const dimensions = new Set([
        ...Object.keys(ballots[left].scores ?? {}),
        ...Object.keys(ballots[right].scores ?? {}),
      ]);
      for (const dimensionId of dimensions) {
        const leftValue = ballots[left].scores?.[dimensionId];
        const rightValue = ballots[right].scores?.[dimensionId];
        if (Number.isFinite(leftValue) && Number.isFinite(rightValue)) {
          distances.push({
            leftBallotId: ballots[left].ballotId,
            rightBallotId: ballots[right].ballotId,
            dimensionId,
            distance: Math.abs(leftValue - rightValue),
          });
        }
      }
    }
  }
  return distances;
}

export function evaluateAdjudicationTrigger(input) {
  const {
    ballots,
    failedBallotCount = 0,
    agreementReport,
    policy,
  } = stabilizeJson(input);
  if (!Array.isArray(ballots) || !policy || typeof policy !== "object") {
    throw new ValidationError("Adjudication trigger input is invalid");
  }
  assertNoForbiddenTriggerInput({ ballots, agreementReport, policy });
  const minimumValidBallots = policy.minimumValidBallots ?? 2;
  if (!Number.isSafeInteger(minimumValidBallots) || minimumValidBallots < 2) {
    throw new ValidationError("Semantic scoring requires at least two ballots");
  }
  const reasons = [];
  const disagreements = pairwiseScoreDistances(ballots);
  if (ballots.length < minimumValidBallots) {
    reasons.push({
      type: "minimum_valid_ballots",
      observed: ballots.length,
      required: minimumValidBallots,
    });
  }
  if (
    Number.isFinite(policy.maximumScoreDistance) &&
    disagreements.some(
      (disagreement) => disagreement.distance >= policy.maximumScoreDistance,
    )
  ) {
    reasons.push({
      type: "score_distance",
      threshold: policy.maximumScoreDistance,
    });
  }
  const categories = new Set(
    ballots
      .flatMap((ballot) => ballot.findings ?? [])
      .filter((finding) => finding.category !== undefined)
      .map((finding) => finding.category),
  );
  if (policy.triggerOnCategoryConflict === true && categories.size > 1) {
    reasons.push({ type: "category_conflict", categories: [...categories].sort() });
  }
  if (
    policy.triggerOnCriticalFinding === true &&
    ballots.some((ballot) =>
      (ballot.findings ?? []).some((finding) => finding.critical === true),
    )
  ) {
    reasons.push({ type: "critical_finding" });
  }
  if (policy.triggerOnMissingBallot === true && failedBallotCount > 0) {
    reasons.push({ type: "missing_ballot", failedBallotCount });
  }
  if (
    Number.isFinite(policy.minimumAgreement) &&
    (agreementReport?.alpha === null ||
      agreementReport?.alpha < policy.minimumAgreement)
  ) {
    reasons.push({
      type: "low_agreement",
      observed: agreementReport?.alpha ?? null,
      threshold: policy.minimumAgreement,
    });
  }
  return {
    triggered: reasons.length > 0,
    reasons,
    disagreementSet: disagreements.filter(
      (entry) =>
        !Number.isFinite(policy.maximumScoreDistance) ||
        entry.distance >= policy.maximumScoreDistance,
    ),
    rawBallotsPreserved: true,
    armMapConsumed: false,
    policyRegisteredBeforeOutcomes: policy.preregistered === true,
  };
}

export function tieAwarePairwiseConcordance(rankings) {
  rankings = stabilizeJson(rankings);
  if (
    !Array.isArray(rankings) ||
    rankings.length < 2 ||
    rankings.some(
      (ranking) =>
        !ranking ||
        typeof ranking !== "object" ||
        Object.values(ranking).some((rank) => !Number.isFinite(rank)),
    )
  ) {
    throw new ValidationError(
      "Rank concordance requires at least two complete ranking maps",
    );
  }
  const itemIds = Object.keys(rankings[0]).sort();
  if (
    itemIds.length < 2 ||
    rankings.some(
      (ranking) =>
        JSON.stringify(Object.keys(ranking).sort()) !== JSON.stringify(itemIds),
    )
  ) {
    throw new ValidationError("Ranking maps must cover the same item set");
  }
  let agreeing = 0;
  let comparable = 0;
  let ties = 0;
  for (let first = 0; first < itemIds.length; first += 1) {
    for (let second = first + 1; second < itemIds.length; second += 1) {
      const signs = rankings.map((ranking) =>
        Math.sign(ranking[itemIds[first]] - ranking[itemIds[second]]),
      );
      for (let left = 0; left < signs.length; left += 1) {
        for (let right = left + 1; right < signs.length; right += 1) {
          comparable += 1;
          if (signs[left] === 0 || signs[right] === 0) {
            if (signs[left] === signs[right]) agreeing += 1;
            ties += 1;
          } else if (signs[left] === signs[right]) {
            agreeing += 1;
          }
        }
      }
    }
  }
  return {
    concordance: comparable === 0 ? null : agreeing / comparable,
    comparablePairs: comparable,
    tieComparisons: ties,
    tieAware: true,
  };
}
