import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  profileManifestDigest,
  resourceReferenceFrom,
  resourceSemanticDigest,
  workspaceIntegrityDigest,
  workspaceSemanticStateDigest,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  AuthoringExecutableRegistryError,
  compileExecutableRegistry,
} from "../../../source/authoring/kernel/executable-registry.mjs";
import {
  AuthoringManifestSelectionError,
  selectNextAuthority,
} from "../../../source/authoring/kernel/manifest-selection.mjs";
import {
  createCanonicalSubmission,
  issueTextAssignment,
  sealAuthoringRequest,
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  exactTextContent,
  renderBlankTextForm,
} from "../../../source/authoring/kernel/text-forms.mjs";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  contractValidators,
} from "../contracts/support/contract-validation.mjs";

const fixtureRoot = new URL(
  "../../fixtures/authoring/contracts/positive/",
  import.meta.url,
);

async function fixture(stem) {
  return JSON.parse(
    await readFile(new URL(`${stem}.json`, fixtureRoot), "utf8"),
  );
}

export async function loadReducerScenario() {
  const [profile, protocol, workspace] = await Promise.all([
    fixture("authoring-profile-manifest"),
    fixture("authoring-protocol"),
    fixture("authoring-workspace"),
  ]);
  return { profile, protocol, workspace };
}

export function rehashAuthority({ profile, protocol, workspace }) {
  profile.spec.protocol = resourceReferenceFrom(protocol);
  profile.spec.profileDigest = profileManifestDigest(profile);
  workspace.spec.profile = {
    reference: resourceReferenceFrom(profile),
    profileDigest: profile.spec.profileDigest,
  };
  workspace.spec.protocol = {
    reference: resourceReferenceFrom(protocol),
    protocolDigest: resourceSemanticDigest(protocol),
  };
  workspace.spec.integrity.semanticStateDigest =
    workspaceSemanticStateDigest(workspace);
  workspace.spec.integrity.workspaceIntegrityDigest =
    workspaceIntegrityDigest(workspace);
  return { profile, protocol, workspace };
}

export function reducerCommandBase(workspace) {
  return {
    authoringState: workspace.spec.authoringState,
    semanticRevision: workspace.spec.semanticRevision,
    semanticStateDigest:
      workspace.spec.integrity.semanticStateDigest,
    activeHeads: structuredClone(workspace.spec.activeHeads),
  };
}

export function executableDigest(fill = "e") {
  return `sha256:${fill.repeat(64)}`;
}

export const trustedHostKernel = Object.freeze({
  id: "authoring-kernel",
  digest: executableDigest(),
});

export function defaultProjectorInvoke({
  contextClosure,
  formDefinition,
  requestHandle,
}) {
  return {
    status: "accept",
    content: exactTextContent(renderBlankTextForm({
      formDefinition,
      contextClosure,
      requestHandle,
    })),
  };
}

export function deterministicTestProjectionRenderer({
  contextClosure,
  formDefinition,
  requestHandle,
}) {
  return renderBlankTextForm({
    formDefinition,
    contextClosure,
    requestHandle,
  });
}

export function passRegistry({
  guardInvoke = () => ({ status: "pass" }),
  handlerInvoke = () => ({ status: "accept", products: [] }),
  validatorInvoke = () => ({ status: "pass" }),
  projectorInvoke = defaultProjectorInvoke,
} = {}) {
  return compileExecutableRegistry({
    guards: [
      {
        id: "payload-guard",
        digest: executableDigest(),
        invoke: guardInvoke,
      },
    ],
    handlers: [
      {
        id: "brief-handler",
        digest: executableDigest(),
        invoke: handlerInvoke,
      },
      {
        id: "system-handler",
        digest: executableDigest(),
        invoke: handlerInvoke,
      },
    ],
    validators: [
      {
        id: "brief-schema-module",
        digest: executableDigest(),
        invoke: validatorInvoke,
      },
      {
        id: "brief-validator",
        digest: executableDigest(),
        invoke: validatorInvoke,
      },
    ],
    projectors: [
      {
        id: "text-projection-engine",
        digest: executableDigest(),
        invoke: projectorInvoke,
      },
    ],
  });
}

export function passRegistrySource({
  guardInvoke = () => ({ status: "pass" }),
  handlerInvoke = () => ({ status: "accept", products: [] }),
  validatorInvoke = () => ({ status: "pass" }),
  projectorInvoke = defaultProjectorInvoke,
} = {}) {
  return {
    guards: [
      {
        id: "payload-guard",
        digest: executableDigest(),
        invoke: guardInvoke,
      },
    ],
    handlers: [
      {
        id: "brief-handler",
        digest: executableDigest(),
        invoke: handlerInvoke,
      },
      {
        id: "system-handler",
        digest: executableDigest(),
        invoke: handlerInvoke,
      },
    ],
    validators: [
      {
        id: "brief-schema-module",
        digest: executableDigest(),
        invoke: validatorInvoke,
      },
      {
        id: "brief-validator",
        digest: executableDigest(),
        invoke: validatorInvoke,
      },
    ],
    projectors: [
      {
        id: "text-projection-engine",
        digest: executableDigest(),
        invoke: projectorInvoke,
      },
    ],
  };
}

const kindToStem = Object.freeze({
  AuthoringAssignment: "authoring-assignment",
  AuthoringFormDefinition: "authoring-form-definition",
  AuthoringMutation: "authoring-mutation",
  AuthoringProfileManifest: "authoring-profile-manifest",
  AuthoringProtocol: "authoring-protocol",
  AuthoringRequest: "authoring-request",
  AuthoringSubmission: "authoring-submission",
  AuthoringWorkspace: "authoring-workspace",
  ContextClosure: "context-closure",
  ProjectionArtifact: "projection-artifact",
  ValidationIssue: "validation-issue",
});

export async function trustedReducerInputs({
  executables,
  inventory,
  kernel = trustedHostKernel,
  validateContract: validateContractOverride,
} = {}) {
  const { byStem } = await contractValidators();
  const trusted = {
    kernel: structuredClone(kernel),
    validateContract: validateContractOverride ?? function validateContract(
      candidate,
    ) {
      const stem = kindToStem[candidate?.kind];
      return stem !== undefined && byStem.get(stem)(candidate) === true;
    },
  };
  if (executables !== undefined) trusted.executables = executables;
  if (inventory !== undefined) trusted.inventory = inventory;
  return trusted;
}

export async function createReducerSubmissionScenario({
  mutateAuthority,
} = {}) {
  const scenario = await loadReducerScenario();
  const [
    formDefinition,
    revisionFormDefinition,
    runtimeProtocol,
    fixtureMutation,
  ] = await Promise.all([
    fixture("authoring-form-definition"),
    fixture("revision-form-definition"),
    fixture("runtime-protocol"),
    fixture("authoring-mutation"),
  ]);
  if (mutateAuthority !== undefined) {
    mutateAuthority(scenario);
    rehashAuthority(scenario);
  }
  const requestTrust = await trustedReducerInputs();
  const taskResult = reduceAuthoring(
    scenario.profile,
    scenario.protocol,
    scenario.workspace,
    { class: "next", inputs: {} },
    requestTrust,
  );
  if (taskResult.kind !== "task") {
    throw new Error("submission support did not produce one task result");
  }
  const projectionBinding =
    scenario.profile.spec.projectionBindings[0];
  const request = sealAuthoringRequest(taskResult.request, {
    validateRequestContract: requestTrust.validateContract,
  });
  const issued = issueTextAssignment({
    request,
    contextClosure: taskResult.contextClosure,
    formDefinition,
    projectionBinding,
    projectionName: "brief-projection-k12",
    assignmentName: "brief-assignment-k12",
    renderProjection: deterministicTestProjectionRenderer,
  });
  const normalizedValues = {
    summary: "A concise launch brief.",
  };
  const submission = createCanonicalSubmission({
    name: "brief-submission-k12",
    request,
    contextClosure: taskResult.contextClosure,
    assignment: issued.assignment,
    projectionArtifact: issued.projectionArtifact,
    projectionBinding,
    formDefinition,
    normalizedValues,
    rawEvidenceBytes: Buffer.from(
      "A concise launch brief.\n",
      "utf8",
    ),
    producerProvenance: {
      producerId: "text-adapter",
      producerClass: "adapter",
      evidenceDigest: executableDigest(),
    },
    renderProjection: deterministicTestProjectionRenderer,
  });
  return {
    ...scenario,
    request,
    contextClosure: taskResult.contextClosure,
    formDefinition,
    revisionFormDefinition,
    projectionArtifact: issued.projectionArtifact,
    assignment: issued.assignment,
    submission,
    normalizedValues,
    externalCouplings: fixtureMutation.spec.externalCouplings,
    runtimeProtocol,
  };
}

export function validBriefProduct(
  scenario,
  {
    kind = "Brief",
    name = "launch-brief-k12",
    slot = "brief",
    dependencies = [],
  } = {},
) {
  return {
    slot,
    resource: {
      apiVersion: "brief.example/v1alpha1",
      kind,
      metadata: { name },
      spec: {
        summary: scenario.normalizedValues.summary,
      },
    },
    dependencies,
  };
}

export function reducerSubmissionInventory(scenario) {
  return [
    scenario.contextClosure,
    scenario.formDefinition,
    scenario.revisionFormDefinition,
    scenario.projectionArtifact,
    scenario.runtimeProtocol,
  ];
}

export function taskMutationPlanArguments(
  scenario,
  products,
  validateMutationContract,
) {
  return {
    profile: scenario.profile,
    protocol: scenario.protocol,
    workspace: scenario.workspace,
    authority: selectNextAuthority(scenario),
    ancestry: {
      request: scenario.request,
      assignment: scenario.assignment,
      submission: scenario.submission,
    },
    products,
    externalCouplings: scenario.externalCouplings,
    inventory: reducerSubmissionInventory(scenario),
    validateMutationContract,
  };
}

export async function executeReducerSubmission(
  scenario,
  executables,
  commandOverrides = {},
  trustedOverrides = {},
) {
  return reduceAuthoring(
    scenario.profile,
    scenario.protocol,
    scenario.workspace,
    {
      class: "submit",
      request: scenario.request,
      assignment: scenario.assignment,
      submission: scenario.submission,
      externalCouplings: scenario.externalCouplings,
      ...commandOverrides,
    },
    await trustedReducerInputs({
      executables,
      inventory: reducerSubmissionInventory(scenario),
      ...trustedOverrides,
    }),
  );
}

export async function advanceToAwaitingAcceptance(scenario) {
  const result = await executeReducerSubmission(
    scenario,
    passRegistrySource({
      handlerInvoke: () => ({
        status: "accept",
        products: [validBriefProduct(scenario)],
      }),
    }),
  );
  if (result.kind !== "mutation") {
    throw new Error("submission support did not produce one mutation");
  }
  const created = result.mutation.spec.createdResources[0];
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
  return scenario;
}

export function assertSelectionError(operation, code) {
  assert.throws(operation, (error) => {
    assert.equal(error instanceof AuthoringManifestSelectionError, true);
    assert.equal(error.code, code);
    return true;
  });
}

export function assertRegistryError(operation, code) {
  assert.throws(operation, (error) => {
    assert.equal(error instanceof AuthoringExecutableRegistryError, true);
    assert.equal(error.code, code);
    return true;
  });
}
