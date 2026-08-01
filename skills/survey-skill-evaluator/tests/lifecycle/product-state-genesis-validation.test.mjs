import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  LifecycleEngine,
  LifecycleRegistry,
  RuntimeProductStateValidator,
  SchemaValidator,
  StateStore,
  ValidationError,
} from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/package-root.mjs";

const manifest = {
  schemaVersion: "1.0.0",
  machines: [
    {
      machineId: "sample",
      transitions: [
        {
          transitionId: "S01",
          machineId: "sample",
          eventType: "OPEN",
          fromState: "OPEN",
          toState: "DONE",
          creationClass: "existing",
          guardId: "always",
          actionPipelineId: "none",
          mutationId: "merge",
          participantPolicyId: "sample-owner",
          idempotencyClass: "exact_replay",
          failureRoute: "quarantine.sample",
          learningTriggerPolicyId: "none",
        },
      ],
    },
  ],
  participantPolicies: [
    {
      participantPolicyId: "sample-owner",
      commandAuthority: { kind: "single", authorityId: "owner" },
    },
  ],
  actionPipelines: [{ actionPipelineId: "none", actions: [] }],
};

function parentBinding() {
  return {
    parentMachineId: "parent",
    parentObjectId: "sample-parent",
    parentPriorAuthoritativeRoot: "a".repeat(64),
    parentOrderId: "parent/sample",
    parentFence: 0,
  };
}

test("parent-staged genesis fails closed without the selected generated product-state contract", async (t) => {
  const schemaValidator = await SchemaValidator.fromPackageRoot(packageRoot);
  const registry = new LifecycleRegistry(manifest);
  assert.throws(
    () =>
      new StateStore({
        rootPath: "/tmp/not-used-product-state-validator",
        schemaVersion: "1.0.0",
        productStateValidator: { validate: () => ({ valid: true }) },
      }),
    ValidationError,
  );

  const missingRoot = await mkdtemp(join(tmpdir(), "product-state-missing-"));
  t.after(() => rm(missingRoot, { recursive: true, force: true }));
  const missingStore = new StateStore({
    rootPath: missingRoot,
    schemaVersion: "1.0.0",
  });
  await missingStore.initialize();
  await assert.rejects(
    new LifecycleEngine({
      registry,
      stateStore: missingStore,
    }).createParentStagedGenesis({
      machineId: "sample",
      objectId: "sample-missing",
      initialState: "OPEN",
      parentBinding: parentBinding(),
    }),
    ValidationError,
  );

  const wrongRoot = await mkdtemp(join(tmpdir(), "product-state-wrong-"));
  t.after(() => rm(wrongRoot, { recursive: true, force: true }));
  const wrongStore = new StateStore({
    rootPath: wrongRoot,
    schemaVersion: "1.0.0",
    productStateValidator: new RuntimeProductStateValidator({
      schemaValidator,
      registry,
      schemaByMachine: {
        sample: {
          schemaId: "campaign-state",
          idField: "campaignId",
        },
      },
    }),
  });
  await wrongStore.initialize();
  await assert.rejects(
    new LifecycleEngine({
      registry,
      stateStore: wrongStore,
    }).createParentStagedGenesis({
      machineId: "sample",
      objectId: "sample-wrong",
      initialState: "OPEN",
      parentBinding: parentBinding(),
    }),
    ValidationError,
  );
  assert.equal(await wrongStore.load("sample", "sample-wrong"), null);
});
