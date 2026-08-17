import { ValidationError } from "../engine/errors.mjs";
import { quantile } from "./descriptive.mjs";
import { stabilizeJson } from "./input-boundary.mjs";

function bytewiseCompare(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function isProtectedLearningDimension(dimension) {
  return (
    dimension.attentionEconomicClass === "learning_investment" ||
    dimension.subtype === "director_strategic_judgment" ||
    dimension.direction === "protected_descriptive" ||
    dimension.direction === "protected-descriptive" ||
    dimension.protected === true
  );
}

function normalizeDirection(direction) {
  if (["higher_better", "higher-is-better"].includes(direction)) return "higher";
  if (["lower_better", "lower-is-better"].includes(direction)) return "lower";
  if (["descriptive", "protected_descriptive", "protected-descriptive"].includes(direction)) {
    return "descriptive";
  }
  throw new ValidationError("Ranking dimension has an unknown direction", {
    direction,
  });
}

function decisionDimensions(dimensions) {
  if (!Array.isArray(dimensions) || dimensions.length === 0) {
    throw new ValidationError("Ranking requires registered dimensions");
  }
  const ids = new Set();
  const used = [];
  const excludedProtected = [];
  for (const dimension of dimensions) {
    if (
      !dimension ||
      typeof dimension.dimensionId !== "string" ||
      dimension.dimensionId.length === 0 ||
      ids.has(dimension.dimensionId)
    ) {
      throw new ValidationError("Ranking dimension IDs must be non-empty and unique");
    }
    ids.add(dimension.dimensionId);
    const direction = normalizeDirection(dimension.direction);
    if (isProtectedLearningDimension(dimension)) {
      if (direction !== "descriptive") {
        throw new ValidationError(
          "Protected learning and Director judgment cannot be an adverse rank objective",
          { dimensionId: dimension.dimensionId, direction: dimension.direction },
        );
      }
      excludedProtected.push(dimension.dimensionId);
      continue;
    }
    if (direction === "descriptive") continue;
    const minimumRelevantEffect = dimension.minimumRelevantEffect ?? 0;
    const equivalenceMargin = dimension.equivalenceMargin ?? 0;
    if (
      !Number.isFinite(minimumRelevantEffect) ||
      minimumRelevantEffect < 0 ||
      !Number.isFinite(equivalenceMargin) ||
      equivalenceMargin < 0
    ) {
      throw new ValidationError("Ranking effect regions must be non-negative", {
        dimensionId: dimension.dimensionId,
      });
    }
    used.push({
      ...dimension,
      normalizedDirection: direction,
      minimumRelevantEffect,
      equivalenceMargin,
    });
  }
  if (used.length === 0) {
    throw new ValidationError("Ranking has no decision-bearing dimensions");
  }
  return { used, excludedProtected };
}

function normalizedInterval(candidate, dimension) {
  const value = candidate.dimensions?.[dimension.dimensionId];
  if (!value || !Number.isFinite(value.lower) || !Number.isFinite(value.upper)) {
    return null;
  }
  if (value.lower > value.upper) {
    throw new ValidationError("Candidate interval lower bound exceeds upper bound", {
      candidateId: candidate.candidateId,
      dimensionId: dimension.dimensionId,
    });
  }
  return dimension.normalizedDirection === "lower"
    ? { lower: -value.upper, upper: -value.lower }
    : { lower: value.lower, upper: value.upper };
}

export function pairwisePracticalRelation(left, right, dimension) {
  left = stabilizeJson(left);
  right = stabilizeJson(right);
  dimension = stabilizeJson(dimension);
  const normalized = decisionDimensions([dimension]).used[0];
  const leftInterval = normalizedInterval(left, normalized);
  const rightInterval = normalizedInterval(right, normalized);
  if (!leftInterval || !rightInterval) {
    return {
      dimensionId: normalized.dimensionId,
      relation: "not_comparable",
      observed: false,
    };
  }
  const worstDifference = leftInterval.lower - rightInterval.upper;
  const bestDifference = leftInterval.upper - rightInterval.lower;
  let relation = "uncertain";
  if (worstDifference > normalized.minimumRelevantEffect) {
    relation = "left_superior";
  } else if (bestDifference < -normalized.minimumRelevantEffect) {
    relation = "right_superior";
  } else if (
    worstDifference >= -normalized.equivalenceMargin &&
    bestDifference <= normalized.equivalenceMargin
  ) {
    relation = "practically_equivalent";
  }
  return {
    dimensionId: normalized.dimensionId,
    relation,
    observed: true,
    worstDifference,
    bestDifference,
    minimumRelevantEffect: normalized.minimumRelevantEffect,
    equivalenceMargin: normalized.equivalenceMargin,
  };
}

export function intervalDominates(left, right, dimensions) {
  left = stabilizeJson(left);
  right = stabilizeJson(right);
  dimensions = stabilizeJson(dimensions);
  const registered =
    dimensions.every((dimension) => dimension.normalizedDirection)
      ? { used: dimensions }
      : decisionDimensions(dimensions);
  let practicallySuperior = false;
  for (const dimension of registered.used) {
    const leftInterval = normalizedInterval(left, dimension);
    const rightInterval = normalizedInterval(right, dimension);
    if (!leftInterval || !rightInterval) return false;
    const worstDifference = leftInterval.lower - rightInterval.upper;
    if (worstDifference < -dimension.equivalenceMargin) return false;
    if (worstDifference > dimension.minimumRelevantEffect) {
      practicallySuperior = true;
    }
  }
  return practicallySuperior;
}

export function rankCandidates(candidates, dimensions) {
  candidates = stabilizeJson(candidates);
  dimensions = stabilizeJson(dimensions);
  if (!Array.isArray(candidates) || candidates.length === 0) {
    throw new ValidationError("Candidates must be a non-empty array");
  }
  const candidateIds = candidates.map((candidate) => candidate?.candidateId);
  if (
    candidateIds.some(
      (candidateId) =>
        typeof candidateId !== "string" || candidateId.length === 0,
    ) ||
    new Set(candidateIds).size !== candidateIds.length
  ) {
    throw new ValidationError("Candidate IDs must be non-empty and unique");
  }
  const registered = decisionDimensions(dimensions);
  const remaining = [...candidates];
  const fronts = [];
  while (remaining.length > 0) {
    const front = remaining.filter(
      (candidate) =>
        !remaining.some(
          (other) =>
            other !== candidate &&
            intervalDominates(other, candidate, registered.used),
        ),
    );
    if (front.length === 0) {
      throw new ValidationError("Ranking could not form a non-dominated front");
    }
    fronts.push(
      front
        .map((candidate) => candidate.candidateId)
        .sort(bytewiseCompare),
    );
    const frontIds = new Set(front.map((candidate) => candidate.candidateId));
    for (let index = remaining.length - 1; index >= 0; index -= 1) {
      if (frontIds.has(remaining[index].candidateId)) remaining.splice(index, 1);
    }
  }
  return {
    fronts,
    nonDominated: fronts[0] ?? [],
    totalOrderSupported: fronts.every((front) => front.length === 1),
    excludedProtectedDimensions: registered.excludedProtected,
    inclusiveCandidateIds: [...candidateIds].sort(bytewiseCompare),
    uncertaintyAware: true,
  };
}

function pointCandidate(candidate, dimensions) {
  return {
    candidateId: candidate.candidateId,
    dimensions: Object.fromEntries(
      dimensions.map((dimension) => {
        const value = candidate.dimensions?.[dimension.dimensionId];
        if (!Number.isFinite(value)) {
          throw new ValidationError("Rank draw has a missing point value", {
            candidateId: candidate.candidateId,
            dimensionId: dimension.dimensionId,
          });
        }
        return [dimension.dimensionId, { lower: value, upper: value }];
      }),
    ),
  };
}

export function rankStabilityFromDraws(
  draws,
  dimensions,
  options = {},
) {
  draws = stabilizeJson(draws);
  dimensions = stabilizeJson(dimensions);
  options = stabilizeJson(options);
  const confidence = options.confidence ?? 0.95;
  if (
    !Number.isFinite(confidence) ||
    confidence <= 0 ||
    confidence >= 1
  ) {
    throw new ValidationError(
      "Rank-stability confidence must be strictly between zero and one",
      { confidence },
    );
  }
  const alpha = 1 - confidence;
  if (!Array.isArray(draws) || draws.length === 0) {
    throw new ValidationError("Rank stability requires registered resampling draws");
  }
  const registered = decisionDimensions(dimensions);
  const candidateIds = draws[0]
    .map((candidate) => candidate.candidateId)
    .sort(bytewiseCompare);
  if (
    candidateIds.length === 0 ||
    new Set(candidateIds).size !== candidateIds.length ||
    draws.some(
      (draw) =>
        JSON.stringify(draw.map((candidate) => candidate.candidateId).sort(bytewiseCompare)) !==
        JSON.stringify(candidateIds),
    )
  ) {
    throw new ValidationError("Every rank draw must contain the same candidates");
  }
  const ranks = Object.fromEntries(candidateIds.map((candidateId) => [candidateId, []]));
  const pairwise = {};
  for (let left = 0; left < candidateIds.length; left += 1) {
    for (let right = left + 1; right < candidateIds.length; right += 1) {
      pairwise[`${candidateIds[left]}|${candidateIds[right]}`] = {
        leftBetter: 0,
        rightBetter: 0,
        tieOrNonDominated: 0,
      };
    }
  }
  for (const draw of draws) {
    const result = rankCandidates(
      draw.map((candidate) => pointCandidate(candidate, registered.used)),
      registered.used,
    );
    result.fronts.forEach((front, index) => {
      for (const candidateId of front) ranks[candidateId].push(index + 1);
    });
    for (const [key, counts] of Object.entries(pairwise)) {
      const [leftId, rightId] = key.split("|");
      const leftRank = ranks[leftId].at(-1);
      const rightRank = ranks[rightId].at(-1);
      if (leftRank < rightRank) counts.leftBetter += 1;
      else if (rightRank < leftRank) counts.rightBetter += 1;
      else counts.tieOrNonDominated += 1;
    }
  }
  const candidateStability = Object.fromEntries(
    candidateIds.map((candidateId) => {
      const values = ranks[candidateId];
      return [
        candidateId,
        {
          medianRank: quantile(values, 0.5),
          rankInterval: {
            lower: quantile(values, alpha / 2),
            upper: quantile(values, 1 - alpha / 2),
            confidence,
          },
          proportionRankedBest:
            values.filter((rank) => rank === 1).length / values.length,
          rankDistribution: Object.fromEntries(
            [...new Set(values)]
              .sort((left, right) => left - right)
              .map((rank) => [
                String(rank),
                values.filter((value) => value === rank).length / values.length,
              ]),
          ),
        },
      ];
    }),
  );
  const pairwiseStability = Object.fromEntries(
    Object.entries(pairwise).map(([key, counts]) => [
      key,
      {
        leftBetter: counts.leftBetter / draws.length,
        rightBetter: counts.rightBetter / draws.length,
        tieOrNonDominated: counts.tieOrNonDominated / draws.length,
      },
    ]),
  );
  return {
    resampleCount: draws.length,
    candidateStability,
    pairwiseStability,
    excludedProtectedDimensions: registered.excludedProtected,
    proportionsArePosteriorProbabilities: false,
  };
}

export function governedSelectionProfile(candidates, dimensions) {
  candidates = stabilizeJson(candidates);
  dimensions = stabilizeJson(dimensions);
  const inclusiveProfiles = candidates.map((candidate) => ({
    candidateId: candidate.candidateId,
    feasible: candidate.feasible !== false,
    dimensions: candidate.dimensions,
  }));
  const eligible = candidates.filter((candidate) => candidate.feasible !== false);
  if (eligible.length === 0) {
    return {
      inclusiveProfiles,
      eligibleCandidateIds: [],
      ranking: null,
      status: "no_candidate_passed_preregistered_guardrails",
    };
  }
  return {
    inclusiveProfiles,
    eligibleCandidateIds: eligible
      .map((candidate) => candidate.candidateId)
      .sort(bytewiseCompare),
    ranking: rankCandidates(eligible, dimensions),
    status: "ranked_with_uncertainty",
  };
}
