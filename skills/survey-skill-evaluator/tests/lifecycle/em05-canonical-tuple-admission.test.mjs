import assert from "node:assert/strict";
import test from "node:test";
import {
  AuthorizationError,
  ConflictError,
} from "../../source/executables/engine/index.mjs";
import {
  makeCanonicalLifecycleFixture,
} from "../helpers/canonical-lifecycle-fixture.mjs";

test("EM05 canonical lifecycle tuples alone authorize state mutation and reject wrong authority or source state", async (t) => {
  const fixture = await makeCanonicalLifecycleFixture({
    transitionIds: ["EC04", "EC05"],
  });
  t.after(fixture.cleanup);
  await fixture.seed({
    transitionId: "EC04",
    objectId: "em05-campaign",
  });

  const unauthorized = fixture.commandFor({
    transitionId: "EC04",
    objectId: "em05-campaign",
    expectedRevision: 0,
    idempotencyKey: "em05/unauthorized",
    input: { assignmentRoot: "a".repeat(64) },
    authorityIds: ["candidate-owner"],
  });
  await assert.rejects(
    fixture.engine.execute(unauthorized),
    AuthorizationError,
  );

  const wrongSource = fixture.commandFor({
    transitionId: "EC05",
    objectId: "em05-campaign",
    expectedRevision: 0,
    idempotencyKey: "em05/wrong-source",
    input: { executionFence: 1 },
  });
  await assert.rejects(fixture.engine.execute(wrongSource), ConflictError);

  const accepted = fixture.commandFor({
    transitionId: "EC04",
    objectId: "em05-campaign",
    expectedRevision: 0,
    idempotencyKey: "em05/seal-assignments",
    input: { assignmentRoot: "a".repeat(64) },
  });
  await fixture.engine.execute(accepted);
  const state = await fixture.load("campaign", "em05-campaign", {
    required: true,
  });
  const event = state.authoritativeStateCore.eventLedger[0].core;
  const tuple = fixture.registry.transition("EC04");
  assert.equal(event.transitionId, tuple.transitionId);
  assert.equal(event.eventType, tuple.eventType);
  assert.equal(event.guardId, tuple.guardId);
  assert.equal(event.actionPipelineId, tuple.actionPipelineId);
  assert.equal(event.mutationId, tuple.mutationId);
  assert.equal(event.participantPolicyId, tuple.participantPolicyId);
});
