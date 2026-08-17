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

test("campaign analysis rejects a registry metric whose causal aggregation adapter is not implemented", async () => {
  const metricRegistry = JSON.parse(
    await readFile(
      join(packageRoot, "source/manifests/metrics.json"),
      "utf8",
    ),
  );
  const plan = structuredClone(campaignAnalysisPlanFixture());
  plan.primaryMetricIds = ["ATTENTION_TOIL"];
  assert.throws(
    () =>
      analyzeCampaignAssignments({
        campaignId: "unsupported-causal-metric",
        analysisPlan: plan,
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
              ATTENTION_TOIL: {
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
              ATTENTION_TOIL: {
                status: "observed",
                value: 2,
              },
              DOWNSTREAM_UTILITY: {
                status: "observed",
                value: 0,
              },
            },
          },
        ],
        evidenceRefs: ["d".repeat(64)],
      }),
    /implemented canonical causal recipe/u,
  );
});
