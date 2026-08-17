import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  HASH_PROFILE_ID,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function terminalOnlySequentialRule(inspectionSchedule = [2]) {
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    ruleId: "sequential-terminal-only",
    ruleClass: "valid_sequential",
    sampleUnit: "scenario_stratum_arm_cell",
    minimumAssignmentsPerCell: 1,
    maximumAssignmentsPerCell: 2,
    inspectionSchedule,
    repeatedInspectionMethodId: "registered-confidence-sequence",
    decisionPolicyDigest: hashCanonical(
      "stopping-decision-policy/v1",
      { policy: "terminal-only-fixture" },
    ),
    outcomeResponsiveStoppingPermitted: true,
  };
}

test("full role execution is driven by a sealed zero-interim-look stopping plan", async (t) => {
  await t.test(
    "terminal-only sequential declaration executes every assignment through the maximum",
    async (child) => {
      const fixture = await makeFullRoleCampaignFixture({
        stoppingRuleFixture: terminalOnlySequentialRule(),
      });
      child.after(fixture.cleanup);
      const result = await fixture.orchestrator.advance();
      assert.equal(result.state, "EC18_CLOSED");
      assert.equal(result.assignmentCount, 4);
      assert.equal(
        result.stoppingExecutionClass,
        "sequential_max_completion",
      );
      assert.equal(result.interimOutcomeLookCount, 0);

      const plan = await readJson(
        join(
          fixture.workspaceRoot,
          ".evaluator",
          "protected",
          "stopping-execution-plan.json",
        ),
      );
      assert.equal(
        plan.stoppingExecutionPlanDigest,
        result.stoppingExecutionPlanDigest,
      );
      assert.equal(plan.sequentialEfficacyClaimSupported, false);
      const envelope = await readJson(
        join(
          fixture.workspaceRoot,
          "results",
          "campaign-evidence-envelope.json",
        ),
      );
      assert.equal(
        envelope.derivationRoots.includes(
          plan.stoppingExecutionPlanDigest,
        ),
        true,
      );
    },
  );

  await t.test(
    "an interim outcome-look schedule is rejected before any assignment dispatch",
    async (child) => {
      const fixture = await makeFullRoleCampaignFixture({
        stoppingRuleFixture:
          terminalOnlySequentialRule([1, 2]),
      });
      child.after(fixture.cleanup);
      await assert.rejects(
        fixture.orchestrator.advance(),
        /Interim or repeated outcome looks are unsupported/u,
      );
      assert.equal(fixture.invocations.length, 0);
      await assert.rejects(
        access(
          join(
            fixture.workspaceRoot,
            ".evaluator",
            "protected",
            "assignment-map.json",
          ),
        ),
      );
    },
  );
});
