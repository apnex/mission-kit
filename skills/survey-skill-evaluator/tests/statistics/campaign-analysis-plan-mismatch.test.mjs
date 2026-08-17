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

test("campaign analysis rejects a supplied dependence plan that differs from its preregistered digest", async () => {
  const metricRegistry = JSON.parse(
    await readFile(
      join(packageRoot, "source/manifests/metrics.json"),
      "utf8",
    ),
  );
  const suppliedPlan = {
    ...campaignDependencePlanFixture(),
    blockFields: ["scenarioId", "blockId"],
  };
  assert.throws(
    () =>
      analyzeCampaignAssignments({
        campaignId: "dependence-plan-mismatch",
        analysisPlan: campaignAnalysisPlanFixture(),
        metricRegistry,
        dependencePlan: suppliedPlan,
        assignmentResults: [
          {
            assignmentId: "candidate-1",
            armId: "candidate",
            blockId: "block-1",
            scenarioId: "scenario-1",
            stratumId: "all",
            metricOutcomes: {
              SEMANTIC_INTENT_ATOMS: {
                status: "observed",
                value: 1,
              },
              DOWNSTREAM_UTILITY: {
                status: "observed",
                value: 1,
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
        evidenceRefs: ["e".repeat(64)],
      }),
    /outside the implemented sealed analysis adapter/u,
  );
});
