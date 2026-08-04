import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assignmentDigest,
  commitReceiptDigest,
  contextClosureDigest,
  contextSelectorDigest,
  lifecycleRuleDigest,
  mutationDigest,
  normalizedSubmissionDigest,
  profileManifestDigest,
  projectionArtifactDigest,
  requestCoreDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
  resourceSemanticDigest,
  revisionPlanDigest,
  revisionUnitDigest,
  workspaceIntegrityDigest,
  workspaceSemanticStateDigest
} from "../../../../source/authoring/kernel/digests.mjs";

const supportRoot = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.resolve(
  supportRoot,
  "../../../fixtures/authoring/contracts/positive"
);

async function load(name) {
  return JSON.parse(
    await readFile(path.join(fixtureRoot, `${name}.json`), "utf8")
  );
}

export async function loadCoreTransaction() {
  const names = [
    "authoring-protocol",
    "runtime-protocol",
    "authoring-profile-manifest",
    "authoring-workspace",
    "authoring-request",
    "authoring-assignment",
    "context-closure",
    "source-snapshot",
    "authoring-form-definition",
    "revision-form-definition",
    "authoring-submission",
    "authoring-commit-receipt",
    "projection-artifact",
    "authoring-mutation"
  ];
  const values = await Promise.all(names.map(load));
  const byKind = new Map();
  values.forEach((value) => {
    if (
      !byKind.has(value.kind) ||
      value.metadata.name === "brief-flow"
    ) {
      byKind.set(value.kind, value);
    }
  });
  return {
    byKind,
    roots: [
      byKind.get("AuthoringCommitReceipt"),
      byKind.get("AuthoringWorkspace")
    ],
    values
  };
}

export async function loadEventTransaction() {
  const protocol = await load("authoring-protocol");
  const profile = await load("authoring-profile-manifest");
  const form = await load("authoring-form-definition");
  const revisionForm = await load("revision-form-definition");
  const sourceMutation = await load("authoring-mutation");
  const sourceReceipt = await load("authoring-commit-receipt");
  const mutation = structuredClone(sourceMutation);
  mutation.metadata.name = "accept-mutation";
  mutation.spec.expected = {
    authoringState: "awaiting_acceptance",
    semanticRevision: 1,
    semanticStateDigest:
      "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  };
  mutation.spec.cause = {
    class: "event",
    edge: {
      transitionId: "AT02",
      fromState: "awaiting_acceptance",
      eventId: "ACCEPT",
      toState: "complete"
    },
    authority: structuredClone(profile.spec.transitionBindings[1].authority),
    execution: {
      profile: {
        id: profile.metadata.name,
        digest: profile.spec.profileDigest
      },
      protocol: {
        id: protocol.metadata.name,
        digest: resourceSemanticDigest(protocol)
      },
      handler: structuredClone(profile.spec.handlerBindings[1].handler)
    },
    commandDigest:
      "sha256:1111111111111111111111111111111111111111111111111111111111111111",
    payloadDigest:
      "sha256:2222222222222222222222222222222222222222222222222222222222222222",
    evidenceDigest:
      "sha256:3333333333333333333333333333333333333333333333333333333333333333",
    inputs: []
  };
  mutation.spec.createdResources = [];
  mutation.spec.activeHeadChanges = [];
  mutation.spec.supersededResources = [];
  mutation.spec.dependencyEdges = { created: [], superseded: [] };
  mutation.spec.handoffProducts = [];
  mutation.spec.nextAuthoringState = "complete";
  mutation.spec.externalCouplings = [];
  mutation.spec.mutationDigest = mutationDigest(mutation);

  const receipt = structuredClone(sourceReceipt);
  receipt.metadata.name = "accept-receipt";
  receipt.spec.idempotencyKey = "accept-commit-0001";
  receipt.spec.cause = structuredClone(mutation.spec.cause);
  receipt.spec.mutation.reference = {
    apiVersion: mutation.apiVersion,
    kind: mutation.kind,
    name: mutation.metadata.name,
    semanticDigest: resourceSemanticDigest(mutation)
  };
  receipt.spec.mutation.mutationDigest = mutation.spec.mutationDigest;
  receipt.spec.before = {
    semanticRevision: 1,
    evidenceRevision: 1,
    semanticStateDigest: mutation.spec.expected.semanticStateDigest
  };
  receipt.spec.after = {
    semanticRevision: 2,
    evidenceRevision: 2,
    semanticStateDigest:
      "sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"
  };
  receipt.spec.createdResources = [];
  receipt.spec.supersededDescendants = [];
  receipt.spec.handoffProducts = [];
  receipt.spec.externalCouplings = [];
  receipt.spec.receiptDigest = commitReceiptDigest(receipt);

  return {
    mutation,
    profile,
    protocol,
    receipt,
    roots: [receipt, profile],
    values: [protocol, profile, form, revisionForm, mutation, receipt]
  };
}

export async function loadRevisionRequestTransaction() {
  const protocol = await load("authoring-protocol");
  const profile = await load("authoring-profile-manifest");
  const workspace = await load("authoring-workspace");
  const request = await load("authoring-request");
  const closure = await load("context-closure");
  const source = await load("source-snapshot");
  const form = await load("authoring-form-definition");
  const revisionForm = await load("revision-form-definition");
  const mutation = await load("authoring-mutation");
  const briefRecord = mutation.spec.createdResources[0];
  const briefReference = structuredClone(briefRecord.reference);

  workspace.metadata.name = "brief-revision-workspace";
  workspace.spec.authoringState = "awaiting_acceptance";
  workspace.spec.semanticRevision = 1;
  workspace.spec.evidenceRevision = 1;
  workspace.spec.resourceVersions = [
    ...workspace.spec.resourceVersions,
    structuredClone(briefRecord)
  ];
  workspace.spec.activeHeads = [
    ...workspace.spec.activeHeads,
    { slot: "brief", reference: structuredClone(briefReference) }
  ];
  workspace.spec.handoffProducts = [
    { slot: "brief", reference: structuredClone(briefReference) }
  ];
  workspace.spec.integrity.semanticStateDigest =
    workspaceSemanticStateDigest(workspace);
  workspace.spec.integrity.workspaceIntegrityDigest =
    workspaceIntegrityDigest(workspace);

  const unit = profile.spec.revisionUnits[0];
  const plan = unit.revisionPlans[0];
  const revisionBinding = profile.spec.formBindings.find(
    (item) => item.id === unit.assignmentContract.formBindingId
  );
  request.metadata.name = "brief-revision-request";
  request.spec.operation = {
    class: "revision",
    normalTaskId: "draft-brief",
    unit: { id: unit.id, digest: unit.unitDigest },
    plan: { id: plan.id, digest: plan.planDigest },
    expectedHeads: [
      { slot: "brief", reference: structuredClone(briefReference) }
    ],
    inputs: {}
  };
  request.spec.base = {
    authoringState: "awaiting_acceptance",
    semanticRevision: workspace.spec.semanticRevision,
    semanticStateDigest: workspace.spec.integrity.semanticStateDigest
  };
  request.spec.bindings.form = {
    id: revisionBinding.id,
    digest: revisionBinding.formDigest
  };
  request.spec.bindings.parser = structuredClone(revisionBinding.parser);
  request.spec.submissionContract.form =
    structuredClone(request.spec.bindings.form);
  request.spec.requestDigest = requestCoreDigest(request);

  return {
    brief: briefRecord.resource,
    profile,
    protocol,
    request,
    roots: [request, workspace],
    values: [
      protocol,
      profile,
      workspace,
      request,
      closure,
      source,
      form,
      revisionForm,
      briefRecord.resource
    ],
    workspace
  };
}

export function configureRevisionContextRequestReference(transaction) {
  const closure = transaction.values.find(
    (value) => value.kind === "ContextClosure"
  );
  const selector =
    transaction.profile.spec.tasks[0].contextSelectors[0];
  const layer = closure.spec.layers[0];

  selector.selection = {
    mode: "request-reference",
    inputKey: "intake"
  };
  selector.selectorDigest = contextSelectorDigest(selector);
  layer.selectorDigest = selector.selectorDigest;
  layer.requiredLifecycleState = selector.requiredLifecycleState;
  layer.lifecycleProof = {
    ruleDigest: lifecycleRuleDigest(selector),
    observedState: selector.requiredLifecycleState
  };
  closure.spec.closureDigest = contextClosureDigest(closure);

  transaction.profile.spec.profileDigest =
    profileManifestDigest(transaction.profile);
  transaction.workspace.spec.profile = {
    reference: resourceReferenceFrom(transaction.profile),
    profileDigest: transaction.profile.spec.profileDigest
  };
  recomputeWorkspace(transaction.workspace);

  transaction.request.spec.operation.inputs = {
    intake: structuredClone(layer.sourceReference)
  };
  transaction.request.spec.contextClosure = {
    reference: resourceReferenceFrom(closure),
    closureDigest: closure.spec.closureDigest
  };
  transaction.request.spec.base.semanticStateDigest =
    transaction.workspace.spec.integrity.semanticStateDigest;
  transaction.request.spec.bindings.profile = {
    id: transaction.profile.metadata.name,
    digest: transaction.profile.spec.profileDigest
  };
  transaction.request.spec.requestDigest =
    requestCoreDigest(transaction.request);
  return transaction;
}

export function recomputeWorkspace(workspace) {
  workspace.spec.integrity.semanticStateDigest =
    workspaceSemanticStateDigest(workspace);
  workspace.spec.integrity.workspaceIntegrityDigest =
    workspaceIntegrityDigest(workspace);
  return workspace;
}

export function integrityOf(resource) {
  return resourceIntegrityDigest(resource);
}

export function recomputeMutationAndReceipt(transaction) {
  const mutation = transaction.mutation ??
    transaction.byKind?.get("AuthoringMutation");
  const receipt = transaction.receipt ??
    transaction.byKind?.get("AuthoringCommitReceipt");
  if (!mutation || !receipt) {
    throw new TypeError("transaction requires one mutation and receipt");
  }
  mutation.spec.mutationDigest = mutationDigest(mutation);
  receipt.spec.cause = structuredClone(mutation.spec.cause);
  receipt.spec.mutation = {
    reference: resourceReferenceFrom(mutation),
    mutationDigest: mutation.spec.mutationDigest
  };
  receipt.spec.before.semanticRevision =
    mutation.spec.expected.semanticRevision;
  receipt.spec.before.semanticStateDigest =
    mutation.spec.expected.semanticStateDigest;
  receipt.spec.createdResources = mutation.spec.createdResources.map(
    (created) => structuredClone(created.reference)
  );
  receipt.spec.handoffProducts =
    structuredClone(mutation.spec.handoffProducts);
  receipt.spec.externalCouplings =
    structuredClone(mutation.spec.externalCouplings);
  receipt.spec.receiptDigest = commitReceiptDigest(receipt);
  return transaction;
}

export function recomputeCreatedResource(record) {
  record.reference = resourceReferenceFrom(record.resource);
  record.integrityDigest = resourceIntegrityDigest(record.resource);
  return record;
}

export function recomputeCoreTransaction(
  transaction,
  { preserveRequestBase = false } = {}
) {
  const { byKind } = transaction;
  const protocol = transaction.values.find(
    (value) => (
      value.kind === "AuthoringProtocol" &&
      value.metadata.name === "brief-flow"
    )
  );
  const profile = byKind.get("AuthoringProfileManifest");
  const workspace = byKind.get("AuthoringWorkspace");
  const closure = byKind.get("ContextClosure");
  const request = byKind.get("AuthoringRequest");
  const projection = byKind.get("ProjectionArtifact");
  const assignment = byKind.get("AuthoringAssignment");
  const submission = byKind.get("AuthoringSubmission");
  const mutation = byKind.get("AuthoringMutation");

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

  workspace.spec.profile = {
    reference: resourceReferenceFrom(profile),
    profileDigest: profile.spec.profileDigest
  };
  workspace.spec.protocol = {
    reference: resourceReferenceFrom(protocol),
    protocolDigest: resourceSemanticDigest(protocol)
  };
  recomputeWorkspace(workspace);

  closure.spec.closureDigest = contextClosureDigest(closure);
  request.spec.contextClosure = {
    reference: resourceReferenceFrom(closure),
    closureDigest: closure.spec.closureDigest
  };
  if (!preserveRequestBase) {
    request.spec.base = {
      authoringState: workspace.spec.authoringState,
      semanticRevision: workspace.spec.semanticRevision,
      semanticStateDigest: workspace.spec.integrity.semanticStateDigest
    };
  }
  const task = profile.spec.tasks.find(
    (item) => item.id === request.spec.operation.task.id
  );
  const schema = profile.spec.schemaBindings.find(
    (item) => item.id === task.submissionSchemaBindingId
  );
  const form = profile.spec.formBindings.find(
    (item) => item.id === task.formBindingId
  );
  const handler = profile.spec.handlerBindings.find(
    (item) => item.id === task.handlerBindingId
  );
  const validators = profile.spec.validatorSets.find(
    (item) => item.id === task.validatorSetId
  );
  const projectionBinding = profile.spec.projectionBindings.find(
    (item) => item.id === task.projectionBindingId
  );
  request.spec.bindings = {
    kernel: structuredClone(profile.spec.kernel),
    profile: {
      id: profile.metadata.name,
      digest: profile.spec.profileDigest
    },
    protocol: {
      id: protocol.metadata.name,
      digest: resourceSemanticDigest(protocol)
    },
    handler: structuredClone(handler.handler),
    parser: structuredClone(form.parser),
    form: { id: form.id, digest: form.formDigest },
    schema: structuredClone(schema.schema),
    validatorSet: { id: validators.id, digest: validators.digest },
    projection: {
      id: projectionBinding.id,
      digest: projectionBinding.definitionDigest
    }
  };
  request.spec.submissionContract = {
    schema: structuredClone(request.spec.bindings.schema),
    validatorSet: structuredClone(request.spec.bindings.validatorSet),
    form: structuredClone(request.spec.bindings.form)
  };
  request.spec.requestDigest = requestCoreDigest(request);

  const closureSource = projection.spec.sources.find(
    (source) => source.reference.kind === "ContextClosure"
  );
  closureSource.reference = resourceReferenceFrom(closure);
  closureSource.integrityDigest = resourceIntegrityDigest(closure);
  projection.spec.projectionArtifactDigest =
    projectionArtifactDigest(projection);

  assignment.spec.request = {
    reference: resourceReferenceFrom(request),
    requestDigest: request.spec.requestDigest
  };
  assignment.spec.projectionArtifact = {
    reference: resourceReferenceFrom(projection),
    projectionArtifactDigest: projection.spec.projectionArtifactDigest
  };
  assignment.spec.baseSemanticRevision = request.spec.base.semanticRevision;
  assignment.spec.baseSemanticStateDigest =
    request.spec.base.semanticStateDigest;
  assignment.spec.assignmentDigest = assignmentDigest(assignment);

  submission.spec.assignment = {
    reference: resourceReferenceFrom(assignment),
    assignmentDigest: assignment.spec.assignmentDigest
  };
  submission.spec.normalizedSubmissionDigest =
    normalizedSubmissionDigest(submission);

  mutation.spec.expected = {
    authoringState: request.spec.base.authoringState,
    semanticRevision: request.spec.base.semanticRevision,
    semanticStateDigest: request.spec.base.semanticStateDigest
  };
  mutation.spec.cause.execution.profile = {
    id: profile.metadata.name,
    digest: profile.spec.profileDigest
  };
  mutation.spec.cause.execution.protocol = {
    id: protocol.metadata.name,
    digest: resourceSemanticDigest(protocol)
  };
  mutation.spec.cause.assignment = {
    reference: resourceReferenceFrom(assignment),
    assignmentDigest: assignment.spec.assignmentDigest
  };
  mutation.spec.cause.submission = {
    reference: resourceReferenceFrom(submission),
    normalizedSubmissionDigest: submission.spec.normalizedSubmissionDigest
  };
  return recomputeMutationAndReceipt(transaction);
}
