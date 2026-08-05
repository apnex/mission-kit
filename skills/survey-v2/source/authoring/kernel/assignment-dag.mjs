import { types } from "node:util";
import { canonicalize, stableValue } from "./canonical.mjs";
import {
  assignmentDigest,
  blankViewDigest,
  contextClosureDigest,
  formDefinitionDigest,
  normalizedSubmissionDigest,
  projectionArtifactDigest,
  projectionOutputDigest,
  rawEvidenceDigest,
  requestCoreDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom
} from "./digests.mjs";
import {
  exactTextContent,
  parseTextForm,
  requestDigestHex,
  requestHandleFromBlankView,
  textContentBytes,
  validateAuthoringFieldValues
} from "./text-forms.mjs";

const digestPattern = /^sha256:[0-9a-f]{64}$/;
const handlePattern = /^[0-9a-f]{8,64}$/;
const promiseThen = Promise.prototype.then;

export class AuthoringAssignmentDagError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "AuthoringAssignmentDagError";
    this.code = code;
    for (const [key, value] of Object.entries(details)) this[key] = value;
  }
}

function fail(code, message, details) {
  throw new AuthoringAssignmentDagError(code, message, details);
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function exactValue(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function unicodeScalarLength(value) {
  return [...value].length;
}

function detachedFrozen(value) {
  const detached = stableValue(value);
  const pending = [detached];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === null || typeof current !== "object") continue;
    for (const item of Object.values(current)) {
      if (item !== null && typeof item === "object") pending.push(item);
    }
    Object.freeze(current);
  }
  return detached;
}

function assertResource(value, kind, label) {
  if (
    !isRecord(value) ||
    value.apiVersion !== "authoring.mission-kit/v1alpha1" ||
    value.kind !== kind ||
    !isRecord(value.metadata) ||
    typeof value.metadata.name !== "string" ||
    value.metadata.name.length === 0 ||
    !isRecord(value.spec)
  ) {
    fail("DAG_RESOURCE_INVALID", `${label} is not one ${kind} resource`);
  }
}

function assertName(name, label) {
  if (
    typeof name !== "string" ||
    name.length > 160 ||
    !/^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/.test(name)
  ) {
    fail("DAG_NAME_INVALID", `${label} must be one bounded semantic name`);
  }
}

function assertDigest(value, label) {
  if (!digestPattern.test(value ?? "")) {
    fail("DAG_DIGEST_INVALID", `${label} must be a canonical sha256 digest`);
  }
}

function copyRecord(value, label) {
  if (!isRecord(value)) fail("DAG_BINDING_INVALID", `${label} must be an object`);
  return stableValue(value);
}

function exactReference(resource) {
  return resourceReferenceFrom(resource);
}

function assertSelfDigest(resource, field, digest, label) {
  assertDigest(resource.spec[field], `${label} ${field}`);
  if (resource.spec[field] !== digest(resource)) {
    fail("DAG_DIGEST_MISMATCH", `${label} ${field} differs from its canonical core`);
  }
}

function occupiedRecords(occupied) {
  if (!Array.isArray(occupied)) {
    fail("HANDLE_REGISTRY_INVALID", "occupied handles must be an array");
  }
  const seen = new Set();
  const digestHandles = new Map();
  return occupied.map((entry, index) => {
    if (
      !isRecord(entry) ||
      Object.keys(entry).sort().join("\u0000") !==
        ["handle", "requestDigest"].sort().join("\u0000") ||
      !handlePattern.test(entry.handle ?? "") ||
      !digestPattern.test(entry.requestDigest ?? "")
    ) {
      fail(
        "HANDLE_REGISTRY_INVALID",
        `occupied handle ${index + 1} is malformed`
      );
    }
    if (seen.has(entry.handle)) {
      fail(
        "HANDLE_REGISTRY_INVALID",
        `occupied handle ${entry.handle} is duplicated`
      );
    }
    seen.add(entry.handle);
    if (!requestDigestHex(entry.requestDigest).startsWith(entry.handle)) {
      fail(
        "HANDLE_REGISTRY_INVALID",
        `occupied handle ${entry.handle} is not a prefix of its request digest`
      );
    }
    const retainedHandle = digestHandles.get(entry.requestDigest);
    if (retainedHandle !== undefined && retainedHandle !== entry.handle) {
      fail(
        "HANDLE_REGISTRY_INVALID",
        `request digest is retained under both ${retainedHandle} and ${entry.handle}`
      );
    }
    digestHandles.set(entry.requestDigest, entry.handle);
    return Object.freeze({
      handle: entry.handle,
      requestDigest: entry.requestDigest
    });
  });
}

/**
 * Seal a Request draft after K12 (or another neutral selector) has assembled
 * its semantic state, context, and executable bindings. This function owns no
 * task-selection policy; it closes the first identity edge in the K11 DAG.
 */
export function sealAuthoringRequest(
  requestDraft,
  { validateRequestContract } = {}
) {
  if (!isRecord(requestDraft)) {
    fail("DAG_REQUEST_INVALID", "request draft must be an object");
  }
  if (typeof validateRequestContract !== "function") {
    fail(
      "DAG_REQUEST_VALIDATOR_REQUIRED",
      "request sealing requires one closed-contract validator"
    );
  }
  const request = stableValue(requestDraft);
  assertResource(request, "AuthoringRequest", "request draft");
  if (!Object.hasOwn(request.spec, "requestDigest")) {
    request.spec.requestDigest = `sha256:${"0".repeat(64)}`;
  }
  // projectRequestCore rejects every identity produced later in the DAG.
  try {
    request.spec.requestDigest = requestCoreDigest(request);
  } catch (error) {
    fail(
      "DAG_REQUEST_INVALID",
      `request draft cannot be sealed: ${error.message}`
    );
  }
  assertRequestAuthority(request);
  let contractValid;
  try {
    // The validator receives a detached canonical value. It must close the
    // complete structural and semantic Request contract synchronously; the
    // K11 DAG intentionally owns neither schema compilation nor resolver
    // selection.
    contractValid = validateRequestContract(stableValue(request));
  } catch (error) {
    fail(
      "DAG_REQUEST_CONTRACT_INVALID",
      `sealed request failed its closed contract: ${error.message}`
    );
  }
  if (contractValid !== true) {
    fail(
      "DAG_REQUEST_CONTRACT_INVALID",
      "sealed request did not receive one positive closed-contract validator result"
    );
  }
  // Reassert the locally owned identity edge after external validation.
  assertRequestAuthority(request);
  return stableValue(request);
}

/**
 * Choose the shortest available exact-lookup handle. Existing handles never
 * change; a new collision lengthens only the newly issued handle.
 */
export function deriveRequestHandle({
  requestDigest,
  occupied = [],
  initialLength = 8,
  maximumLength = 64
}) {
  const hex = requestDigestHex(requestDigest);
  if (
    !Number.isInteger(initialLength) ||
    !Number.isInteger(maximumLength) ||
    initialLength < 8 ||
    maximumLength > 64 ||
    initialLength > maximumLength
  ) {
    fail(
      "HANDLE_LENGTH_INVALID",
      "handle lengths must define a closed interval within 8 through 64"
    );
  }
  const records = occupiedRecords(occupied);
  const retained = records.filter(
    (entry) => entry.requestDigest === requestDigest
  );
  if (retained.length > 1) {
    fail(
      "HANDLE_REGISTRY_INVALID",
      "one request digest is bound to multiple retained handles"
    );
  }
  if (retained.length === 1) return retained[0].handle;
  const registry = new Map(
    records.map((entry) => [entry.handle, entry.requestDigest])
  );
  for (let length = initialLength; length <= maximumLength; length += 1) {
    const candidate = hex.slice(0, length);
    const bound = registry.get(candidate);
    if (bound === undefined || bound === requestDigest) return candidate;
  }
  fail(
    "HANDLE_COLLISION_EXHAUSTED",
    "no available request handle exists within the configured length bound"
  );
}

function projectionSource(role, resource) {
  return {
    role,
    reference: exactReference(resource),
    integrityDigest: resourceIntegrityDigest(resource)
  };
}

function assertProjectionBinding(request, projectionBinding) {
  const binding = copyRecord(projectionBinding, "projection binding");
  const expected = request.spec.bindings?.projection;
  if (
    Object.keys(binding).sort().join("\u0000") !==
      ["definitionDigest", "engine", "id"].sort().join("\u0000") ||
    typeof binding.id !== "string" ||
    binding.id.length > 160 ||
    !/^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/.test(binding.id) ||
    !digestPattern.test(binding.definitionDigest ?? "") ||
    !isRecord(binding.engine) ||
    Object.keys(binding.engine).sort().join("\u0000") !==
      ["digest", "id"].sort().join("\u0000") ||
    typeof binding.engine.id !== "string" ||
    binding.engine.id.length > 160 ||
    !/^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/.test(binding.engine.id) ||
    !digestPattern.test(binding.engine.digest ?? "") ||
    !expected ||
    expected.id !== binding.id ||
    expected.digest !== binding.definitionDigest
  ) {
    fail(
      "DAG_PROJECTION_AUTHORITY_MISMATCH",
      "projection binding differs from the exact request authority"
    );
  }
  return binding;
}

function renderProjectionBytes({
  request,
  contextClosure,
  formDefinition,
  requestHandle,
  projectionBinding,
  renderProjection
}) {
  if (renderProjection === undefined) {
    fail(
      "DAG_PROJECTOR_REQUIRED",
      "projection rendering requires the exact pinned projector executable"
    );
  }
  if (typeof renderProjection !== "function") {
    fail(
      "DAG_PROJECTOR_INVALID",
      "projection renderer must be one synchronous function"
    );
  }
  const rendered = renderProjection(detachedFrozen({
    request,
    contextClosure,
    formDefinition,
    requestHandle,
    projectionBinding
  }));
  if (types.isPromise(rendered)) {
    Reflect.apply(promiseThen, rendered, [
      undefined,
      () => {},
    ]);
    fail(
      "DAG_PROJECTOR_ASYNC_FORBIDDEN",
      "projection renderer must return exact bytes synchronously"
    );
  }
  if (!(rendered instanceof Uint8Array)) {
    fail(
      "DAG_PROJECTOR_RESULT_INVALID",
      "projection renderer must return exact bytes synchronously"
    );
  }
  return Buffer.from(textContentBytes(exactTextContent(rendered)));
}

function createProjectionArtifact({
  name,
  request,
  contextClosure,
  formDefinition,
  projectionBinding,
  blankViewBytes
}) {
  const artifact = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "ProjectionArtifact",
    metadata: { name },
    spec: {
      projectionArtifactDigest: `sha256:${"0".repeat(64)}`,
      projectionId: projectionBinding.id,
      projectionDefinitionDigest: projectionBinding.definitionDigest,
      sources: [
        projectionSource("request", request),
        projectionSource("context", contextClosure)
      ],
      form: {
        reference: exactReference(formDefinition),
        formDigest: formDefinition.spec.formDigest
      },
      engine: stableValue(projectionBinding.engine),
      output: {
        content: exactTextContent(blankViewBytes),
        outputDigest: projectionOutputDigest(blankViewBytes)
      }
    }
  };
  artifact.spec.projectionArtifactDigest = projectionArtifactDigest(artifact);
  return artifact;
}

function createAssignment({
  name,
  request,
  projectionArtifact,
  handle,
  blankViewBytes
}) {
  const assignment = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringAssignment",
    metadata: { name },
    spec: {
      assignmentDigest: `sha256:${"0".repeat(64)}`,
      request: {
        reference: exactReference(request),
        requestDigest: request.spec.requestDigest
      },
      projectionArtifact: {
        reference: exactReference(projectionArtifact),
        projectionArtifactDigest:
          projectionArtifact.spec.projectionArtifactDigest
      },
      handle,
      baseSemanticRevision: request.spec.base.semanticRevision,
      baseSemanticStateDigest: request.spec.base.semanticStateDigest,
      uneditedSkeleton: {
        content: exactTextContent(blankViewBytes),
        blankViewDigest: blankViewDigest(blankViewBytes)
      }
    }
  };
  assignment.spec.assignmentDigest = assignmentDigest(assignment);
  return assignment;
}

function assertRequestAuthority(request) {
  assertResource(request, "AuthoringRequest", "request");
  assertSelfDigest(
    request,
    "requestDigest",
    requestCoreDigest,
    "authoring request"
  );
  if (
    !isRecord(request.spec.base) ||
    !Number.isInteger(request.spec.base.semanticRevision) ||
    !digestPattern.test(request.spec.base.semanticStateDigest ?? "") ||
    !isRecord(request.spec.bindings?.form) ||
    !isRecord(request.spec.bindings?.projection)
  ) {
    fail("DAG_REQUEST_INVALID", "request lacks its exact base or executable bindings");
  }
}

function assertContextAuthority(request, contextClosure) {
  assertResource(contextClosure, "ContextClosure", "context closure");
  assertSelfDigest(
    contextClosure,
    "closureDigest",
    contextClosureDigest,
    "context closure"
  );
  const binding = request.spec.contextClosure;
  if (
    !isRecord(binding) ||
    binding.closureDigest !== contextClosure.spec.closureDigest ||
    !exactValue(binding.reference, exactReference(contextClosure))
  ) {
    fail(
      "DAG_CONTEXT_MISMATCH",
      "context closure differs from the exact request binding"
    );
  }
}

function assertFormAuthority(request, formDefinition) {
  assertResource(
    formDefinition,
    "AuthoringFormDefinition",
    "form definition"
  );
  assertSelfDigest(
    formDefinition,
    "formDigest",
    formDefinitionDigest,
    "form definition"
  );
  const executable = request.spec.bindings.form;
  const contract = request.spec.submissionContract?.form;
  if (
    !isRecord(executable) ||
    !isRecord(contract) ||
    executable.digest !== formDefinition.spec.formDigest ||
    contract.digest !== formDefinition.spec.formDigest ||
    !exactValue(executable, contract)
  ) {
    fail(
      "DAG_FORM_MISMATCH",
      "form definition differs from the request submission contract"
    );
  }
}

export function issueTextAssignment({
  request,
  contextClosure,
  formDefinition,
  projectionBinding,
  projectionName,
  assignmentName,
  occupiedHandles = [],
  renderProjection
}) {
  assertRequestAuthority(request);
  assertContextAuthority(request, contextClosure);
  assertFormAuthority(request, formDefinition);
  const binding = assertProjectionBinding(request, projectionBinding);
  assertName(projectionName, "projection name");
  assertName(assignmentName, "assignment name");
  const handle = deriveRequestHandle({
    requestDigest: request.spec.requestDigest,
    occupied: occupiedHandles
  });
  const blankViewBytes = renderProjectionBytes({
    request,
    contextClosure,
    formDefinition,
    requestHandle: handle,
    projectionBinding: binding,
    renderProjection
  });
  const projectionArtifact = createProjectionArtifact({
    name: projectionName,
    request,
    contextClosure,
    formDefinition,
    projectionBinding: binding,
    blankViewBytes
  });
  const assignment = createAssignment({
    name: assignmentName,
    request,
    projectionArtifact,
    handle,
    blankViewBytes
  });
  verifyTextAssignmentDag({
    request,
    contextClosure,
    formDefinition,
    projectionBinding: binding,
    projectionArtifact,
    assignment,
    renderProjection
  });
  return Object.freeze({
    handle,
    blankViewBytes: Buffer.from(blankViewBytes),
    projectionArtifact: stableValue(projectionArtifact),
    assignment: stableValue(assignment)
  });
}

function assertExactSources(projectionArtifact, request, contextClosure) {
  const expected = [
    projectionSource("request", request),
    projectionSource("context", contextClosure)
  ];
  if (!exactValue(projectionArtifact.spec.sources, expected)) {
    fail(
      "DAG_PROJECTION_SOURCE_MISMATCH",
      "text projection sources must be exactly ordered request then context"
    );
  }
}

export function verifyTextAssignmentDag({
  request,
  contextClosure,
  formDefinition,
  projectionBinding,
  projectionArtifact,
  assignment,
  renderProjection
}) {
  assertRequestAuthority(request);
  assertContextAuthority(request, contextClosure);
  assertFormAuthority(request, formDefinition);
  const binding = assertProjectionBinding(request, projectionBinding);
  assertResource(
    projectionArtifact,
    "ProjectionArtifact",
    "projection artifact"
  );
  assertResource(assignment, "AuthoringAssignment", "assignment");
  assertSelfDigest(
    projectionArtifact,
    "projectionArtifactDigest",
    projectionArtifactDigest,
    "projection artifact"
  );
  assertSelfDigest(
    assignment,
    "assignmentDigest",
    assignmentDigest,
    "assignment"
  );
  assertExactSources(projectionArtifact, request, contextClosure);
  if (
    projectionArtifact.spec.projectionId !== binding.id ||
    projectionArtifact.spec.projectionDefinitionDigest !==
      binding.definitionDigest ||
    !exactValue(projectionArtifact.spec.engine, binding.engine) ||
    projectionArtifact.spec.form.formDigest !==
      formDefinition.spec.formDigest ||
    !exactValue(
      projectionArtifact.spec.form.reference,
      exactReference(formDefinition)
    )
  ) {
    fail(
      "DAG_PROJECTION_AUTHORITY_MISMATCH",
      "projection artifact differs from its exact projection and form authority"
    );
  }
  const outputBytes = textContentBytes(projectionArtifact.spec.output.content);
  if (
    projectionArtifact.spec.output.outputDigest !==
      projectionOutputDigest(outputBytes)
  ) {
    fail(
      "DAG_PROJECTION_OUTPUT_MISMATCH",
      "projection output digest differs from its exact bytes"
    );
  }
  const skeletonBytes = textContentBytes(
    assignment.spec.uneditedSkeleton.content
  );
  if (
    !outputBytes.equals(skeletonBytes) ||
    assignment.spec.uneditedSkeleton.blankViewDigest !==
      blankViewDigest(skeletonBytes)
  ) {
    fail(
      "DAG_SKELETON_MISMATCH",
      "assignment skeleton differs from the blank projection output"
    );
  }
  const handle = requestHandleFromBlankView(skeletonBytes);
  if (
    assignment.spec.handle !== handle ||
    !requestDigestHex(request.spec.requestDigest).startsWith(handle)
  ) {
    fail(
      "DAG_HANDLE_MISMATCH",
      "assignment handle differs from its request-derived blank view"
    );
  }
  const reproducedBytes = renderProjectionBytes({
    request,
    contextClosure,
    formDefinition,
    requestHandle: handle,
    projectionBinding: binding,
    renderProjection
  });
  if (!reproducedBytes.equals(outputBytes)) {
    fail(
      "DAG_VIEW_REPRODUCTION_MISMATCH",
      "projection bytes differ from deterministic form and context rendering"
    );
  }
  if (
    assignment.spec.request.requestDigest !== request.spec.requestDigest ||
    !exactValue(
      assignment.spec.request.reference,
      exactReference(request)
    ) ||
    assignment.spec.projectionArtifact.projectionArtifactDigest !==
      projectionArtifact.spec.projectionArtifactDigest ||
    !exactValue(
      assignment.spec.projectionArtifact.reference,
      exactReference(projectionArtifact)
    ) ||
    assignment.spec.baseSemanticRevision !==
      request.spec.base.semanticRevision ||
    assignment.spec.baseSemanticStateDigest !==
      request.spec.base.semanticStateDigest
  ) {
    fail(
      "DAG_ASSIGNMENT_ANCESTRY_MISMATCH",
      "assignment differs from its request, projection, or semantic base"
    );
  }
  return Object.freeze({
    valid: true,
    requestDigest: request.spec.requestDigest,
    handle,
    blankViewDigest: assignment.spec.uneditedSkeleton.blankViewDigest,
    projectionArtifactDigest:
      projectionArtifact.spec.projectionArtifactDigest,
    assignmentDigest: assignment.spec.assignmentDigest
  });
}

function assertSubmissionProjection(
  assignment,
  projectionArtifact,
  formDefinition
) {
  assertResource(
    projectionArtifact,
    "ProjectionArtifact",
    "projection artifact"
  );
  assertSelfDigest(
    projectionArtifact,
    "projectionArtifactDigest",
    projectionArtifactDigest,
    "projection artifact"
  );
  if (
    assignment.spec.projectionArtifact.projectionArtifactDigest !==
      projectionArtifact.spec.projectionArtifactDigest ||
    !exactValue(
      assignment.spec.projectionArtifact.reference,
      exactReference(projectionArtifact)
    ) ||
    projectionArtifact.spec.form.formDigest !==
      formDefinition.spec.formDigest ||
    !exactValue(
      projectionArtifact.spec.form.reference,
      exactReference(formDefinition)
    ) ||
    !textContentBytes(projectionArtifact.spec.output.content).equals(
      textContentBytes(assignment.spec.uneditedSkeleton.content)
    )
  ) {
    fail(
      "DAG_SUBMISSION_PROJECTION_MISMATCH",
      "submission form, projection, and assignment ancestry differ"
    );
  }
}

function validDigestBinding(value) {
  return (
    isRecord(value) &&
    Object.keys(value).sort().join("\u0000") ===
      ["digest", "id"].sort().join("\u0000") &&
    typeof value.id === "string" &&
    value.id.length <= 160 &&
    /^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/.test(value.id) &&
    digestPattern.test(value.digest ?? "")
  );
}

function assertGenerationEvidence(value) {
  if (!isRecord(value)) {
    fail(
      "DAG_PRODUCER_GENERATION_INVALID",
      "producer generation evidence must be one closed object",
    );
  }
  const keys = Object.keys(value).sort();
  const expected = (
    Object.hasOwn(value, "telemetry")
      ? [
        "adapter",
        "attemptId",
        "configurationDigest",
        "model",
        "provider",
        "telemetry",
      ]
      : [
        "adapter",
        "attemptId",
        "configurationDigest",
        "model",
        "provider",
      ]
  ).sort();
  if (
    !exactValue(keys, expected) ||
    typeof value.attemptId !== "string" ||
    value.attemptId.length > 160 ||
    !/^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/.test(value.attemptId) ||
    typeof value.provider !== "string" ||
    unicodeScalarLength(value.provider) < 1 ||
    unicodeScalarLength(value.provider) > 512 ||
    !/\S/.test(value.provider) ||
    typeof value.model !== "string" ||
    unicodeScalarLength(value.model) < 1 ||
    unicodeScalarLength(value.model) > 512 ||
    !/\S/.test(value.model) ||
    !validDigestBinding(value.adapter) ||
    !digestPattern.test(value.configurationDigest ?? "")
  ) {
    fail(
      "DAG_PRODUCER_GENERATION_INVALID",
      "producer generation evidence lacks its exact bounded identity",
    );
  }
  if (Object.hasOwn(value, "telemetry")) {
    const telemetry = value.telemetry;
    const admitted = new Set([
      "costMicrounits",
      "inputTokens",
      "latencyMs",
      "outputTokens",
    ]);
    if (
      !isRecord(telemetry) ||
      Object.keys(telemetry).some((key) => !admitted.has(key)) ||
      Object.values(telemetry).some(
        (item) => !Number.isInteger(item) || item < 0,
      )
    ) {
      fail(
        "DAG_PRODUCER_GENERATION_INVALID",
        "producer generation telemetry must contain only non-negative integer counters",
      );
    }
  }
}

export function createCanonicalSubmission({
  name,
  request,
  contextClosure,
  assignment,
  projectionArtifact,
  projectionBinding,
  formDefinition,
  normalizedValues,
  rawEvidenceBytes,
  producerProvenance,
  renderProjection
}) {
  assertName(name, "submission name");
  verifyTextAssignmentDag({
    request,
    contextClosure,
    formDefinition,
    projectionBinding,
    projectionArtifact,
    assignment,
    renderProjection
  });
  assertSubmissionProjection(
    assignment,
    projectionArtifact,
    formDefinition
  );
  const validatedValues = validateAuthoringFieldValues({
    formDefinition,
    normalizedValues
  });
  const rawContent = exactTextContent(rawEvidenceBytes);
  const provenance = copyRecord(producerProvenance, "producer provenance");
  const provenanceKeys = Object.keys(provenance).sort();
  const expectedProvenanceKeys = [
    "evidenceDigest",
    "producerClass",
    "producerId",
    ...(Object.hasOwn(provenance, "adapter") ? ["adapter"] : []),
    ...(Object.hasOwn(provenance, "generation") ? ["generation"] : []),
  ].sort();
  if (
    !exactValue(provenanceKeys, expectedProvenanceKeys) ||
    typeof provenance.producerId !== "string" ||
    provenance.producerId.length > 160 ||
    !/^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/.test(provenance.producerId) ||
    typeof provenance.producerClass !== "string" ||
    provenance.producerClass.length > 160 ||
    !/^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/.test(
      provenance.producerClass
    ) ||
    !digestPattern.test(provenance.evidenceDigest ?? "") ||
    (
      Object.hasOwn(provenance, "adapter") &&
      !validDigestBinding(provenance.adapter)
    )
  ) {
    fail(
      "DAG_PRODUCER_PROVENANCE_INVALID",
      "producer provenance lacks its closed required identity"
    );
  }
  if (Object.hasOwn(provenance, "generation")) {
    assertGenerationEvidence(provenance.generation);
  }
  const submission = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringSubmission",
    metadata: { name },
    evidence: {
      rawEvidence: {
        content: rawContent,
        rawEvidenceDigest: rawEvidenceDigest(rawEvidenceBytes)
      },
      producerProvenance: provenance
    },
    spec: {
      normalizedSubmissionDigest: `sha256:${"0".repeat(64)}`,
      assignment: {
        reference: exactReference(assignment),
        assignmentDigest: assignment.spec.assignmentDigest
      },
      normalizedValues: stableValue(validatedValues)
    }
  };
  submission.spec.normalizedSubmissionDigest =
    normalizedSubmissionDigest(submission);
  return stableValue(submission);
}

export function createTextSubmission({
  name,
  request,
  contextClosure,
  assignment,
  projectionArtifact,
  projectionBinding,
  formDefinition,
  submittedBytes,
  producerProvenance,
  renderProjection
}) {
  verifyTextAssignmentDag({
    request,
    contextClosure,
    formDefinition,
    projectionBinding,
    projectionArtifact,
    assignment,
    renderProjection
  });
  const blankViewBytes = textContentBytes(
    assignment.spec.uneditedSkeleton.content
  );
  const parsed = parseTextForm({
    formDefinition,
    blankViewBytes,
    submittedBytes,
    expectedHandle: assignment.spec.handle
  });
  return Object.freeze({
    parsed,
    submission: createCanonicalSubmission({
      name,
      request,
      contextClosure,
      assignment,
      projectionArtifact,
      projectionBinding,
      formDefinition,
      normalizedValues: parsed.normalizedValues,
      rawEvidenceBytes: submittedBytes,
      producerProvenance,
      renderProjection
    })
  });
}

export function reproduceAssignmentView({
  request,
  contextClosure,
  formDefinition,
  projectionBinding,
  projectionArtifact,
  assignment,
  renderProjection
}) {
  verifyTextAssignmentDag({
    request,
    contextClosure,
    formDefinition,
    projectionBinding,
    projectionArtifact,
    assignment,
    renderProjection
  });
  return Buffer.from(
    textContentBytes(assignment.spec.uneditedSkeleton.content)
  );
}
