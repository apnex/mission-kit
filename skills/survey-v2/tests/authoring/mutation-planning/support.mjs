import assert from "node:assert/strict";

import {
  assignmentDigest,
  contextSelectorDigest,
  normalizedSubmissionDigest,
  profileManifestDigest,
  requestCoreDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
  resourceSemanticDigest,
  revisionPlanDigest,
  revisionUnitDigest,
  workspaceIntegrityDigest,
  workspaceSemanticStateDigest,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  validateContractSemantics,
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  selectEventAuthority,
  selectNextAuthority,
  selectRevisionAuthority,
} from "../../../source/authoring/kernel/manifest-selection.mjs";
import {
  planAuthoringMutation,
} from "../../../source/authoring/kernel/mutation-planner.mjs";
import {
  contractValidators,
} from "../contracts/support/contract-validation.mjs";
import {
  loadCoreTransaction,
  loadRevisionRequestTransaction,
} from "../contracts/support/transaction-scenarios.mjs";

const digest = (character) => `sha256:${character.repeat(64)}`;

function mainProtocol(transaction) {
  return transaction.values.find((resource) => (
    resource.kind === "AuthoringProtocol" &&
    resource.metadata.name === "brief-flow"
  ));
}

async function mutationValidator() {
  const { byStem } = await contractValidators();
  const validateStructure = byStem.get("authoring-mutation");
  return (candidate) => (
    validateStructure(candidate) &&
    validateContractSemantics(candidate).length === 0
  );
}

function recloseProfile(profile) {
  for (const task of profile.spec.tasks) {
    for (const selector of task.contextSelectors) {
      selector.selectorDigest = contextSelectorDigest(selector);
    }
  }
  for (const unit of profile.spec.revisionUnits) {
    for (const plan of unit.revisionPlans) {
      plan.planDigest = revisionPlanDigest(plan);
    }
    unit.unitDigest = revisionUnitDigest(unit);
  }
  profile.spec.profileDigest = profileManifestDigest(profile);
}

function recloseWorkspace(workspace, profile, protocol) {
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
}

function recloseTaskAncestry({
  profile,
  protocol,
  workspace,
  request,
  assignment,
  submission,
}) {
  const task = profile.spec.tasks.find(
    (candidate) => candidate.id === request.spec.operation.task.id,
  );
  const binding = profile.spec.transitionBindings.find(
    (candidate) =>
      candidate.transitionId ===
        request.spec.operation.task.transitionId,
  );
  const handler = profile.spec.handlerBindings.find(
    (candidate) => candidate.id === binding.handlerBindingId,
  );
  request.spec.operation.target = structuredClone(task.target);
  request.spec.base = {
    authoringState: workspace.spec.authoringState,
    semanticRevision: workspace.spec.semanticRevision,
    semanticStateDigest: workspace.spec.integrity.semanticStateDigest,
  };
  request.spec.bindings.profile = {
    id: profile.metadata.name,
    digest: profile.spec.profileDigest,
  };
  request.spec.bindings.protocol = {
    id: protocol.metadata.name,
    digest: resourceSemanticDigest(protocol),
  };
  request.spec.bindings.handler = structuredClone(handler.handler);
  request.spec.requestDigest = requestCoreDigest(request);
  assignment.spec.request = {
    reference: resourceReferenceFrom(request),
    requestDigest: request.spec.requestDigest,
  };
  assignment.spec.baseSemanticRevision = workspace.spec.semanticRevision;
  assignment.spec.baseSemanticStateDigest =
    workspace.spec.integrity.semanticStateDigest;
  assignment.spec.assignmentDigest = assignmentDigest(assignment);
  submission.spec.assignment = {
    reference: resourceReferenceFrom(assignment),
    assignmentDigest: assignment.spec.assignmentDigest,
  };
  submission.spec.normalizedSubmissionDigest =
    normalizedSubmissionDigest(submission);
}

export function briefResource(
  name,
  summary = `Brief ${name}.`,
) {
  return {
    apiVersion: "brief.example/v1alpha1",
    kind: "Brief",
    metadata: { name },
    spec: { summary },
  };
}

export async function taskScenario({
  mutateProfile,
  mutateRequest,
} = {}) {
  const transaction = await loadCoreTransaction();
  const profile = transaction.byKind.get("AuthoringProfileManifest");
  const protocol = mainProtocol(transaction);
  const workspace = transaction.byKind.get("AuthoringWorkspace");
  const request = transaction.byKind.get("AuthoringRequest");
  const assignment = transaction.byKind.get("AuthoringAssignment");
  const submission = transaction.byKind.get("AuthoringSubmission");
  mutateProfile?.(profile);
  recloseProfile(profile);
  recloseWorkspace(workspace, profile, protocol);
  mutateRequest?.({ request, workspace });
  recloseTaskAncestry({
    profile,
    protocol,
    workspace,
    request,
    assignment,
    submission,
  });
  const sourceMutation = transaction.byKind.get("AuthoringMutation");
  const product = structuredClone(
    sourceMutation.spec.createdResources[0].resource,
  );
  return {
    args: {
      profile,
      protocol,
      workspace,
      authority: selectNextAuthority({ profile, protocol, workspace }),
      ancestry: { request, assignment, submission },
      products: [{ slot: "brief", resource: product, dependencies: [] }],
      externalCouplings:
        structuredClone(sourceMutation.spec.externalCouplings),
      inventory: transaction.values,
      validateMutationContract: await mutationValidator(),
    },
    product,
    request,
    sourceMutation,
    transaction,
    workspace,
  };
}

export async function eventScenario() {
  const transaction = await loadRevisionRequestTransaction();
  return {
    args: {
      profile: transaction.profile,
      protocol: transaction.protocol,
      workspace: transaction.workspace,
      authority: selectEventAuthority({
        profile: transaction.profile,
        protocol: transaction.protocol,
        workspace: transaction.workspace,
        eventId: "ACCEPT",
      }),
      ancestry: {
        commandDigest: digest("1"),
        payloadDigest: digest("2"),
        evidenceDigest: digest("3"),
        inputs: [],
      },
      products: [],
      externalCouplings: [],
      inventory: transaction.values,
      validateMutationContract: await mutationValidator(),
    },
    transaction,
  };
}

export async function revisionScenario({ descendant = false } = {}) {
  const transaction = await loadRevisionRequestTransaction();
  const core = await loadCoreTransaction();
  const assignment = structuredClone(
    core.byKind.get("AuthoringAssignment"),
  );
  const submission = structuredClone(
    core.byKind.get("AuthoringSubmission"),
  );
  assignment.metadata.name = "revision-assignment";
  submission.metadata.name = "revision-submission";
  let descendantRecord;
  if (descendant) {
    const resource = {
      apiVersion: "brief.example/v1alpha1",
      kind: "BriefDerivative",
      metadata: { name: "launch-brief-derivative" },
      spec: { summary: "A derived brief artifact." },
    };
    descendantRecord = {
      reference: resourceReferenceFrom(resource),
      integrityDigest: resourceIntegrityDigest(resource),
      resource,
    };
    transaction.workspace.spec.resourceVersions.push(descendantRecord);
    transaction.workspace.spec.activeHeads.push({
      slot: "brief-derived",
      reference: structuredClone(descendantRecord.reference),
    });
    transaction.workspace.spec.dependencyEdges.push({
      from: structuredClone(descendantRecord.reference),
      to: resourceReferenceFrom(transaction.brief),
      relation: "derived-from",
    });
    recloseWorkspace(
      transaction.workspace,
      transaction.profile,
      transaction.protocol,
    );
    transaction.request.spec.base = {
      authoringState: transaction.workspace.spec.authoringState,
      semanticRevision: transaction.workspace.spec.semanticRevision,
      semanticStateDigest:
        transaction.workspace.spec.integrity.semanticStateDigest,
    };
    transaction.request.spec.requestDigest =
      requestCoreDigest(transaction.request);
  }
  assignment.spec.request = {
    reference: resourceReferenceFrom(transaction.request),
    requestDigest: transaction.request.spec.requestDigest,
  };
  assignment.spec.baseSemanticRevision =
    transaction.request.spec.base.semanticRevision;
  assignment.spec.baseSemanticStateDigest =
    transaction.request.spec.base.semanticStateDigest;
  assignment.spec.assignmentDigest = assignmentDigest(assignment);
  submission.spec.assignment = {
    reference: resourceReferenceFrom(assignment),
    assignmentDigest: assignment.spec.assignmentDigest,
  };
  submission.spec.normalizedSubmissionDigest =
    normalizedSubmissionDigest(submission);
  const product = briefResource(
    "launch-brief-revised",
    "A revised launch brief.",
  );
  const inventory = [
    ...transaction.values,
    ...core.values,
    assignment,
    submission,
    ...(descendantRecord ? [descendantRecord.resource] : []),
  ];
  return {
    args: {
      profile: transaction.profile,
      protocol: transaction.protocol,
      workspace: transaction.workspace,
      authority: selectRevisionAuthority({
        profile: transaction.profile,
        protocol: transaction.protocol,
        workspace: transaction.workspace,
        unitId: "brief-unit",
        eventId: "REVISE",
      }),
      ancestry: {
        request: transaction.request,
        assignment,
        submission,
      },
      products: [{
        slot: "brief",
        resource: product,
        dependencies: [],
      }],
      externalCouplings: [],
      inventory,
      validateMutationContract: await mutationValidator(),
    },
    descendantRecord,
    product,
    transaction,
  };
}

export function planScenario(scenario, overrides = {}) {
  return planAuthoringMutation({
    ...scenario.args,
    ...overrides,
  });
}

export function assertPlannerError(action, code) {
  assert.throws(
    action,
    (error) => {
      assert.equal(error?.name, "AuthoringMutationPlannerError");
      assert.equal(error?.code, code);
      return true;
    },
  );
}

