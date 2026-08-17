import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  campaignScenarioFixture,
} from "../helpers/campaign-fixture.mjs";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

function containsForbiddenKey(value, forbidden) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) {
    return value.some((entry) =>
      containsForbiddenKey(entry, forbidden)
    );
  }
  return Object.entries(value).some(
    ([key, child]) =>
      forbidden.has(key) ||
      containsForbiddenKey(child, forbidden),
  );
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("full role campaign consumes every scenario and externally allocated reviewer slot before outcomes", async (t) => {
  const fixture = await makeFullRoleCampaignFixture({
    scenarioFixtures: [
      campaignScenarioFixture({
        scenarioId: "scenario-1",
        workItem: "Exercise the first sealed scenario.",
      }),
      campaignScenarioFixture({
        scenarioId: "scenario-2",
        workItem: "Exercise the second sealed scenario.",
      }),
    ],
  });
  t.after(fixture.cleanup);

  const result = await fixture.orchestrator.advance();
  assert.equal(result.assignmentCount, 4);
  assert.equal(result.subjectExecutionCount, 4);
  assert.equal(result.independentBallotCount, 8);
  assert.equal(fixture.scenarioAuthority.invocations.length, 1);
  assert.equal(fixture.reviewerAuthority.invocations.length, 1);

  const scenarioRequest = fixture.scenarioAuthority.invocations[0];
  assert.equal(scenarioRequest.scenarioBindings.length, 2);
  assert.equal(
    containsForbiddenKey(
      scenarioRequest,
      new Set([
        "armId",
        "armMap",
        "candidateId",
        "candidateBytes",
        "expectedDirection",
        "outcome",
        "ballot",
      ]),
    ),
    false,
  );

  const reviewerRequest = fixture.reviewerAuthority.invocations[0];
  assert.equal(reviewerRequest.assignmentFamily.length, 4);
  assert.equal(reviewerRequest.armMapDisclosed, false);
  assert.equal(reviewerRequest.outcomeInputsAvailable, false);
  assert.equal(
    reviewerRequest.assignmentFamily.every(
      (entry) =>
        entry.assignmentId.startsWith("subject-") &&
        entry.blindBundleId === entry.assignmentId,
    ),
    true,
  );

  const judgeInvocations = fixture.invocations.filter(
    (entry) => entry.roleClass === "semantic-judge",
  );
  assert.equal(judgeInvocations.length, 8);
  for (const invocation of judgeInvocations) {
    assert.equal(
      invocation.input.reviewAssignment.reviewerSelectionAuthority,
      false,
    );
    assert.equal(
      invocation.input.reviewAssignment.presentationOrderAuthority,
      false,
    );
    assert.equal(
      invocation.input.reviewRef.includes("judge-a") ||
        invocation.input.reviewRef.includes("judge-b"),
      false,
    );
  }

  const scenarioRecord = await readJson(
    join(
      fixture.workspaceRoot,
      ".evaluator",
      "protected",
      "scenario-material-authority.json",
    ),
  );
  const reviewerRecord = await readJson(
    join(
      fixture.workspaceRoot,
      ".evaluator",
      "protected",
      "reviewer-allocation-authority.json",
    ),
  );
  const envelope = await readJson(
    join(
      fixture.workspaceRoot,
      "results",
      "campaign-evidence-envelope.json",
    ),
  );
  assert.equal(
    scenarioRecord.authorityEnvelope.materials.length,
    2,
  );
  assert.equal(
    reviewerRecord.allocation.judgeAssignments.length,
    8,
  );
  assert.equal(
    envelope.evidenceRefs.includes(
      scenarioRecord.authorityEnvelope.authorityEnvelopeDigest,
    ),
    true,
  );
  assert.equal(
    envelope.evidenceRefs.includes(
      reviewerRecord.allocation.reviewerAllocationPlanDigest,
    ),
    true,
  );
});
