import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import {
  campaignDependencePlanFixture,
} from "../helpers/campaign-fixture.mjs";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

test("protected assignments bind an arm-neutral within-block randomization that exactly matches the analysis resampler", async (t) => {
  const fixture = await makeFullRoleCampaignFixture();
  t.after(fixture.cleanup);
  const result = await fixture.orchestrator.advance();
  assert.equal(result.state, "EC18_CLOSED");

  const assignmentMap = JSON.parse(
    await readFile(
      join(
        fixture.workspaceRoot,
        ".evaluator",
        "protected",
        "assignment-map.json",
      ),
      "utf8",
    ),
  );
  const dependencePlan = campaignDependencePlanFixture();
  assert.equal(
    assignmentMap.randomization.assignmentMechanism,
    "within_block_permutation",
  );
  assert.equal(
    assignmentMap.randomization.resamplerId,
    dependencePlan.resamplerId,
  );
  assert.equal(
    assignmentMap.randomization.seedCommitmentDigest,
    dependencePlan.seedCommitmentDigest,
  );
  assert.equal(
    assignmentMap.randomization.outcomeVisibleAtAssignment,
    false,
  );
  const byBlock = new Map();
  for (const assignment of assignmentMap.assignments) {
    const rows = byBlock.get(assignment.blockId) ?? [];
    rows.push(assignment);
    byBlock.set(assignment.blockId, rows);
    assert.equal(
      assignment.opaqueSubjectId.includes(assignment.armId),
      false,
    );
  }
  const blockPermutations = [...byBlock.entries()].map(
    ([blockId, rows]) => ({
      blockId,
      armOrder: rows.map((assignment) => assignment.armId),
    }),
  );
  for (const rows of byBlock.values()) {
    assert.deepEqual(
      rows.map((assignment) => assignment.armId).sort(),
      ["candidate", "control"],
    );
    assert.equal(
      new Set(
        rows.map((assignment) => assignment.opaqueSubjectId),
      ).size,
      rows.length,
    );
  }
  assert.equal(
    assignmentMap.randomization.blockPermutationDigest,
    hashCanonical(
      "protected-assignment-block-permutations/v1",
      blockPermutations,
    ),
  );
});
