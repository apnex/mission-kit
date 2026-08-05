import assert from "node:assert/strict";
import test from "node:test";
import {
  createReducerSubmissionScenario,
  executeReducerSubmission,
  passRegistrySource,
  validBriefProduct,
} from "./support.mjs";

test(
  "the reducer constructs the exact manifest-bounded mutation from an admitted handler result",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    const product = validBriefProduct(scenario);
    const result = await executeReducerSubmission(
      scenario,
      passRegistrySource({
        handlerInvoke: () => ({
          status: "accept",
          products: [product],
        }),
      }),
    );
    assert.equal(result.kind, "mutation");
    assert.deepEqual(
      {
        created: result.mutation.spec.createdResources.map(
          (entry) => entry.slot,
        ),
        heads: result.mutation.spec.activeHeadChanges.map(
          (entry) => entry.slot,
        ),
        nextState: result.mutation.spec.nextAuthoringState,
        handoffs: result.mutation.spec.handoffProducts.map(
          (entry) => entry.slot,
        ),
      },
      {
        created: ["brief"],
        heads: ["brief"],
        nextState: "awaiting_acceptance",
        handoffs: ["brief"],
      },
    );
    assert.equal(
      result.mutation.metadata.name,
      `mutation-${result.mutation.spec.mutationDigest.slice(7)}`,
    );
  },
);
