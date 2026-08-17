import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import { LifecycleRegistry } from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/package-root.mjs";

test("foundation lifecycle tuples expand into the complete runtime selector", async () => {
  const registry = await LifecycleRegistry.fromFile(
    join(packageRoot, "source/manifests/lifecycles.json"),
  );
  assert.equal(registry.machines.size, 17);
  assert.equal(registry.transitions.size, 267);
  assert.deepEqual(registry.transition("AW00"), {
    transitionId: "AW00",
    machineId: "awareness",
    eventType: "REGISTER_OBLIGATION",
    fromState: "absent",
    toState: "AW0_REGISTERED",
    creationClass: "absent",
    guardId: "guard.AW00",
    actionPipelineId: "action.AW00",
    mutationId: "mutation.AW00",
    participantPolicyId: "participants.AW00",
    idempotencyClass: "create_once",
    failureRoute: "quarantine.awareness",
    learningTriggerPolicyId: "none",
  });
  assert.equal(
    registry.transition("EC21").learningTriggerPolicyId,
    "material_finding",
  );
  assert.equal(registry.transition("EC01").creationClass, "existing");
});
