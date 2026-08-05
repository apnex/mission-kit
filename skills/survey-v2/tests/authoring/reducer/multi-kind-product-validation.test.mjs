import assert from "node:assert/strict";
import test from "node:test";
import {
  createReducerSubmissionScenario,
  executableDigest,
  executeReducerSubmission,
  passRegistrySource,
  validBriefProduct,
} from "./support.mjs";

const rejectedKind = {
  status: "reject",
  issues: [{
    code: "RESOURCE_KIND_REJECTED",
    field: "/kind",
    reason: "The validator received the wrong resource kind.",
    correction: "Dispatch the validator selected for this resource kind.",
  }],
};

function kindValidator(expectedKind, label, calls) {
  return (input) => {
    calls.push(`${label}:${input.resource.kind}`);
    return input.resource.kind === expectedKind
      ? { status: "pass" }
      : rejectedKind;
  };
}

test(
  "a multi-kind task output resolves structural and semantic validation per product type",
  async () => {
    const scenario = await createReducerSubmissionScenario({
      mutateAuthority({ profile }) {
        profile.spec.revisionUnits = [];
        profile.spec.schemaBindings.push({
          id: "appendix-schema",
          resourceType: {
            apiVersion: "appendix.example/v1alpha1",
            kind: "Appendix",
          },
          schema: {
            id: "appendix-schema-module",
            digest: executableDigest(),
          },
          semanticValidator: {
            id: "appendix-validator",
            digest: executableDigest(),
          },
        });
        profile.spec.validatorSets.push({
          id: "appendix-validator-set",
          digest: executableDigest(),
          members: [{
            id: "appendix-validator",
            digest: executableDigest(),
          }],
        });
        const footprint =
          profile.spec.transitionBindings[0].mutationFootprint;
        footprint.created.push({
          slot: "appendix",
          resourceType: {
            apiVersion: "appendix.example/v1alpha1",
            kind: "Appendix",
          },
          cardinality: { min: 1, max: 1 },
        });
        footprint.activeHeadSlots.push("appendix");
        footprint.handoffSlots.push("appendix");
      },
    });
    const appendix = {
      slot: "appendix",
      resource: {
        apiVersion: "appendix.example/v1alpha1",
        kind: "Appendix",
        metadata: { name: "launch-appendix-k12" },
        spec: { note: "Atomic companion output." },
      },
      dependencies: [],
    };
    const calls = [];
    const registry = passRegistrySource({
      handlerInvoke: () => ({
        status: "accept",
        products: [validBriefProduct(scenario), appendix],
      }),
    });
    registry.validators[0].invoke = kindValidator(
      "Brief",
      "brief-schema",
      calls,
    );
    registry.validators[1].invoke = kindValidator(
      "Brief",
      "brief-semantic",
      calls,
    );
    registry.validators.push(
      {
        id: "appendix-schema-module",
        digest: executableDigest(),
        invoke: kindValidator("Appendix", "appendix-schema", calls),
      },
      {
        id: "appendix-validator",
        digest: executableDigest(),
        invoke: kindValidator("Appendix", "appendix-semantic", calls),
      },
    );
    const result = await executeReducerSubmission(scenario, registry);
    assert.equal(result.kind, "mutation");
    assert.deepEqual(
      result.mutation.spec.createdResources.map(
        (entry) => entry.resource.kind,
      ),
      ["Brief", "Appendix"],
    );
    assert.deepEqual(calls, [
      "brief-schema:Brief",
      "brief-semantic:Brief",
      "appendix-schema:Appendix",
      "appendix-semantic:Appendix",
    ]);
  },
);
