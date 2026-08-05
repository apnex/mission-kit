import {
  commitReceiptDigest,
  contextSelectorDigest,
  lifecycleRuleDigest,
  mutationDigest,
  profileManifestDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
  resourceSemanticDigest,
  workspaceIntegrityDigest,
  workspaceSemanticStateDigest
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  loadCoreTransaction,
  loadEventTransaction,
  recomputeCoreTransaction
} from "./transaction-scenarios.mjs";

export const pointerLifecycleRule = Object.freeze({
  mode: "json-pointer-state",
  path: "/status/phase"
});

function stored(resource) {
  return {
    reference: resourceReferenceFrom(resource),
    integrityDigest: resourceIntegrityDigest(resource),
    resource: structuredClone(resource)
  };
}

function pointerSource(observedValue, { includePath = true } = {}) {
  const source = {
    apiVersion: "brief.example/v1alpha1",
    kind: "Brief",
    metadata: { name: "lifecycle-source" },
    spec: { topic: "brief" },
    status: {}
  };
  if (includePath) source.status.phase = structuredClone(observedValue);
  return source;
}

export async function loadContextLifecycleTransaction({
  lifecycleRule = { mode: "workspace-resource-version" },
  requiredLifecycleState = "frozen",
  observedValue = "frozen",
  includePointerPath = true,
  proofObservedState = typeof observedValue === "string"
    ? observedValue
    : requiredLifecycleState,
  selection = "active-head"
} = {}) {
  const transaction = await loadCoreTransaction();
  const profile = transaction.byKind.get("AuthoringProfileManifest");
  const workspace = transaction.byKind.get("AuthoringWorkspace");
  const closure = transaction.byKind.get("ContextClosure");
  const request = transaction.byKind.get("AuthoringRequest");
  const selector = profile.spec.tasks[0].contextSelectors[0];
  const source = lifecycleRule.mode === "json-pointer-state"
    ? pointerSource(observedValue, { includePath: includePointerPath })
    : structuredClone(transaction.byKind.get("SourceSnapshot"));
  const sourceRecord = stored(source);

  selector.resourceType = {
    apiVersion: source.apiVersion,
    kind: source.kind
  };
  selector.requiredLifecycleState = requiredLifecycleState;
  selector.lifecycleRule = structuredClone(lifecycleRule);
  selector.selection = selection === "request-reference"
    ? { mode: "request-reference", inputKey: "intake" }
    : { mode: "active-head", slot: "intake" };
  selector.projection.fields = ["/spec"];
  selector.selectorDigest = contextSelectorDigest(selector);

  workspace.spec.resourceVersions = [structuredClone(sourceRecord)];
  workspace.spec.activeHeads = selection === "active-head"
    ? [{
      slot: "intake",
      reference: structuredClone(sourceRecord.reference)
    }]
    : [];

  request.spec.operation.inputs = selection === "request-reference"
    ? { intake: structuredClone(sourceRecord.reference) }
    : {};

  const layer = closure.spec.layers[0];
  layer.role = selector.role;
  layer.selectorId = selector.id;
  layer.selectorDigest = selector.selectorDigest;
  layer.requiredLifecycleState = selector.requiredLifecycleState;
  layer.lifecycleProof = {
    ruleDigest: lifecycleRuleDigest(selector),
    observedState: proofObservedState
  };
  layer.sourceReference = structuredClone(sourceRecord.reference);
  layer.sourceIntegrityDigest = sourceRecord.integrityDigest;
  layer.sourceSnapshot = structuredClone(sourceRecord.resource);
  layer.projectionDefinitionDigest = selector.projection.digest;

  recomputeCoreTransaction(transaction);
  return {
    ...transaction,
    closure,
    layer,
    profile,
    request,
    selector,
    source,
    workspace
  };
}

export async function loadEventLifecycleTransaction({
  lifecycleRule = { mode: "workspace-resource-version" },
  requiredLifecycleState = "frozen",
  observedValue = "frozen",
  includePointerPath = true
} = {}) {
  const transaction = await loadEventTransaction();
  const core = await loadCoreTransaction();
  const workspace = structuredClone(
    core.byKind.get("AuthoringWorkspace")
  );
  const source = lifecycleRule.mode === "json-pointer-state"
    ? pointerSource(observedValue, { includePath: includePointerPath })
    : structuredClone(core.byKind.get("SourceSnapshot"));
  const sourceRecord = stored(source);
  const binding = transaction.profile.spec.transitionBindings.find(
    (candidate) => candidate.transitionId === "AT02"
  );
  const selector = {
    id: "event-input",
    selectorDigest: `sha256:${"0".repeat(64)}`,
    ordinal: 1,
    role: "event-input",
    resourceType: {
      apiVersion: source.apiVersion,
      kind: source.kind
    },
    cardinality: { min: 1, max: 1 },
    requiredLifecycleState,
    lifecycleRule: structuredClone(lifecycleRule),
    selection: lifecycleRule.mode === "workspace-resource-version"
      ? { mode: "active-head", slot: "intake" }
      : { mode: "event-input", inputKey: "runtime" },
    projection: {
      id: "event-input-projection",
      digest: core.byKind
        .get("AuthoringProfileManifest")
        .spec.tasks[0].contextSelectors[0].projection.digest,
      fields: ["/spec"]
    }
  };
  selector.selectorDigest = contextSelectorDigest(selector);
  binding.inputSelectors = [selector];
  transaction.profile.spec.profileDigest =
    profileManifestDigest(transaction.profile);

  workspace.metadata.name = "event-workspace";
  workspace.spec.profile = {
    reference: resourceReferenceFrom(transaction.profile),
    profileDigest: transaction.profile.spec.profileDigest
  };
  workspace.spec.authoringState = "awaiting_acceptance";
  workspace.spec.semanticRevision = 1;
  workspace.spec.evidenceRevision = 1;
  workspace.spec.resourceVersions =
    lifecycleRule.mode === "workspace-resource-version"
      ? [structuredClone(sourceRecord)]
      : [];
  workspace.spec.activeHeads =
    lifecycleRule.mode === "workspace-resource-version"
      ? [{
        slot: "intake",
        reference: structuredClone(sourceRecord.reference)
      }]
      : [];
  workspace.spec.history = [];
  workspace.spec.integrity.semanticStateDigest =
    workspaceSemanticStateDigest(workspace);
  workspace.spec.integrity.workspaceIntegrityDigest =
    workspaceIntegrityDigest(workspace);

  transaction.mutation.spec.expected = {
    authoringState: workspace.spec.authoringState,
    semanticRevision: workspace.spec.semanticRevision,
    semanticStateDigest: workspace.spec.integrity.semanticStateDigest
  };
  transaction.mutation.spec.cause.execution.profile = {
    id: transaction.profile.metadata.name,
    digest: transaction.profile.spec.profileDigest
  };
  transaction.mutation.spec.cause.inputs = [{
    ordinal: selector.ordinal,
    role: selector.role,
    reference: structuredClone(sourceRecord.reference),
    integrityDigest: sourceRecord.integrityDigest
  }];
  transaction.mutation.spec.mutationDigest =
    mutationDigest(transaction.mutation);

  transaction.receipt.spec.cause =
    structuredClone(transaction.mutation.spec.cause);
  transaction.receipt.spec.mutation = {
    reference: resourceReferenceFrom(transaction.mutation),
    mutationDigest: transaction.mutation.spec.mutationDigest
  };
  transaction.receipt.spec.before.semanticRevision =
    transaction.mutation.spec.expected.semanticRevision;
  transaction.receipt.spec.before.semanticStateDigest =
    transaction.mutation.spec.expected.semanticStateDigest;
  transaction.receipt.spec.receiptDigest =
    commitReceiptDigest(transaction.receipt);

  transaction.workspace = workspace;
  transaction.source = source;
  transaction.selector = selector;
  transaction.roots = [transaction.receipt, workspace];
  transaction.values = [
    ...transaction.values,
    workspace,
    source
  ];
  return transaction;
}

export function recomputeStoredRecord(record) {
  record.reference = resourceReferenceFrom(record.resource);
  record.integrityDigest = resourceIntegrityDigest(record.resource);
  return record;
}

export function refreshEventTransaction(transaction) {
  transaction.profile.spec.profileDigest =
    profileManifestDigest(transaction.profile);
  transaction.workspace.spec.profile = {
    reference: resourceReferenceFrom(transaction.profile),
    profileDigest: transaction.profile.spec.profileDigest
  };
  transaction.workspace.spec.integrity.semanticStateDigest =
    workspaceSemanticStateDigest(transaction.workspace);
  transaction.workspace.spec.integrity.workspaceIntegrityDigest =
    workspaceIntegrityDigest(transaction.workspace);
  transaction.mutation.spec.expected.semanticStateDigest =
    transaction.workspace.spec.integrity.semanticStateDigest;
  transaction.mutation.spec.cause.execution.profile.digest =
    transaction.profile.spec.profileDigest;
  transaction.mutation.spec.mutationDigest =
    mutationDigest(transaction.mutation);
  transaction.receipt.spec.cause =
    structuredClone(transaction.mutation.spec.cause);
  transaction.receipt.spec.mutation = {
    reference: resourceReferenceFrom(transaction.mutation),
    mutationDigest: transaction.mutation.spec.mutationDigest
  };
  transaction.receipt.spec.before.semanticStateDigest =
    transaction.mutation.spec.expected.semanticStateDigest;
  transaction.receipt.spec.receiptDigest =
    commitReceiptDigest(transaction.receipt);
  return transaction;
}

export function sourceSemanticDigest(source) {
  return resourceSemanticDigest(source);
}
