import { createHash } from "node:crypto";
import { canonicalize, stableValue } from "./canonical.mjs";

export const AUTHORING_DIGEST_VERSION = "v1";

export const AUTHORING_DIGEST_DOMAINS = Object.freeze([
  "resource-semantics",
  "resource-reference",
  "resource-integrity",
  "workspace-semantic-state",
  "workspace-integrity",
  "request-core",
  "context-selector",
  "lifecycle-rule",
  "context-closure",
  "source-snapshot",
  "form-definition",
  "blank-view",
  "projection-output",
  "normalized-submission",
  "raw-evidence",
  "commit-receipt",
  "journal-record",
  "profile-manifest",
  "revision-unit",
  "revision-plan",
  "assignment",
  "projection-artifact",
  "mutation",
  "evidence-mutation"
]);

const authoringDigestDomainSet = new Set(AUTHORING_DIGEST_DOMAINS);
const canonicalBase64Pattern = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

function assertKnownDomain(domain) {
  if (typeof domain !== "string" || !authoringDigestDomainSet.has(domain)) {
    throw new TypeError(`unknown authoring digest domain: ${String(domain)}`);
  }
}

function asCanonicalRecord(value, label) {
  const stable = stableValue(value);
  if (stable === null || Array.isArray(stable) || typeof stable !== "object") {
    throw new TypeError(`${label} must be a canonical JSON object`);
  }
  return stable;
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(`${label} must be a non-empty string`);
  }
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !/^sha256:[0-9a-f]{64}$/.test(value)) {
    throw new TypeError(`${label} must be a sha256 digest`);
  }
}

function assertProjectionFields(include, selfDigestField, label) {
  if (!Array.isArray(include) || include.length === 0) {
    throw new TypeError(`${label} include must be a non-empty array`);
  }
  const seen = new Set();
  for (const field of include) {
    assertNonEmptyString(field, `${label} included field`);
    if (seen.has(field)) throw new TypeError(`${label} includes duplicate field ${field}`);
    if (field === selfDigestField) {
      throw new TypeError(`${label} cannot include its self-digest field ${selfDigestField}`);
    }
    seen.add(field);
  }
}

export function isAuthoringDigestDomain(domain) {
  return typeof domain === "string" && authoringDigestDomainSet.has(domain);
}

export function authoringDigestPrefix(domain) {
  assertKnownDomain(domain);
  return `mission-kit:authoring:${domain}:${AUTHORING_DIGEST_VERSION}\0`;
}

export function authoringDigest(domain, value) {
  const prefix = Buffer.from(authoringDigestPrefix(domain), "utf8");
  const canonicalBytes = Buffer.from(canonicalize(value), "utf8");
  return `sha256:${createHash("sha256").update(prefix).update(canonicalBytes).digest("hex")}`;
}

/**
 * Project an explicit semantic core from a wider persisted/evidence object.
 * Every included field is required. The configured digest field can exist on
 * the wider object, but cannot enter the projected core and create a cycle.
 */
export function projectSelfExcludedCore(
  value,
  {
    include,
    selfDigestField = "digest",
    label = "digest core"
  }
) {
  assertNonEmptyString(selfDigestField, `${label} selfDigestField`);
  assertProjectionFields(include, selfDigestField, label);
  const stable = asCanonicalRecord(value, label);
  const projected = {};
  for (const field of include) {
    if (!Object.hasOwn(stable, field)) {
      throw new TypeError(`${label} is missing required field ${field}`);
    }
    projected[field] = stable[field];
  }
  return projected;
}

export function digestProjectedCore(domain, value, options) {
  return authoringDigest(domain, projectSelfExcludedCore(value, options));
}

/**
 * Convert opaque bytes to the only canonical JSON representation admitted at
 * byte-bearing contract boundaries. Strings are deliberately rejected so a
 * filesystem path can never be mistaken for its contents.
 */
export function encodeExactBytes(bytes) {
  if (!(bytes instanceof Uint8Array)) {
    throw new TypeError("exact bytes must be supplied as a Uint8Array, not text or a path");
  }
  const copy = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return Object.freeze({
    encoding: "base64",
    data: copy.toString("base64")
  });
}

export function decodeExactBytes(value) {
  const stable = asCanonicalRecord(value, "exact byte value");
  const keys = Object.keys(stable).sort();
  if (
    keys.length !== 2 ||
    keys[0] !== "data" ||
    keys[1] !== "encoding" ||
    stable.encoding !== "base64" ||
    typeof stable.data !== "string" ||
    !canonicalBase64Pattern.test(stable.data)
  ) {
    throw new TypeError("exact byte value must be exactly {encoding:\"base64\",data:<canonical-base64>}");
  }
  const bytes = Buffer.from(stable.data, "base64");
  if (bytes.toString("base64") !== stable.data) {
    throw new TypeError("exact byte value contains non-canonical base64");
  }
  return bytes;
}

export function digestExactBytes(domain, bytes) {
  return authoringDigest(domain, encodeExactBytes(bytes));
}

export function blankViewDigest(bytes) {
  return digestExactBytes("blank-view", bytes);
}

export function projectionOutputDigest(bytes) {
  return digestExactBytes("projection-output", bytes);
}

export function rawEvidenceDigest(bytes) {
  return digestExactBytes("raw-evidence", bytes);
}

/**
 * Resource semantic identity is intentionally and exactly the three-field
 * projection fixed by the architecture. Metadata and status are not semantic
 * inputs.
 */
export function projectResourceSemantics(resource) {
  return projectSelfExcludedCore(resource, {
    include: ["apiVersion", "kind", "spec"],
    selfDigestField: "semanticDigest",
    label: "resource semantics"
  });
}

export function resourceSemanticDigest(resource) {
  return authoringDigest("resource-semantics", projectResourceSemantics(resource));
}

export function projectResourceReference(reference) {
  const projected = projectSelfExcludedCore(reference, {
    include: ["apiVersion", "kind", "name", "semanticDigest"],
    selfDigestField: "referenceDigest",
    label: "resource reference"
  });
  assertNonEmptyString(projected.apiVersion, "resource reference apiVersion");
  assertNonEmptyString(projected.kind, "resource reference kind");
  assertNonEmptyString(projected.name, "resource reference name");
  assertDigest(projected.semanticDigest, "resource reference semanticDigest");
  return projected;
}

export function resourceReferenceFrom(resource) {
  const stable = asCanonicalRecord(resource, "resource");
  const metadata = asCanonicalRecord(stable.metadata, "resource metadata");
  assertNonEmptyString(stable.apiVersion, "resource apiVersion");
  assertNonEmptyString(stable.kind, "resource kind");
  assertNonEmptyString(metadata.name, "resource metadata.name");
  return {
    apiVersion: stable.apiVersion,
    kind: stable.kind,
    name: metadata.name,
    semanticDigest: resourceSemanticDigest(stable)
  };
}

export function resourceReferenceDigest(reference) {
  return authoringDigest("resource-reference", projectResourceReference(reference));
}

export function resourceIntegrityCore(resource) {
  const stable = asCanonicalRecord(resource, "resource integrity");
  if (Object.hasOwn(stable, "integrityDigest")) {
    throw new TypeError("resource integrity cannot contain its own integrityDigest field");
  }
  return stable;
}

export function resourceIntegrityDigest(resource) {
  return authoringDigest("resource-integrity", resourceIntegrityCore(resource));
}

/**
 * Authoring contracts store their own domain digest inside `spec`. This
 * resource-shaped projection omits exactly that one field, while retaining
 * every other spec field and excluding non-semantic metadata.
 */
export function projectSelfExcludedResourceCore(
  resource,
  {
    selfDigestField,
    label = "resource digest core"
  }
) {
  assertNonEmptyString(selfDigestField, `${label} selfDigestField`);
  const semantics = projectResourceSemantics(resource);
  const spec = asCanonicalRecord(semantics.spec, `${label} spec`);
  if (!Object.hasOwn(spec, selfDigestField)) {
    throw new TypeError(`${label} spec is missing required self-digest field ${selfDigestField}`);
  }
  const coreSpec = {};
  for (const [field, value] of Object.entries(spec)) {
    if (field !== selfDigestField) coreSpec[field] = value;
  }
  return {
    apiVersion: semantics.apiVersion,
    kind: semantics.kind,
    spec: coreSpec
  };
}

export function projectRequestCore(request) {
  const core = projectSelfExcludedResourceCore(request, {
    selfDigestField: "requestDigest",
    label: "authoring request"
  });
  const forbiddenProjectionFields = [
    "blankViewDigest",
    "blankViewProjectionDigest",
    "outputDigest",
    "projectionArtifactDigest",
    "viewDigest"
  ];
  for (const field of forbiddenProjectionFields) {
    if (Object.hasOwn(core.spec, field)) {
      throw new TypeError(`authoring request cannot contain later projection field ${field}`);
    }
  }
  return core;
}

export function requestCoreDigest(request) {
  return authoringDigest("request-core", projectRequestCore(request));
}

export function projectContextSelectorCore(selector) {
  return projectSelfExcludedCore(selector, {
    include: [
      "id",
      "ordinal",
      "role",
      "resourceType",
      "cardinality",
      "requiredLifecycleState",
      "lifecycleRule",
      "selection",
      "projection"
    ],
    selfDigestField: "selectorDigest",
    label: "context selector"
  });
}

export function contextSelectorDigest(selector) {
  return authoringDigest(
    "context-selector",
    projectContextSelectorCore(selector)
  );
}

export function projectLifecycleRuleCore(selector) {
  const value = asCanonicalRecord(selector, "lifecycle rule");
  for (const field of ["requiredLifecycleState", "lifecycleRule"]) {
    if (!Object.hasOwn(value, field)) {
      throw new TypeError(`lifecycle rule is missing required field ${field}`);
    }
  }
  return {
    requiredLifecycleState: value.requiredLifecycleState,
    lifecycleRule: value.lifecycleRule
  };
}

export function lifecycleRuleDigest(selector) {
  return authoringDigest(
    "lifecycle-rule",
    projectLifecycleRuleCore(selector)
  );
}

export function projectProfileManifestCore(profileManifest) {
  return projectSelfExcludedResourceCore(profileManifest, {
    selfDigestField: "profileDigest",
    label: "authoring profile manifest"
  });
}

export function profileManifestDigest(profileManifest) {
  return authoringDigest(
    "profile-manifest",
    projectProfileManifestCore(profileManifest)
  );
}

export function projectRevisionUnitCore(revisionUnit) {
  return projectSelfExcludedCore(revisionUnit, {
    include: [
      "id",
      "normalTransitionId",
      "replacementTargets",
      "assignmentContract",
      "descendantClosure",
      "normalPostcondition",
      "disclosureControl",
      "revisionPlans"
    ],
    selfDigestField: "unitDigest",
    label: "revision unit"
  });
}

export function revisionUnitDigest(revisionUnit) {
  return authoringDigest(
    "revision-unit",
    projectRevisionUnitCore(revisionUnit)
  );
}

export function projectRevisionPlanCore(revisionPlan) {
  return projectSelfExcludedCore(revisionPlan, {
    include: [
      "id",
      "transitionId",
      "fromStates",
      "eventId",
      "selectionGuardId",
      "authority",
      "externalCouplings"
    ],
    selfDigestField: "planDigest",
    label: "revision plan"
  });
}

export function revisionPlanDigest(revisionPlan) {
  return authoringDigest(
    "revision-plan",
    projectRevisionPlanCore(revisionPlan)
  );
}

export function projectWorkspaceSemanticStateCore(workspace) {
  const semantics = projectResourceSemantics(workspace);
  const spec = asCanonicalRecord(semantics.spec, "authoring workspace spec");
  const semanticSpec = projectSelfExcludedCore(spec, {
    include: [
      "profile",
      "protocol",
      "authoringState",
      "semanticRevision",
      "activeHeads",
      "dependencyEdges",
      "handoffProducts"
    ],
    selfDigestField: "semanticStateDigest",
    label: "workspace semantic state"
  });
  return {
    apiVersion: semantics.apiVersion,
    kind: semantics.kind,
    spec: semanticSpec
  };
}

export function workspaceSemanticStateDigest(workspace) {
  return authoringDigest(
    "workspace-semantic-state",
    projectWorkspaceSemanticStateCore(workspace)
  );
}

export function projectWorkspaceIntegrityCore(workspace) {
  const stable = asCanonicalRecord(workspace, "authoring workspace integrity");
  if (!Object.hasOwn(stable, "spec")) {
    throw new TypeError("authoring workspace integrity is missing required field spec");
  }
  const spec = asCanonicalRecord(stable.spec, "authoring workspace integrity spec");
  if (!Object.hasOwn(spec, "integrity")) {
    throw new TypeError("authoring workspace integrity spec is missing required field integrity");
  }
  const integrity = asCanonicalRecord(
    spec.integrity,
    "authoring workspace integrity values"
  );
  if (!Object.hasOwn(integrity, "workspaceIntegrityDigest")) {
    throw new TypeError(
      "authoring workspace integrity values are missing required field workspaceIntegrityDigest"
    );
  }
  const projectedIntegrity = {};
  for (const [field, value] of Object.entries(integrity)) {
    if (field !== "workspaceIntegrityDigest") projectedIntegrity[field] = value;
  }
  return {
    ...stable,
    spec: {
      ...spec,
      integrity: projectedIntegrity
    }
  };
}

export function workspaceIntegrityDigest(workspace) {
  return authoringDigest(
    "workspace-integrity",
    projectWorkspaceIntegrityCore(workspace)
  );
}

export function projectAssignmentCore(assignment) {
  return projectSelfExcludedResourceCore(assignment, {
    selfDigestField: "assignmentDigest",
    label: "authoring assignment"
  });
}

export function assignmentDigest(assignment) {
  return authoringDigest("assignment", projectAssignmentCore(assignment));
}

export function projectContextClosureCore(contextClosure) {
  return projectSelfExcludedResourceCore(contextClosure, {
    selfDigestField: "closureDigest",
    label: "context closure"
  });
}

export function contextClosureDigest(contextClosure) {
  return authoringDigest(
    "context-closure",
    projectContextClosureCore(contextClosure)
  );
}

export function projectSourceSnapshotCore(sourceSnapshot) {
  return projectSelfExcludedResourceCore(sourceSnapshot, {
    selfDigestField: "sourceDigest",
    label: "source snapshot"
  });
}

export function sourceSnapshotDigest(sourceSnapshot) {
  return authoringDigest(
    "source-snapshot",
    projectSourceSnapshotCore(sourceSnapshot)
  );
}

export function projectFormDefinitionCore(formDefinition) {
  return projectSelfExcludedResourceCore(formDefinition, {
    selfDigestField: "formDigest",
    label: "authoring form definition"
  });
}

export function formDefinitionDigest(formDefinition) {
  return authoringDigest(
    "form-definition",
    projectFormDefinitionCore(formDefinition)
  );
}

export function projectProjectionArtifactCore(artifact) {
  return projectSelfExcludedResourceCore(artifact, {
    selfDigestField: "projectionArtifactDigest",
    label: "projection artifact"
  });
}

export function projectionArtifactDigest(artifact) {
  return authoringDigest(
    "projection-artifact",
    projectProjectionArtifactCore(artifact)
  );
}

export function projectMutationCore(mutation) {
  return projectSelfExcludedResourceCore(mutation, {
    selfDigestField: "mutationDigest",
    label: "authoring mutation"
  });
}

export function mutationDigest(mutation) {
  return authoringDigest("mutation", projectMutationCore(mutation));
}

export function projectCommitReceiptCore(receipt) {
  return projectSelfExcludedResourceCore(receipt, {
    selfDigestField: "receiptDigest",
    label: "authoring commit receipt"
  });
}

export function commitReceiptDigest(receipt) {
  return authoringDigest(
    "commit-receipt",
    projectCommitReceiptCore(receipt)
  );
}

const journalRecordAuthenticationFields = Object.freeze([
  "commitId",
  "ordinal",
  "commitKind",
  "actor",
  "authority",
  "idempotency",
  "commandDigest",
  "payloadDigest",
  "previousSealDigest",
  "before",
  "after",
  "beforeWorkspaceIntegrityDigest",
  "afterWorkspaceIntegrityDigest",
  "workspaceEffect",
  "mutationDigest",
  "machineEdges"
]);

export function projectJournalRecordAuthenticationCore(record) {
  return projectSelfExcludedCore(record, {
    include: journalRecordAuthenticationFields,
    selfDigestField: "authenticationDigest",
    label: "authoring journal record authentication"
  });
}

export function projectJournalRecordCore(record) {
  return projectSelfExcludedCore(record, {
    include: [
      ...journalRecordAuthenticationFields,
      "authenticationDigest"
    ],
    selfDigestField: "recordDigest",
    label: "authoring journal record"
  });
}

export function journalRecordDigest(record) {
  return authoringDigest(
    "journal-record",
    projectJournalRecordCore(record)
  );
}

/**
 * Producer evidence is durable but not semantic. Only assignment ancestry and
 * the normalized values participate in normalized-submission identity.
 */
export function projectNormalizedSubmissionCore(submission) {
  const semantics = projectResourceSemantics(submission);
  const spec = asCanonicalRecord(semantics.spec, "normalized submission spec");
  if (!Object.hasOwn(spec, "assignment")) {
    throw new TypeError("normalized submission spec is missing required field assignment");
  }
  const assignment = asCanonicalRecord(
    spec.assignment,
    "normalized submission assignment"
  );
  if (!Object.hasOwn(spec, "normalizedSubmissionDigest")) {
    throw new TypeError(
      "normalized submission spec is missing required field normalizedSubmissionDigest"
    );
  }
  return projectSelfExcludedCore({
    ...spec,
    assignmentDigest: assignment.assignmentDigest
  }, {
    include: ["assignmentDigest", "normalizedValues"],
    selfDigestField: "normalizedSubmissionDigest",
    label: "normalized submission"
  });
}

export function normalizedSubmissionDigest(submission) {
  const core = projectNormalizedSubmissionCore(submission);
  assertDigest(core.assignmentDigest, "normalized submission assignmentDigest");
  return authoringDigest("normalized-submission", core);
}
