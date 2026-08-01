import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("irrecoverable role failure closes every assigned, attempt, review, capacity, and awareness position", async (t) => {
  let injected = false;
  const fixture = await makeFullRoleCampaignFixture({
    onInvocation(entry) {
      if (
        !injected &&
        entry.roleClass === "downstream-consumer"
      ) {
        injected = true;
        throw new Error("irrecoverable fixture role failure");
      }
    },
  });
  t.after(fixture.cleanup);

  const result = await fixture.orchestrator.advance();
  assert.equal(result.state, "EC_FAILED_CLOSED");
  assert.equal(result.executionClass, "sealed_role_campaign_failure");
  assert.equal(result.committedTransitions.length, 1);
  assert.equal(result.committedTransitions[0], "ECF04d");
  assert.equal(result.promotionAuthorized, false);

  const envelope = await readJson(
    join(
      fixture.workspaceRoot,
      "results",
      "campaign-failure-envelope.json",
    ),
  );
  assert.equal(envelope.admissible, false);
  assert.equal(
    envelope.issuedOrRetirementPendingGrantsRemaining,
    false,
  );
  const classCounts = Object.groupBy(
    envelope.positionDispositions,
    (position) => position.positionClass,
  );
  assert.equal(classCounts.assignment.length, 2);
  assert.equal(classCounts.attempt.length, 2);
  assert.equal(classCounts.review.length, 4);
  assert.equal(classCounts.capacity.length, 4);

  const state = await fixture.orchestrator.stateStore.load(
    "campaign",
    "campaign-fixture",
    { required: true },
  );
  const semantic = state.authoritativeStateCore.semanticState;
  assert.equal(semantic.state, "EC_FAILED_CLOSED");
  assert.equal(semantic.data.failurePreparation.sourcePhase, "EC7_DOWNSTREAM_EXECUTING");
  assert.equal(
    semantic.data.failurePreparation.issuanceWindowsClosed,
    true,
  );
  assert.equal(
    semantic.data.failurePreparation.activationWindowsClosed,
    true,
  );
  assert.equal(
    semantic.data.awarenessUniverseRoot,
    envelope.awarenessClosureRoot,
  );
  await assert.rejects(
    access(
      join(fixture.workspaceRoot, "results", "analysis-result.json"),
    ),
  );
});
