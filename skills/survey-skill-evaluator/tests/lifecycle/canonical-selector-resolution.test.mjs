import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import {
  LifecycleRegistry,
  SchemaValidator,
} from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/package-root.mjs";

test("all 267 selectors resolve only through canonical policy and action bodies", async () => {
  const registry = await LifecycleRegistry.fromFile(
    join(packageRoot, "source/manifests/lifecycles.json"),
  );
  const schemas = await SchemaValidator.fromPackageRoot(packageRoot);
  for (const transition of registry.transitions.values()) {
    const policy = registry.participantPolicy(
      transition.participantPolicyId,
    );
    const pipeline = registry.actionPipeline(transition.actionPipelineId);
    const guard = registry.guard(transition.guardId);
    const mutation = registry.mutation(transition.mutationId);
    assert.equal(
      schemas.check("transition-participant-policy", policy).valid,
      true,
      transition.transitionId,
    );
    assert.deepEqual(pipeline.actions, policy.orderedActionExecutors);
    assert.equal(guard.guardId, `guard.${transition.transitionId}`);
    assert.equal(guard.ownerAuthorityId, policy.guardOwnerId);
    assert.equal(mutation.mutationId, `mutation.${transition.transitionId}`);
  }
});
