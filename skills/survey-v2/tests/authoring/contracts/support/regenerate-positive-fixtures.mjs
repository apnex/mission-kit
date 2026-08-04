import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assignmentDigest,
  blankViewDigest,
  commitReceiptDigest,
  contextClosureDigest,
  contextSelectorDigest,
  formDefinitionDigest,
  lifecycleRuleDigest,
  mutationDigest,
  normalizedSubmissionDigest,
  profileManifestDigest,
  projectionArtifactDigest,
  projectionOutputDigest,
  rawEvidenceDigest,
  requestCoreDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
  resourceSemanticDigest,
  revisionPlanDigest,
  revisionUnitDigest,
  sourceSnapshotDigest,
  workspaceIntegrityDigest,
  workspaceSemanticStateDigest
} from "../../../../source/authoring/kernel/digests.mjs";

const supportRoot = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.resolve(
  supportRoot,
  "../../../fixtures/authoring/contracts/positive"
);

async function load(stem) {
  return JSON.parse(
    await readFile(path.join(fixtureRoot, `${stem}.json`), "utf8")
  );
}

function stored(resource) {
  return {
    reference: resourceReferenceFrom(resource),
    integrityDigest: resourceIntegrityDigest(resource),
    resource: structuredClone(resource)
  };
}

function binding(id, digest) {
  return { id, digest };
}

const values = Object.fromEntries(await Promise.all([
  "authoring-assignment",
  "authoring-commit-receipt",
  "authoring-form-definition",
  "authoring-mutation",
  "authoring-profile-manifest",
  "authoring-protocol",
  "authoring-request",
  "authoring-submission",
  "authoring-workspace",
  "context-closure",
  "projection-artifact",
  "resource-reference",
  "revision-form-definition",
  "runtime-protocol",
  "source-snapshot"
].map(async (stem) => [stem, await load(stem)])));

const source = values["source-snapshot"];
source.spec.inventory.forEach((item) => {
  item.rawEvidenceDigest = rawEvidenceDigest(
    Buffer.from(item.content.data, "base64")
  );
});
source.spec.sourceDigest = sourceSnapshotDigest(source);

for (const stem of [
  "authoring-form-definition",
  "revision-form-definition"
]) {
  const form = values[stem];
  form.spec.formDigest = formDefinitionDigest(form);
}

const protocol = values["authoring-protocol"];
const runtimeProtocol = values["runtime-protocol"];
const profile = values["authoring-profile-manifest"];
profile.spec.protocol = resourceReferenceFrom(protocol);
profile.spec.machineBindings[0].protocol = binding(
  runtimeProtocol.metadata.name,
  resourceSemanticDigest(runtimeProtocol)
);
for (const formBinding of profile.spec.formBindings) {
  const form = formBinding.id === "brief-revision-form-binding"
    ? values["revision-form-definition"]
    : values["authoring-form-definition"];
  formBinding.definition = resourceReferenceFrom(form);
  formBinding.formDigest = form.spec.formDigest;
}
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

const closure = values["context-closure"];
const selector = profile.spec.tasks[0].contextSelectors[0];
const sourceRecord = stored(source);
closure.spec.layers[0] = {
  ...closure.spec.layers[0],
  ordinal: 1,
  role: selector.role,
  selectorId: selector.id,
  selectorDigest: selector.selectorDigest,
  requiredLifecycleState: selector.requiredLifecycleState,
  lifecycleProof: {
    ruleDigest: lifecycleRuleDigest(selector),
    observedState: "frozen"
  },
  sourceReference: sourceRecord.reference,
  sourceIntegrityDigest: sourceRecord.integrityDigest,
  sourceSnapshot: sourceRecord.resource,
  projectionDefinitionDigest: selector.projection.digest
};
closure.spec.closureDigest = contextClosureDigest(closure);

const workspace = values["authoring-workspace"];
workspace.spec.profile = {
  reference: resourceReferenceFrom(profile),
  profileDigest: profile.spec.profileDigest
};
workspace.spec.protocol = {
  reference: resourceReferenceFrom(protocol),
  protocolDigest: resourceSemanticDigest(protocol)
};
workspace.spec.resourceVersions = [structuredClone(sourceRecord)];
workspace.spec.activeHeads = [{
  slot: selector.selection.slot,
  reference: structuredClone(sourceRecord.reference)
}];
workspace.spec.integrity.semanticStateDigest =
  workspaceSemanticStateDigest(workspace);
workspace.spec.integrity.workspaceIntegrityDigest =
  workspaceIntegrityDigest(workspace);

const request = values["authoring-request"];
const task = profile.spec.tasks[0];
const transition = protocol.spec.transitions.find(
  (item) => item.id === profile.spec.transitionBindings[0].transitionId
);
const schemaBinding = profile.spec.schemaBindings.find(
  (item) => item.id === task.submissionSchemaBindingId
);
const formBinding = profile.spec.formBindings.find(
  (item) => item.id === task.formBindingId
);
const handlerBinding = profile.spec.handlerBindings.find(
  (item) => item.id === task.handlerBindingId
);
const validatorSet = profile.spec.validatorSets.find(
  (item) => item.id === task.validatorSetId
);
const projectionBinding = profile.spec.projectionBindings.find(
  (item) => item.id === task.projectionBindingId
);
request.spec.operation.task = {
  id: task.id,
  stateId: task.stateId,
  transitionId: transition.id,
  eventId: transition.eventId
};
request.spec.operation.target = structuredClone(task.target);
request.spec.operation.inputs ??= {};
request.spec.base = {
  authoringState: workspace.spec.authoringState,
  semanticRevision: workspace.spec.semanticRevision,
  semanticStateDigest: workspace.spec.integrity.semanticStateDigest
};
request.spec.contextClosure = {
  reference: resourceReferenceFrom(closure),
  closureDigest: closure.spec.closureDigest
};
request.spec.bindings = {
  kernel: structuredClone(profile.spec.kernel),
  profile: binding(profile.metadata.name, profile.spec.profileDigest),
  protocol: binding(
    protocol.metadata.name,
    resourceSemanticDigest(protocol)
  ),
  handler: structuredClone(handlerBinding.handler),
  parser: structuredClone(formBinding.parser),
  form: binding(formBinding.id, formBinding.formDigest),
  schema: structuredClone(schemaBinding.schema),
  validatorSet: binding(validatorSet.id, validatorSet.digest),
  projection: binding(
    projectionBinding.id,
    projectionBinding.definitionDigest
  )
};
request.spec.submissionContract = {
  schema: structuredClone(request.spec.bindings.schema),
  validatorSet: structuredClone(request.spec.bindings.validatorSet),
  form: structuredClone(request.spec.bindings.form)
};
request.spec.requestDigest = requestCoreDigest(request);

const projection = values["projection-artifact"];
const form = values["authoring-form-definition"];
projection.spec.projectionDefinitionDigest =
  projectionBinding.definitionDigest;
projection.spec.engine = structuredClone(projectionBinding.engine);
projection.spec.sources = [{
  role: "context",
  reference: resourceReferenceFrom(closure),
  integrityDigest: resourceIntegrityDigest(closure)
}];
projection.spec.form = {
  reference: resourceReferenceFrom(form),
  formDigest: form.spec.formDigest
};
projection.spec.output.outputDigest = projectionOutputDigest(
  Buffer.from(projection.spec.output.content.data, "base64")
);
projection.spec.projectionArtifactDigest =
  projectionArtifactDigest(projection);

const assignment = values["authoring-assignment"];
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
assignment.spec.uneditedSkeleton.content =
  structuredClone(projection.spec.output.content);
assignment.spec.uneditedSkeleton.blankViewDigest = blankViewDigest(
  Buffer.from(projection.spec.output.content.data, "base64")
);
assignment.spec.assignmentDigest = assignmentDigest(assignment);

const submission = values["authoring-submission"];
submission.spec.assignment = {
  reference: resourceReferenceFrom(assignment),
  assignmentDigest: assignment.spec.assignmentDigest
};
submission.evidence.rawEvidence.rawEvidenceDigest = rawEvidenceDigest(
  Buffer.from(submission.evidence.rawEvidence.content.data, "base64")
);
submission.spec.normalizedSubmissionDigest =
  normalizedSubmissionDigest(submission);

const mutation = values["authoring-mutation"];
mutation.spec.expected = {
  authoringState: request.spec.base.authoringState,
  semanticRevision: request.spec.base.semanticRevision,
  semanticStateDigest: request.spec.base.semanticStateDigest
};
mutation.spec.cause.execution.profile =
  binding(profile.metadata.name, profile.spec.profileDigest);
mutation.spec.cause.execution.protocol =
  binding(protocol.metadata.name, resourceSemanticDigest(protocol));
mutation.spec.cause.assignment = {
  reference: resourceReferenceFrom(assignment),
  assignmentDigest: assignment.spec.assignmentDigest
};
mutation.spec.cause.submission = {
  reference: resourceReferenceFrom(submission),
  normalizedSubmissionDigest: submission.spec.normalizedSubmissionDigest
};
mutation.spec.createdResources = mutation.spec.createdResources.map(
  (created) => ({
    slot: created.slot,
    ...stored(created.resource)
  })
);
mutation.spec.activeHeadChanges[0].after =
  structuredClone(mutation.spec.createdResources[0].reference);
mutation.spec.handoffProducts[0].reference =
  structuredClone(mutation.spec.createdResources[0].reference);
mutation.spec.mutationDigest = mutationDigest(mutation);

const receipt = values["authoring-commit-receipt"];
receipt.spec.cause = structuredClone(mutation.spec.cause);
receipt.spec.mutation = {
  reference: resourceReferenceFrom(mutation),
  mutationDigest: mutation.spec.mutationDigest
};
receipt.spec.before.semanticRevision = mutation.spec.expected.semanticRevision;
receipt.spec.before.semanticStateDigest =
  mutation.spec.expected.semanticStateDigest;
receipt.spec.createdResources = mutation.spec.createdResources.map(
  (created) => structuredClone(created.reference)
);
receipt.spec.handoffProducts = structuredClone(
  mutation.spec.handoffProducts
);
receipt.spec.externalCouplings = structuredClone(
  mutation.spec.externalCouplings
);
receipt.spec.receiptDigest = commitReceiptDigest(receipt);

values["resource-reference"] =
  structuredClone(mutation.spec.createdResources[0].reference);

const writeMode = process.argv.includes("--write");
let differences = 0;
for (const [stem, value] of Object.entries(values)) {
  const target = path.join(fixtureRoot, `${stem}.json`);
  const next = `${JSON.stringify(value, null, 2)}\n`;
  const current = await readFile(target, "utf8");
  if (current !== next) {
    differences += 1;
    if (writeMode) await writeFile(target, next);
  }
}

if (!writeMode && differences > 0) {
  throw new Error(`${differences} positive fixtures require regeneration`);
}

process.stdout.write(JSON.stringify({
  changed: differences,
  mode: writeMode ? "write" : "check"
}) + "\n");
