import {
  canonicalize,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  resourceReferenceFrom,
  resourceSemanticDigest,
} from "../kernel/digests.mjs";
import {
  validateSurveyResourceSemantics,
} from "./resource-semantics.mjs";

export class SurveyGenerationRecordError extends Error {
  constructor(code, field, message) {
    super(message);
    this.name = "SurveyGenerationRecordError";
    this.code = code;
    this.field = field;
  }
}

function fail(code, field, message) {
  throw new SurveyGenerationRecordError(code, field, message);
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function assertResource(resource, kind, field) {
  if (
    !isRecord(resource) ||
    typeof resource.apiVersion !== "string" ||
    resource.kind !== kind ||
    typeof resource.metadata?.name !== "string" ||
    !isRecord(resource.spec)
  ) {
    fail(
      "GENERATION_RESOURCE_INVALID",
      field,
      `${field} must be one ${kind} resource`,
    );
  }
}

function referenceKey(reference) {
  return canonicalize(reference);
}

function exactResolver(resources) {
  const index = new Map();
  for (const resource of resources) {
    let reference;
    try {
      reference = resourceReferenceFrom(resource);
    } catch (error) {
      fail(
        "GENERATION_INVENTORY_INVALID",
        "/resources",
        `resource inventory contains an unidentifiable value: ${error.message}`,
      );
    }
    const key = referenceKey(reference);
    const existing = index.get(key);
    if (
      existing !== undefined &&
      canonicalize(existing) !== canonicalize(resource)
    ) {
      fail(
        "GENERATION_INVENTORY_CONFLICT",
        "/resources",
        "one exact resource reference resolves to conflicting bytes",
      );
    }
    index.set(key, stableValue(resource));
  }
  return (reference) => index.get(referenceKey(reference));
}

function inputReferences(request) {
  const inputs = request.spec?.operation?.inputs;
  if (!isRecord(inputs)) {
    fail(
      "GENERATION_REQUEST_INPUTS_INVALID",
      "/request/spec/operation/inputs",
      "generation ancestry requires one closed Request input map",
    );
  }
  const keys = Object.keys(inputs).sort();
  if (keys.length < 1) {
    fail(
      "GENERATION_REQUEST_INPUTS_EMPTY",
      "/request/spec/operation/inputs",
      "a cognitive generation requires at least one exact input resource",
    );
  }
  return keys.map((key) => stableValue(inputs[key]));
}

function generationEvidence(submission) {
  const generation =
    submission.evidence?.producerProvenance?.generation;
  if (!isRecord(generation)) {
    fail(
      "GENERATION_PRODUCER_EVIDENCE_REQUIRED",
      "/submission/evidence/producerProvenance/generation",
      "Survey generation requires closed producer generation evidence",
    );
  }
  return stableValue(generation);
}

function deterministicName(resource) {
  const digest = resourceSemanticDigest(resource)
    .slice("sha256:".length);
  resource.metadata.name = `generation-${digest}`;
  return resource;
}

function priorGenerationReferences(inputRefs) {
  return inputRefs.filter(
    (reference) =>
      reference.apiVersion === "survey.mission-kit/v1alpha1" &&
      reference.kind === "GenerationRecord",
  );
}

function revisionReferences(request) {
  if (request.spec.operation.class !== "revision") return [];
  const expected = request.spec.operation.expectedHeads;
  if (!Array.isArray(expected)) {
    fail(
      "GENERATION_REVISION_ANCESTRY_INVALID",
      "/request/spec/operation/expectedHeads",
      "revision generation requires ordered expected heads",
    );
  }
  return expected.map((head) => stableValue(head.reference));
}

/**
 * Build one immutable GenerationRecord after the semantic Mutation and final
 * CommitReceipt exist. The function owns no persistence capability and cannot
 * alter cognitive products.
 */
export function createSurveyGenerationRecord({
  request,
  assignment,
  submission,
  contextClosure,
  mutation,
  receipt,
  resources,
}) {
  assertResource(request, "AuthoringRequest", "/request");
  assertResource(assignment, "AuthoringAssignment", "/assignment");
  assertResource(submission, "AuthoringSubmission", "/submission");
  assertResource(contextClosure, "ContextClosure", "/contextClosure");
  assertResource(mutation, "AuthoringMutation", "/mutation");
  assertResource(receipt, "AuthoringCommitReceipt", "/receipt");
  if (!Array.isArray(resources)) {
    fail(
      "GENERATION_INVENTORY_INVALID",
      "/resources",
      "GenerationRecord construction requires one exact resource inventory",
    );
  }
  if (receipt.spec?.cause?.class !== "task-submission") {
    fail(
      "GENERATION_RUNTIME_CAUSE_FORBIDDEN",
      "/receipt/spec/cause/class",
      "runtime-only events cannot create a GenerationRecord",
    );
  }
  const inputs = inputReferences(request);
  const record = deterministicName({
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "GenerationRecord",
    metadata: { name: "pending" },
    spec: {
      requestRef: resourceReferenceFrom(request),
      assignmentRef: resourceReferenceFrom(assignment),
      submissionRef: resourceReferenceFrom(submission),
      contextClosureRef: resourceReferenceFrom(contextClosure),
      result: {
        commitReceiptRef: resourceReferenceFrom(receipt),
        createdResourceRefs: stableValue(
          receipt.spec.createdResources,
        ),
      },
      ancestry: {
        inputResourceRefs: inputs,
        priorGenerationRecordRefs:
          priorGenerationReferences(inputs),
        revisionOfRefs: revisionReferences(request),
      },
      assessmentAncestryRefs: [],
    },
    evidence: {
      producer: generationEvidence(submission),
    },
  });
  const resolver = exactResolver([
    ...resources,
    request,
    assignment,
    submission,
    contextClosure,
    mutation,
    receipt,
  ]);
  const issues = validateSurveyResourceSemantics(record, {
    resolveReference: resolver,
  });
  if (issues.length > 0) {
    const first = issues[0];
    fail(
      first.code,
      first.field,
      first.reason,
    );
  }
  return Object.freeze(stableValue(record));
}
