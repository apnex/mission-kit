import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  analyzeCampaignAssignments,
} from "../../source/executables/orchestrator/index.mjs";
import {
  campaignAnalysisPlanFixture,
  campaignDependencePlanFixture,
  packageRoot,
} from "../helpers/campaign-fixture.mjs";

test("a wholly unobserved arm remains in the registered family as typed non-estimable evidence", async () => {
  const metricRegistry = JSON.parse(
    await readFile(
      join(packageRoot, "source/manifests/metrics.json"),
      "utf8",
    ),
  );
  const result = analyzeCampaignAssignments({
    campaignId: "campaign-analysis-nonestimable-arm",
    analysisPlan: campaignAnalysisPlanFixture(),
    metricRegistry,
    dependencePlan: campaignDependencePlanFixture(),
    assignmentResults: [
      {
        assignmentId: "candidate-1",
        armId: "candidate",
        blockId: "block-1",
        scenarioId: "scenario-1",
        stratumId: "all",
        metricOutcomes: {
          SEMANTIC_INTENT_ATOMS: {
            status: "not_judgeable",
            value: null,
          },
          DOWNSTREAM_UTILITY: {
            status: "infrastructure_failure",
            value: null,
          },
        },
      },
      {
        assignmentId: "control-1",
        armId: "control",
        blockId: "block-1",
        scenarioId: "scenario-1",
        stratumId: "all",
        metricOutcomes: {
          SEMANTIC_INTENT_ATOMS: {
            status: "observed",
            value: 0,
          },
          DOWNSTREAM_UTILITY: {
            status: "observed",
            value: 0,
          },
        },
      },
    ],
    evidenceRefs: ["c".repeat(64)],
  });

  assert.equal(result.effects.length, 2);
  assert.equal(
    result.effects.every(
      (effect) =>
        effect.status === "not_estimable" &&
        effect.estimate === null &&
        effect.practicalClass === "uncertain",
    ),
    true,
  );
  assert.equal(
    result.derivation.fwer.results.every(
      (finding) =>
        finding.pValue === 1 &&
        finding.rejected === false,
    ),
    true,
  );
  assert.equal(result.ranking.totalOrderSupported, false);
  assert.deepEqual(result.ranking.candidateRankResults, []);
  assert.deepEqual(
    result.ranking.nonDominatedCandidateIds,
    ["candidate", "control"],
  );
});
