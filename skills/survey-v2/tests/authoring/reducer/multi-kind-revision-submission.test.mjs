import assert from "node:assert/strict";
import test from "node:test";
import {
  createCanonicalSubmission,
  issueTextAssignment,
  sealAuthoringRequest,
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  revisionUnitDigest,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  createReducerSubmissionScenario,
  deterministicTestProjectionRenderer,
  executableDigest,
  executeReducerSubmission,
  passRegistrySource,
  reducerCommandBase,
  rehashAuthority,
  trustedReducerInputs,
  validBriefProduct,
} from "./support.mjs";

const appendixTarget = {
  slot: "appendix",
  resourceType: {
    apiVersion: "appendix.example/v1alpha1",
    kind: "Appendix",
  },
  cardinality: { min: 1, max: 1 },
};

function extendAuthorityWithAppendix({ profile }) {
  profile.spec.schemaBindings.push({
    id: "appendix-schema",
    resourceType: structuredClone(appendixTarget.resourceType),
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
  footprint.created.push(structuredClone(appendixTarget));
  footprint.activeHeadSlots.push(appendixTarget.slot);
  footprint.handoffSlots.push(appendixTarget.slot);

  const revisionUnit = profile.spec.revisionUnits[0];
  revisionUnit.replacementTargets =
    structuredClone(footprint.created);
  revisionUnit.unitDigest = revisionUnitDigest(revisionUnit);
}

function appendixProduct(name, note) {
  return {
    slot: "appendix",
    resource: {
      apiVersion: "appendix.example/v1alpha1",
      kind: "Appendix",
      metadata: { name },
      spec: { note },
    },
    dependencies: [],
  };
}

function addAppendixExecutables(registry, invoke = () => ({
  status: "pass",
})) {
  registry.validators.push(
    {
      id: "appendix-schema-module",
      digest: executableDigest(),
      invoke,
    },
    {
      id: "appendix-validator",
      digest: executableDigest(),
      invoke,
    },
  );
  return registry;
}

function commitMutation(workspace, mutation) {
  for (const created of mutation.spec.createdResources) {
    workspace.spec.resourceVersions.push({
      reference: structuredClone(created.reference),
      integrityDigest: created.integrityDigest,
      resource: structuredClone(created.resource),
    });
  }
  for (const change of mutation.spec.activeHeadChanges) {
    const current = workspace.spec.activeHeads.find(
      (head) => head.slot === change.slot,
    );
    assert.deepEqual(
      current?.reference ?? null,
      change.before,
      `pre-commit head ${change.slot}`,
    );
    if (current === undefined) {
      workspace.spec.activeHeads.push({
        slot: change.slot,
        reference: structuredClone(change.after),
      });
    } else {
      current.reference = structuredClone(change.after);
    }
  }
  workspace.spec.dependencyEdges.push(
    ...structuredClone(mutation.spec.dependencyEdges.created),
  );
  workspace.spec.handoffProducts =
    structuredClone(mutation.spec.handoffProducts);
  workspace.spec.authoringState =
    mutation.spec.nextAuthoringState;
  workspace.spec.semanticRevision =
    mutation.spec.expected.semanticRevision + 1;
  workspace.spec.openAssignment = null;
}

function exactKindValidator(expectedKind, executableId, calls) {
  return (input) => {
    calls.push({
      executableId,
      phase: input.phase,
      kind: input.resource.kind,
    });
    if (input.resource.kind === expectedKind) {
      return { status: "pass" };
    }
    return {
      status: "reject",
      issues: [{
        code: "RESOURCE_KIND_REJECTED",
        field: "/kind",
        reason: `${executableId} received the wrong resource kind.`,
        correction: "Dispatch the validator pinned for this resource kind.",
      }],
    };
  };
}

test(
  "one sealed revision submission atomically replaces an ordered Brief and Appendix group through each kind's exact validators",
  async () => {
    const scenario = await createReducerSubmissionScenario({
      mutateAuthority: extendAuthorityWithAppendix,
    });
    const initialProducts = [
      validBriefProduct(scenario, { name: "launch-brief-v1" }),
      appendixProduct(
        "launch-appendix-v1",
        "Initial companion output.",
      ),
    ];
    const initialRegistry = addAppendixExecutables(
      passRegistrySource({
        handlerInvoke: () => ({
          status: "accept",
          products: initialProducts,
        }),
      }),
    );
    const initialResult = await executeReducerSubmission(
      scenario,
      initialRegistry,
    );
    assert.equal(initialResult.kind, "mutation");
    assert.deepEqual(
      initialResult.mutation.spec.createdResources.map(
        (created) => created.slot,
      ),
      ["brief", "appendix"],
    );

    commitMutation(scenario.workspace, initialResult.mutation);
    rehashAuthority(scenario);
    const initialHeads = scenario.profile.spec.revisionUnits[0]
      .replacementTargets.map((target) => {
        const head = scenario.workspace.spec.activeHeads.find(
          (candidate) => candidate.slot === target.slot,
        );
        assert.notEqual(head, undefined);
        return structuredClone(head);
      });

    const revisionIssueRegistry = addAppendixExecutables(
      passRegistrySource(),
    );
    const revisionTrust = await trustedReducerInputs({
      executables: revisionIssueRegistry,
    });
    const revisionTask = reduceAuthoring(
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
      revisionTrust,
    );
    assert.equal(revisionTask.kind, "task");
    assert.deepEqual(
      revisionTask.request.spec.operation.expectedHeads,
      initialHeads,
    );

    const request = sealAuthoringRequest(revisionTask.request, {
      validateRequestContract: revisionTrust.validateContract,
    });
    const revisionUnit = scenario.profile.spec.revisionUnits[0];
    const projectionBinding =
      scenario.profile.spec.projectionBindings.find(
        (binding) =>
          binding.id ===
          revisionUnit.assignmentContract.projectionBindingId,
      );
    assert.notEqual(projectionBinding, undefined);
    const issued = issueTextAssignment({
      request,
      contextClosure: revisionTask.contextClosure,
      formDefinition: scenario.revisionFormDefinition,
      projectionBinding,
      projectionName: "multi-kind-revision-projection-k12",
      assignmentName: "multi-kind-revision-assignment-k12",
      renderProjection: deterministicTestProjectionRenderer,
    });
    const normalizedValues = {
      summary: "A revised concise launch brief.",
      reason: "The Brief and Appendix must advance atomically.",
    };
    const submission = createCanonicalSubmission({
      name: "multi-kind-revision-submission-k12",
      request,
      contextClosure: revisionTask.contextClosure,
      assignment: issued.assignment,
      projectionArtifact: issued.projectionArtifact,
      projectionBinding,
      formDefinition: scenario.revisionFormDefinition,
      normalizedValues,
      rawEvidenceBytes: Buffer.from(
        [
          normalizedValues.summary,
          normalizedValues.reason,
          "",
        ].join("\n"),
        "utf8",
      ),
      producerProvenance: {
        producerId: "text-adapter",
        producerClass: "adapter",
        evidenceDigest: executableDigest(),
      },
      renderProjection: deterministicTestProjectionRenderer,
    });

    const replacementProducts = [
      {
        slot: "brief",
        resource: {
          apiVersion: "brief.example/v1alpha1",
          kind: "Brief",
          metadata: { name: "launch-brief-v2" },
          spec: { summary: normalizedValues.summary },
        },
        dependencies: [],
      },
      appendixProduct(
        "launch-appendix-v2",
        "Revised atomically with the Brief.",
      ),
    ];
    const validatorCalls = [];
    const submissionRegistry = addAppendixExecutables(
      passRegistrySource({
        handlerInvoke: () => ({
          status: "accept",
          products: replacementProducts,
        }),
      }),
    );
    submissionRegistry.validators[0].invoke = exactKindValidator(
      "Brief",
      "brief-schema-module",
      validatorCalls,
    );
    submissionRegistry.validators[1].invoke = exactKindValidator(
      "Brief",
      "brief-validator",
      validatorCalls,
    );
    submissionRegistry.validators[2].invoke = exactKindValidator(
      "Appendix",
      "appendix-schema-module",
      validatorCalls,
    );
    submissionRegistry.validators[3].invoke = exactKindValidator(
      "Appendix",
      "appendix-validator",
      validatorCalls,
    );
    const revisionResult = reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      {
        class: "submit",
        request,
        assignment: issued.assignment,
        submission,
        externalCouplings: [],
      },
      await trustedReducerInputs({
        executables: submissionRegistry,
        inventory: [
          revisionTask.contextClosure,
          scenario.formDefinition,
          scenario.revisionFormDefinition,
          issued.projectionArtifact,
          scenario.runtimeProtocol,
        ],
      }),
    );

    assert.equal(revisionResult.kind, "mutation");
    const mutation = revisionResult.mutation;
    assert.equal(mutation.spec.cause.edge.transitionId, "AR01");
    assert.equal(mutation.spec.expected.semanticRevision, 1);
    assert.deepEqual(
      mutation.spec.createdResources.map((created) => ({
        slot: created.slot,
        kind: created.resource.kind,
        name: created.resource.metadata.name,
      })),
      [
        {
          slot: "brief",
          kind: "Brief",
          name: "launch-brief-v2",
        },
        {
          slot: "appendix",
          kind: "Appendix",
          name: "launch-appendix-v2",
        },
      ],
    );
    assert.deepEqual(
      mutation.spec.activeHeadChanges.map((change) => ({
        slot: change.slot,
        before: change.before.name,
        after: change.after.name,
      })),
      [
        {
          slot: "brief",
          before: "launch-brief-v1",
          after: "launch-brief-v2",
        },
        {
          slot: "appendix",
          before: "launch-appendix-v1",
          after: "launch-appendix-v2",
        },
      ],
    );
    assert.deepEqual(
      mutation.spec.supersededResources,
      initialHeads.map((head) => head.reference),
    );
    assert.deepEqual(validatorCalls, [
      {
        executableId: "brief-schema-module",
        phase: "created-resource-structure",
        kind: "Brief",
      },
      {
        executableId: "brief-validator",
        phase: "created-resource-semantics",
        kind: "Brief",
      },
      {
        executableId: "appendix-schema-module",
        phase: "created-resource-structure",
        kind: "Appendix",
      },
      {
        executableId: "appendix-validator",
        phase: "created-resource-semantics",
        kind: "Appendix",
      },
    ]);
  },
);
