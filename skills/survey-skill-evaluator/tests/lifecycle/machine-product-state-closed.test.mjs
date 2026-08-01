import assert from "node:assert/strict";
import test from "node:test";
import {
  LifecycleEngine,
  ValidationError,
} from "../../source/executables/engine/index.mjs";
import { makeCampaignFixture } from "../helpers/campaign-fixture.mjs";

test("campaign genesis rejects an undeclared semantic product-state field before persistence", async (t) => {
  const fixture = await makeCampaignFixture();
  t.after(fixture.cleanup);
  const source = await fixture.orchestrator.stateStore.load(
    "campaign",
    "campaign-fixture",
    { required: true },
  );
  const validData = source.authoritativeStateCore.semanticState.semantic;
  const engine = new LifecycleEngine({
    registry: fixture.orchestrator.registry,
    stateStore: fixture.orchestrator.stateStore,
  });
  await assert.rejects(
    engine.createParentStagedGenesis({
      machineId: "campaign",
      objectId: "campaign-with-undeclared-state",
      initialState: "EC0_DRAFT",
      initialData: {
        ...Object.fromEntries(
          Object.entries(validData).filter(([key]) => key !== "state"),
        ),
        bogusUndeclaredField: true,
      },
      parentBinding: {
        parentMachineId: "test-parent",
        parentObjectId: "campaign-with-undeclared-state",
        parentPriorAuthoritativeRoot: "a".repeat(64),
        parentOrderId: "test-parent/campaign-with-undeclared-state",
        parentFence: 0,
      },
    }),
    (error) =>
      error instanceof ValidationError &&
      /generated schema/u.test(error.message),
  );
  assert.equal(
    await fixture.orchestrator.stateStore.load(
      "campaign",
      "campaign-with-undeclared-state",
    ),
    null,
  );
});
