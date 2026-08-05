import assert from "node:assert/strict";
import test from "node:test";
import {
  createReducerSubmissionScenario,
  executeReducerSubmission,
  passRegistrySource,
  reducerCommandBase,
  rehashAuthority,
  trustedReducerInputs,
  validBriefProduct,
} from "./support.mjs";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";

test(
  "the reducer issues one manifest-owned revision request from the named unit and event",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    const committedPlan = await executeReducerSubmission(
      scenario,
      passRegistrySource({
        handlerInvoke: () => ({
          status: "accept",
          products: [validBriefProduct(scenario)],
        }),
      }),
    );
    assert.equal(committedPlan.kind, "mutation");
    const created = committedPlan.mutation.spec.createdResources[0];
    scenario.workspace.spec.resourceVersions.push({
      reference: structuredClone(created.reference),
      integrityDigest: created.integrityDigest,
      resource: structuredClone(created.resource),
    });
    scenario.workspace.spec.activeHeads.push({
      slot: "brief",
      reference: structuredClone(created.reference),
    });
    scenario.workspace.spec.authoringState = "awaiting_acceptance";
    scenario.workspace.spec.semanticRevision = 1;
    rehashAuthority(scenario);
    const result = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      {
        class: "revise",
        unitId: "brief-unit",
        eventId: "REVISE",
        base: reducerCommandBase(scenario.workspace),
        inputs: {},
      },
      await trustedReducerInputs({
        executables: passRegistrySource(),
      }),
    );
    assert.equal(result.kind, "task");
    assert.equal(result.request.spec.operation.class, "revision");
    assert.equal(result.request.spec.operation.unit.id, "brief-unit");
    assert.equal(result.request.spec.operation.plan.id, "before-freeze");
    assert.equal(result.request.spec.base.semanticRevision, 1);
    assert.deepEqual(
      result.request.spec.operation.expectedHeads.map(
        (head) => head.slot,
      ),
      ["brief"],
    );
  },
);
