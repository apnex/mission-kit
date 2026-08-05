import {
  validateContractSemantics
} from "../kernel/contract-semantics.mjs";
import {
  canonicalize,
  sha256Value
} from "../kernel/canonical.mjs";
import {
  validateById as validateGeneratedById
} from "../../../generated/validators.mjs";
import {
  sharedResourceBinding,
  validateSharedResource
} from "../../../generated/shared-semantic-validators.mjs";
import {
  SURVEY_RESOURCE_SCHEMA_IDS,
  validateSurveyResourceGraph,
  validateSurveyResourceSemantics
} from "./resource-semantics.mjs";
import {
  resourceSemanticDigest,
  workspaceSemanticStateDigest
} from "../kernel/digests.mjs";
import canonicalSurveyProtocol from "../../protocol/survey-v2.protocol.json"
  with { type: "json" };
import canonicalSurveyProtocolV1 from "../../protocol/survey.protocol.json"
  with { type: "json" };
import canonicalPairedStateMatrix from "../../protocol/paired-state-matrix.v2.json"
  with { type: "json" };
import candidateProjectionLock from "../../../generated/projection-lock.json"
  with { type: "json" };

export const SESSION_SCHEMA_V1 =
  "urn:mission-kit:survey-v2:schema:session-state:v1";
export const ACTIVE_SESSION_SCHEMA_V1 =
  "urn:mission-kit:survey-v2:schema:session-state-active-v1:v2";
export const SESSION_SCHEMA_V2 =
  "urn:mission-kit:survey-v2:schema:session-state:v2";
export const ACTIVE_V1_SELECTOR = "active-v1-default";
export const HISTORICAL_V1_SELECTOR = "historical-v1-resume";
export const CANDIDATE_V2_SELECTOR = "v2-authoring-candidate";

const SURVEY_PACKAGE_ID = "urn:mission-kit:survey-v2:package:survey-v2";
const SURVEY_PROTOCOL_ID = "urn:mission-kit:survey-v2:protocol:survey";
const FROZEN_V1_PROJECTION_DIGEST =
  "sha256:6603b777b82783176fca6129bfecde7a6e253f5be86f9becf94703d818b9757c";
const FROZEN_V1_PROTOCOL_DIGEST =
  "sha256:d99054ceba9e72ad3787ef038b41184b70968e6e4e444b67178b7328542d515a";
const SURVEY_API_VERSION = "survey.mission-kit/v1alpha1";
const AUTHORING_API_VERSION = "authoring.mission-kit/v1alpha1";
const SHARED_API_VERSION = "schemas.mission-kit/v1alpha1";
export const LOCAL_AUTHORING_RESOURCE_SCHEMA_IDS = Object.freeze({
  AuthoringAssignment:
    "urn:mission-kit:authoring:schema:authoring-assignment:v1alpha1",
  AuthoringCommitReceipt:
    "urn:mission-kit:authoring:schema:authoring-commit-receipt:v1alpha1",
  AuthoringFormDefinition:
    "urn:mission-kit:authoring:schema:authoring-form-definition:v1alpha1",
  AuthoringMutation:
    "urn:mission-kit:authoring:schema:authoring-mutation:v1alpha1",
  AuthoringProfileManifest:
    "urn:mission-kit:authoring:schema:authoring-profile-manifest:v1alpha1",
  AuthoringProtocol:
    "urn:mission-kit:authoring:schema:authoring-protocol:v1alpha1",
  AuthoringRequest:
    "urn:mission-kit:authoring:schema:authoring-request:v1alpha1",
  AuthoringSubmission:
    "urn:mission-kit:authoring:schema:authoring-submission:v1alpha1",
  AuthoringWorkspace:
    "urn:mission-kit:authoring:schema:authoring-workspace:v1alpha1",
  ContextClosure:
    "urn:mission-kit:authoring:schema:context-closure:v1alpha1",
  ProjectionArtifact:
    "urn:mission-kit:authoring:schema:projection-artifact:v1alpha1",
  SourceSnapshot:
    "urn:mission-kit:authoring:schema:source-snapshot:v1alpha1",
  ValidationIssue:
    "urn:mission-kit:authoring:schema:validation-issue:v1alpha1"
});
const RUNTIME_ARTIFACT_KIND = "SurveyRuntimeArtifact";
const RUNTIME_ARTIFACT_SCHEMA_ID =
  "urn:mission-kit:survey:schema:survey-runtime-artifact:v1alpha1";
const RUNTIME_VARIANT_KINDS = new Set([
  "RoundResponseSet",
  "RevisionDirective",
  "CandidateValidationEvidence",
  "FinalizationDiagnostic",
  "CompositeRuntimeEvidence"
]);
const MAX_RESOURCE_AUTHORITY_DEPTH = 128;
const MAX_RESOURCE_AUTHORITY_NODES = 100000;
const MACHINE_IDS = new Set(["authoring", "phase", "runtime"]);
const MACHINE_ORDER = new Map([
  ["authoring", 0],
  ["phase", 1],
  ["runtime", 2]
]);
let canonicalPairIndex;
let canonicalTransitionAuthority;
let canonicalMachineInitialStates;

function issue(code, field, reason) {
  return Object.freeze({ code, field, reason });
}

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function referenceKey(reference) {
  return [
    reference?.apiVersion,
    reference?.kind,
    reference?.name,
    reference?.semanticDigest
  ].join("\u0000");
}

function logicalReferenceKey(reference) {
  return [
    reference?.apiVersion,
    reference?.kind,
    reference?.name
  ].join("\u0000");
}

function sameRevisionState(left, right) {
  return (
    left?.semanticRevision === right?.semanticRevision &&
    left?.evidenceRevision === right?.evidenceRevision &&
    left?.semanticStateDigest === right?.semanticStateDigest
  );
}

function withoutKey(value, key) {
  return Object.fromEntries(
    Object.entries(value).filter(([field]) => field !== key)
  );
}

/**
 * Derive the one canonical semantic state from which every candidate v2
 * journal begins. The profile and protocol pins are retained, while all
 * mutable authoring collections and revisions are reset to their declared
 * genesis values.
 */
export function sessionGenesisRevisionState(session) {
  const workspace = session?.authoring?.workspace;
  const genesisWorkspace = {
    apiVersion: workspace?.apiVersion,
    kind: workspace?.kind,
    metadata: structuredClone(workspace?.metadata ?? {}),
    spec: {
      profile: structuredClone(workspace?.spec?.profile),
      protocol: structuredClone(workspace?.spec?.protocol),
      authoringState: "new",
      semanticRevision: 0,
      activeHeads: [],
      dependencyEdges: [],
      handoffProducts: []
    }
  };
  return Object.freeze({
    semanticRevision: 0,
    evidenceRevision: 0,
    semanticStateDigest: workspaceSemanticStateDigest(genesisWorkspace)
  });
}

/**
 * Domain-separate the first journal link from arbitrary attacker-selected
 * digest material. Subsequent links bind the exact prior record digest.
 */
export function sessionGenesisSealDigest(session) {
  return sha256Value({
    domain: "survey-v2/session-genesis-seal/v1",
    sessionId: session?.sessionId,
    schemaId: session?.$schema,
    package: session?.package,
    protocol: {
      id: session?.protocol?.id,
      version: session?.protocol?.version,
      digest: session?.protocol?.digest
    },
    revisionState: sessionGenesisRevisionState(session)
  });
}

function isRuntimeArtifactReference(reference) {
  return (
    record(reference) &&
    reference.apiVersion === SURVEY_API_VERSION &&
    reference.kind === RUNTIME_ARTIFACT_KIND &&
    typeof reference.name === "string" &&
    typeof reference.semanticDigest === "string"
  );
}

function matrixPairKey(authoringState, phaseState) {
  return `${authoringState}\u0000${phaseState}`;
}

function machineTransitionKey(machineId, transitionId) {
  return `${machineId}\u0000${transitionId}`;
}

function machineEdgeSequenceKey(edges) {
  return canonicalize(edges.map((edge) => ({
    machineId: edge.machineId,
    transitionId: edge.transitionId
  })));
}

function canonicalMachineGenesisStates() {
  if (canonicalMachineInitialStates) return canonicalMachineInitialStates;
  canonicalMachineInitialStates = new Map(
    canonicalSurveyProtocol.machines.map((machine) => [
      machine.id,
      machine.id === "authoring"
        ? machine.protocol.spec.initialState
        : machine.initial
    ])
  );
  return canonicalMachineInitialStates;
}

/**
 * Bind a machine-state occurrence to one exact session, protocol, state, and
 * global journal ordinal. Ordinal zero is the canonical post-bootstrap
 * genesis occurrence; every accepted transition produces the occurrence at
 * its owning journal ordinal.
 */
export function sessionMachineStateDigest(
  session,
  {
    machineId,
    state,
    journalOrdinal
  }
) {
  if (
    !MACHINE_IDS.has(machineId) ||
    typeof state !== "string" ||
    state.length === 0 ||
    !Number.isInteger(journalOrdinal) ||
    journalOrdinal < 0
  ) {
    throw new TypeError(
      "machine-state identity requires a canonical machine, state, and non-negative journal ordinal"
    );
  }
  return sha256Value({
    domain: "survey-v2/session-machine-state/v1",
    session: {
      id: session?.sessionId,
      schema: session?.$schema
    },
    package: session?.package,
    protocol: {
      id: session?.protocol?.id,
      version: session?.protocol?.version,
      digest: session?.protocol?.digest
    },
    machineId,
    state,
    journalOrdinal
  });
}

function addCoupling(couplings, leftMachineId, leftTransitionId, rightMachineId, rightTransitionId) {
  const left = machineTransitionKey(leftMachineId, leftTransitionId);
  const right = machineTransitionKey(rightMachineId, rightTransitionId);
  const leftPartners = couplings.get(left) ?? new Set();
  const rightPartners = couplings.get(right) ?? new Set();
  leftPartners.add(right);
  rightPartners.add(left);
  couplings.set(left, leftPartners);
  couplings.set(right, rightPartners);
}

function canonicalMachineTransitionAuthority() {
  if (canonicalTransitionAuthority) return canonicalTransitionAuthority;
  const transitions = new Map();
  const couplings = new Map();
  const atomicSequences = new Map();

  for (const machine of canonicalSurveyProtocol.machines) {
    const machineTransitions = machine.id === "authoring"
      ? machine.protocol.spec.transitions
      : machine.transitions;
    const selectors = new Map(
      (machine.selectors ?? []).map((selector) => [
        selector.id,
        new Set(selector.members)
      ])
    );
    for (const transition of machineTransitions) {
      const sources = transition.source?.mode === "single"
        ? [transition.source.stateId]
        : (transition.source?.stateIds ?? [transition.from]);
      transitions.set(
        machineTransitionKey(machine.id, transition.id),
        Object.freeze({
          sources: new Set(sources),
          eventId: transition.eventId ?? transition.event,
          toState: transition.toState ?? transition.to
        })
      );
    }
    for (const family of machine.families ?? []) {
      transitions.set(
        machineTransitionKey(machine.id, family.id),
        Object.freeze({
          sources: selectors.get(family.fromSelector) ?? new Set(),
          eventId: family.event,
          toState: family.to
        })
      );
    }
  }

  for (const coupling of canonicalSurveyProtocol.authoringCouplings) {
    addCoupling(
      couplings,
      "authoring",
      coupling.authoringTransitionId,
      "phase",
      coupling.phaseTransitionId
    );
  }
  const phaseMachine = canonicalSurveyProtocol.machines.find(
    (machine) => machine.id === "phase"
  );
  for (const transition of phaseMachine.transitions) {
    if (transition.coupledTransition) {
      addCoupling(
        couplings,
        "phase",
        transition.id,
        "runtime",
        transition.coupledTransition
      );
    }
  }
  for (const family of phaseMachine.families) {
    if (family.coupledFamily) {
      addCoupling(
        couplings,
        "phase",
        family.id,
        "runtime",
        family.coupledFamily
      );
    }
  }
  for (const sequence of canonicalSurveyProtocol.atomicSequences ?? []) {
    atomicSequences.set(
      machineEdgeSequenceKey(sequence.edges),
      Object.freeze({
        id: sequence.id,
        edgeKeys: new Set(
          sequence.edges.map((edge) => (
            machineTransitionKey(edge.machineId, edge.transitionId)
          ))
        )
      })
    );
  }

  canonicalTransitionAuthority = Object.freeze({
    transitions,
    couplings,
    atomicSequences
  });
  return canonicalTransitionAuthority;
}

function pairedStateIndex(matrix) {
  if (
    !record(matrix) ||
    matrix.$schema !==
      "urn:mission-kit:survey-v2:schema:paired-state-matrix:v2" ||
    matrix.schemaVersion !== "2.0.0" ||
    matrix.id !== "urn:mission-kit:survey-v2:paired-state-matrix:survey-v2" ||
    !Array.isArray(matrix.pairs)
  ) {
    throw new TypeError("paired-state matrix must be the canonical v2 matrix");
  }
  const pairs = new Map();
  matrix.pairs.forEach((pair, index) => {
    if (
      !record(pair) ||
      typeof pair.authoringState !== "string" ||
      typeof pair.phaseState !== "string" ||
      !Array.isArray(pair.pathClasses)
    ) {
      throw new TypeError(`paired-state matrix pair ${index} is malformed`);
    }
    const key = matrixPairKey(pair.authoringState, pair.phaseState);
    if (pairs.has(key)) {
      throw new TypeError(`paired-state matrix repeats pair ${key}`);
    }
    pairs.set(key, pair);
  });
  return pairs;
}

function canonicalPairedStateIndex() {
  canonicalPairIndex ??= pairedStateIndex(canonicalPairedStateMatrix);
  return canonicalPairIndex;
}

function prefixIssues(issues, path) {
  return issues.map((item) => issue(
    item.code,
    `${path}${item.field ?? ""}`,
    item.reason
  ));
}

function workspaceContractIssues(workspace) {
  if (!record(workspace) || workspace.kind !== "AuthoringWorkspace") {
    return [issue(
      "SESSION_WORKSPACE_INVALID",
      "/authoring/workspace",
      "The authoring branch must contain one AuthoringWorkspace."
    )];
  }
  try {
    return prefixIssues(
      validateContractSemantics(workspace),
      "/authoring/workspace"
    );
  } catch {
    return [issue(
      "SESSION_WORKSPACE_INVALID",
      "/authoring/workspace",
      "The authoring workspace is not structurally safe for semantic validation."
    )];
  }
}

function surveyGraphField(field, graphEntries) {
  return field.replace(
    /^\/resources\/([0-9]+)/,
    (_, index) => graphEntries[Number(index)]?.path ?? `/resources/${index}`
  );
}

function embeddedResourceChildren(resource, resourcePath) {
  if (resource?.kind === "ContextClosure") {
    return resource.spec.layers.map((layer, index) => ({
      path: `${resourcePath}/spec/layers/${index}/sourceSnapshot`,
      resource: layer.sourceSnapshot
    }));
  }
  if (resource?.kind === "AuthoringMutation") {
    return resource.spec.createdResources.map((created, index) => ({
      path: `${resourcePath}/spec/createdResources/${index}/resource`,
      resource: created.resource
    }));
  }
  if (resource?.kind === "AuthoringWorkspace") {
    return resource.spec.resourceVersions.map((stored, index) => ({
      path: `${resourcePath}/spec/resourceVersions/${index}/resource`,
      resource: stored.resource
    }));
  }
  return [];
}

function localResourceAuthorityResult(
  session,
  resource,
  resourcePath,
  isEmbedded,
  inventoryAuthority
) {
  const issues = [];
  const result = {
    authorityBound: false,
    children: [],
    graphEligible: false,
    graphSafe: true,
    issues
  };
  const sharedBinding = sharedResourceBinding(
    resource?.apiVersion,
    resource?.kind
  );
  if (sharedBinding) {
    result.authorityBound = true;
    const validation = validateSharedResource(
      resource.apiVersion,
      resource.kind,
      resource
    );
    if (validation.structuralErrors.length > 0) {
      issues.push(issue(
        "SESSION_SHARED_RESOURCE_SCHEMA_INVALID",
        resourcePath,
        `Stored shared resource violates ${validation.schemaId}: ${validation.structuralErrors.slice(0, 4).join("; ")}`
      ));
    } else if (validation.semanticIssues.length > 0) {
      validation.semanticIssues.forEach((candidate) => {
        issues.push(issue(
          "SESSION_SHARED_RESOURCE_SEMANTIC_INVALID",
          `${resourcePath}${candidate.path ?? ""}`,
          `Stored shared resource violates ${candidate.code}: ${candidate.message}`
        ));
      });
    } else {
      result.graphEligible = true;
    }
    result.graphSafe = issues.length === 0;
    return result;
  }
  if (resource?.apiVersion === SHARED_API_VERSION) {
    result.authorityBound = true;
    result.graphSafe = false;
    issues.push(issue(
      "SESSION_SHARED_RESOURCE_KIND_UNSUPPORTED",
      `${resourcePath}/kind`,
      "Every persisted resource in the frozen shared namespace must use one locally bound sovereign kind."
    ));
    return result;
  }
  if (resource?.apiVersion === AUTHORING_API_VERSION) {
    result.authorityBound = true;
    const schemaId = LOCAL_AUTHORING_RESOURCE_SCHEMA_IDS[resource.kind];
    if (!schemaId) {
      result.graphSafe = false;
      issues.push(issue(
        "SESSION_AUTHORING_RESOURCE_KIND_UNSUPPORTED",
        `${resourcePath}/kind`,
        "Every persisted Authoring resource must use one registered sovereign resource kind."
      ));
      return result;
    }
    const structure = validateGeneratedById(schemaId, resource);
    if (!structure.valid) {
      result.graphSafe = false;
      issues.push(issue(
        "SESSION_AUTHORING_RESOURCE_SCHEMA_INVALID",
        resourcePath,
        `Stored Authoring resource violates ${schemaId}: ${structure.errors.slice(0, 4).join("; ")}`
      ));
      return result;
    }
    for (const candidate of validateContractSemantics(resource)) {
      issues.push(issue(
        "SESSION_AUTHORING_RESOURCE_SEMANTIC_INVALID",
        `${resourcePath}${candidate.field ?? ""}`,
        `Stored Authoring resource violates ${candidate.code}: ${candidate.reason}`
      ));
    }
    result.children = embeddedResourceChildren(resource, resourcePath);
    result.graphEligible = issues.length === 0;
    result.graphSafe = issues.length === 0;
    return result;
  }
  if (resource?.apiVersion === SURVEY_API_VERSION) {
    result.authorityBound = true;
    const schemaId = SURVEY_RESOURCE_SCHEMA_IDS[resource.kind];
    if (!schemaId) {
      result.graphSafe = false;
      if (isEmbedded && RUNTIME_VARIANT_KINDS.has(resource.kind)) {
        issues.push(issue(
          "SESSION_INLINE_RUNTIME_VARIANT_FORBIDDEN",
          `${resourcePath}/kind`,
          "Runtime variants must be wrapped by the closed SurveyRuntimeArtifact resource."
        ));
      } else if (!RUNTIME_VARIANT_KINDS.has(resource.kind)) {
        issues.push(issue(
          "SESSION_SURVEY_RESOURCE_KIND_UNSUPPORTED",
          `${resourcePath}/kind`,
          "Every persisted Survey resource must use one registered sovereign resource kind."
        ));
      }
      return result;
    }
    const structure = validateGeneratedById(schemaId, resource);
    if (!structure.valid) {
      result.graphSafe = false;
      issues.push(issue(
        "SESSION_SURVEY_RESOURCE_SCHEMA_INVALID",
        resourcePath,
        `Stored Survey resource violates ${schemaId}: ${structure.errors.slice(0, 4).join("; ")}`
      ));
      return result;
    }
    if (isEmbedded) {
      for (const candidate of validateSurveyResourceSemantics(resource)) {
        issues.push(issue(
          "SESSION_SURVEY_RESOURCE_SEMANTIC_INVALID",
          `${resourcePath}${candidate.field ?? ""}`,
          `Stored Survey resource violates ${candidate.code}: ${candidate.reason}`
        ));
      }
      if (resource.kind === RUNTIME_ARTIFACT_KIND) {
        const runtimeKey = referenceKey({
          apiVersion: resource.apiVersion,
          kind: resource.kind,
          name: resource.metadata.name,
          semanticDigest: resourceSemanticDigest(resource)
        });
        if (!inventoryAuthority.declaredRuntimeReferences.has(runtimeKey)) {
          issues.push(issue(
            "SESSION_RUNTIME_ARTIFACT_REFERENCE_REQUIRED",
            resourcePath,
            "An embedded SurveyRuntimeArtifact must also be admitted through the session's typed runtimeArtifactReferences inventory."
          ));
        } else if (!inventoryAuthority.topLevelResources.has(runtimeKey)) {
          issues.push(issue(
            "SESSION_RUNTIME_ARTIFACT_UNRESOLVED",
            resourcePath,
            "An embedded SurveyRuntimeArtifact reference must resolve to one top-level immutable workspace resource version."
          ));
        }
        issues.push(...runtimeArtifactProvenanceIssues(
          session,
          resource,
          resourcePath
        ));
      }
    }
    result.graphEligible = issues.length === 0;
    result.graphSafe = issues.length === 0;
    return result;
  }
  result.graphSafe = false;
  issues.push(issue(
    "SESSION_RESOURCE_TYPE_UNBOUND",
    resourcePath,
    "Every persisted resource requires a sovereign package authority or a trusted profile authority; a session-stored profile declaration is not executable validation authority."
  ));
  return result;
}

function localResourceInventoryIssues(session, versions) {
  const issues = [];
  const queue = versions.map((stored, index) => ({
    isEmbedded: false,
    depth: 0,
    path: `/authoring/workspace/spec/resourceVersions/${index}/resource`,
    resource: stored?.resource
  }));
  const graphEntries = [];
  const graphEntriesByKey = new Map();
  const inventoryAuthority = {
    declaredRuntimeReferences: new Set(
      session.authoring.runtimeArtifactReferences.map(referenceKey)
    ),
    topLevelResources: new Map(
      versions.map((stored) => [
        referenceKey(stored.reference),
        stored.resource
      ])
    )
  };
  let graphSafe = true;
  let nodes = 0;
  let queueIndex = 0;

  while (queueIndex < queue.length) {
    const current = queue[queueIndex];
    queueIndex += 1;
    nodes += 1;
    if (
      nodes > MAX_RESOURCE_AUTHORITY_NODES ||
      current.depth > MAX_RESOURCE_AUTHORITY_DEPTH
    ) {
      graphSafe = false;
      issues.push(issue(
        "SEMANTIC_TRAVERSAL_BOUND_EXCEEDED",
        current.path,
        "Sovereign resource validation exceeded its bounded schema-guided traversal."
      ));
      break;
    }
    const validation = localResourceAuthorityResult(
      session,
      current.resource,
      current.path,
      current.isEmbedded,
      inventoryAuthority
    );
    issues.push(...validation.issues);
    if (!validation.graphSafe) graphSafe = false;

    if (validation.graphEligible) {
      let graphKey;
      try {
        graphKey = referenceKey({
          apiVersion: current.resource?.apiVersion,
          kind: current.resource?.kind,
          name: current.resource?.metadata?.name,
          semanticDigest: resourceSemanticDigest(current.resource)
        });
      } catch {
        graphSafe = false;
        issues.push(issue(
          "SESSION_RESOURCE_IDENTITY_INVALID",
          current.path,
          "A resource admitted to graph validation must have a canonical semantic identity."
        ));
      }
      const existing = graphKey
        ? graphEntriesByKey.get(graphKey)
        : undefined;
      if (
        existing &&
        canonicalize(existing.resource) !== canonicalize(current.resource)
      ) {
        graphSafe = false;
        issues.push(issue(
          "TRANSACTION_RESOURCE_BODY_CONFLICT",
          current.path,
          "One exact four-field identity resolves to conflicting resource bodies."
        ));
      } else if (graphKey && !existing) {
        const entry = {
          path: current.path,
          resource: current.resource
        };
        graphEntriesByKey.set(graphKey, entry);
        graphEntries.push(entry);
      }
    }
    for (const child of validation.children) {
      queue.push({
        isEmbedded: true,
        depth: current.depth + 1,
        path: child.path,
        resource: child.resource
      });
    }
  }

  if (graphSafe) {
    const resources = graphEntries.map((entry) => entry.resource);
    for (const candidate of validateSurveyResourceGraph(resources)) {
      issues.push(issue(
        candidate.code,
        surveyGraphField(candidate.field, graphEntries),
        candidate.reason
      ));
    }
  }
  return issues;
}

function runtimeArtifactProvenanceIssues(session, resource, resourcePath) {
  const issues = [];
  const source = resource?.spec?.source;
  const sourcePath = `${resourcePath}/spec/source`;
  if (source?.surveyRunId !== session.sessionId) {
    issues.push(issue(
      "SESSION_RUNTIME_SOURCE_RUN_MISMATCH",
      `${sourcePath}/surveyRunId`,
      "SurveyRuntimeArtifact must bind the exact containing SurveyRun identity."
    ));
  }

  const transitionEvents = session.events.filter((event) => (
    event?.transitionId === source?.sourcePhaseTransitionId &&
    event?.eventId === source?.sourceEventId
  ));
  if (transitionEvents.length === 0) {
    issues.push(issue(
      "SESSION_RUNTIME_SOURCE_EVENT_UNRESOLVED",
      `${sourcePath}/sourceEventId`,
      "SurveyRuntimeArtifact source transition and event do not resolve to runtime-owned accepted evidence."
    ));
    return issues;
  }

  const exactEvents = transitionEvents.filter((event) => {
    try {
      const expectedDigest = sha256Value(withoutKey(event, "digest"));
      return (
        event.digest === expectedDigest &&
        source.sourceDigest === expectedDigest
      );
    } catch {
      return false;
    }
  });
  if (exactEvents.length !== 1) {
    issues.push(issue(
      exactEvents.length === 0
        ? "SESSION_RUNTIME_SOURCE_DIGEST_MISMATCH"
        : "SESSION_RUNTIME_SOURCE_EVENT_AMBIGUOUS",
      `${sourcePath}/sourceDigest`,
      exactEvents.length === 0
        ? "SurveyRuntimeArtifact source digest must equal the recomputed digest of its exact accepted event bytes."
        : "SurveyRuntimeArtifact source fields must select exactly one accepted event."
    ));
    return issues;
  }

  const event = exactEvents[0];
  const eventIndex = session.events.indexOf(event);
  const expectedPreviousDigest =
    eventIndex === 0 ? null : session.events[eventIndex - 1]?.digest;
  if (
    event.ordinal !== eventIndex ||
    event.previousDigest !== expectedPreviousDigest
  ) {
    issues.push(issue(
      "SESSION_RUNTIME_SOURCE_EVENT_CHAIN_INVALID",
      `${sourcePath}/sourceDigest`,
      "The selected accepted event must occupy its exact ordinal and previous-event digest chain."
    ));
  }

  const journalMatches = session.journal.filter((entry) => (
    entry?.commitId === event.id &&
    entry.machineEdges?.some((edge) => (
      edge.machineId === "phase" &&
      edge.transitionId === source.sourcePhaseTransitionId &&
      edge.eventId === source.sourceEventId
    ))
  ));
  if (journalMatches.length !== 1) {
    issues.push(issue(
      journalMatches.length === 0
        ? "SESSION_RUNTIME_SOURCE_JOURNAL_UNRESOLVED"
        : "SESSION_RUNTIME_SOURCE_JOURNAL_AMBIGUOUS",
      `${sourcePath}/sourcePhaseTransitionId`,
      "The exact accepted source event must own exactly one matching global journal transition."
    ));
    return issues;
  }

  const journal = journalMatches[0];
  if (source.sourceSemanticRevision !== journal.after.semanticRevision) {
    issues.push(issue(
      "SESSION_RUNTIME_SOURCE_REVISION_MISMATCH",
      `${sourcePath}/sourceSemanticRevision`,
      "SurveyRuntimeArtifact source revision must equal the owning journal transition's semantic revision."
    ));
  }
  const expectedPayloadDigest = sha256Value(event.payload);
  if (journal.payloadDigest !== expectedPayloadDigest) {
    issues.push(issue(
      "SESSION_RUNTIME_SOURCE_PAYLOAD_MISMATCH",
      `${sourcePath}/sourceDigest`,
      "The owning journal payload digest must be recomputable from the accepted source event payload."
    ));
  }
  const expectedCommandDigest = sha256Value({
    event: event.eventId,
    actor: event.actor,
    payload: event.payload
  });
  if (journal.commandDigest !== expectedCommandDigest) {
    issues.push(issue(
      "SESSION_RUNTIME_SOURCE_COMMAND_MISMATCH",
      `${sourcePath}/sourceDigest`,
      "The owning journal command digest must be recomputable from the accepted source event."
    ));
  }
  return issues;
}

function workspaceReferenceIssues(session) {
  const workspace = session.authoring.workspace;
  const spec = workspace.spec;
  const versions = spec.resourceVersions;
  const byReference = new Map();
  const indexByReference = new Map();
  const byLogicalReference = new Map();
  const issues = [];

  versions.forEach((stored, index) => {
    const key = referenceKey(stored.reference);
    const logicalKey = logicalReferenceKey(stored.reference);
    if (byReference.has(key)) {
      issues.push(issue(
        "SESSION_RESOURCE_VERSION_DUPLICATE",
        `/authoring/workspace/spec/resourceVersions/${index}/reference`,
        "An exact immutable resource version appears more than once."
      ));
    } else {
      byReference.set(key, stored);
      indexByReference.set(key, index);
    }
    const logicalVersions = byLogicalReference.get(logicalKey) ?? [];
    logicalVersions.push(stored);
    byLogicalReference.set(logicalKey, logicalVersions);
  });
  issues.push(...localResourceInventoryIssues(session, versions));

  const resolve = (reference, path, code = "SESSION_REFERENCE_UNRESOLVED") => {
    if (byReference.has(referenceKey(reference))) return true;
    const digestMismatch = byLogicalReference.has(logicalReferenceKey(reference));
    issues.push(issue(
      digestMismatch ? "SESSION_REFERENCE_DIGEST_MISMATCH" : code,
      path,
      digestMismatch
        ? "The reference does not select the exact stored immutable version."
        : "The reference does not resolve to a stored immutable resource version."
    ));
    return false;
  };

  spec.activeHeads.forEach((head, index) => {
    resolve(
      head.reference,
      `/authoring/workspace/spec/activeHeads/${index}/reference`
    );
  });
  const history = new Set();
  spec.history.forEach((reference, index) => {
    resolve(
      reference,
      `/authoring/workspace/spec/history/${index}`
    );
    const key = referenceKey(reference);
    if (history.has(key)) {
      issues.push(issue(
        "SESSION_HISTORY_REFERENCE_DUPLICATE",
        `/authoring/workspace/spec/history/${index}`,
        "An immutable resource version may be classified in history only once."
      ));
    }
    history.add(key);
  });
  spec.handoffProducts.forEach((handoff, index) => {
    resolve(
      handoff.reference,
      `/authoring/workspace/spec/handoffProducts/${index}/reference`
    );
  });
  spec.dependencyEdges.forEach((edge, index) => {
    resolve(
      edge.from,
      `/authoring/workspace/spec/dependencyEdges/${index}/from`
    );
    resolve(
      edge.to,
      `/authoring/workspace/spec/dependencyEdges/${index}/to`
    );
  });
  if (spec.openAssignment !== null) {
    resolve(
      spec.openAssignment.reference,
      "/authoring/workspace/spec/openAssignment/reference"
    );
  }

  const active = new Set(
    spec.activeHeads.map((head) => referenceKey(head.reference))
  );
  const activeLogicalReferences = new Set(
    spec.activeHeads.map((head) => logicalReferenceKey(head.reference))
  );
  spec.history.forEach((reference, index) => {
    if (active.has(referenceKey(reference))) {
      issues.push(issue(
        "SESSION_HISTORY_ACTIVE_HEAD_OVERLAP",
        `/authoring/workspace/spec/history/${index}`,
        "Immutable history cannot also be selected as a current active head."
      ));
    }
  });
  for (const logicalKey of activeLogicalReferences) {
    for (const stored of byLogicalReference.get(logicalKey) ?? []) {
      const key = referenceKey(stored.reference);
      if (!active.has(key) && !history.has(key)) {
        issues.push(issue(
          "SESSION_SUPERSEDED_RESOURCE_HISTORY_REQUIRED",
          `/authoring/workspace/spec/resourceVersions/${indexByReference.get(key)}/reference`,
          "A retained non-head version of an active logical resource must be classified in immutable history."
        ));
      }
    }
  }

  const declaredRuntimeReferences = new Set();
  const validatedRuntimeResources = new Set();
  session.authoring.runtimeArtifactReferences.forEach((reference, index) => {
    const path = `/authoring/runtimeArtifactReferences/${index}`;
    if (!isRuntimeArtifactReference(reference)) {
      issues.push(issue(
        "SESSION_RUNTIME_ARTIFACT_REFERENCE_TYPE_MISMATCH",
        path,
        "Runtime ingress must be a typed SurveyRuntimeArtifact reference."
      ));
      return;
    }
    const key = referenceKey(reference);
    declaredRuntimeReferences.add(key);
    if (!resolve(reference, path, "SESSION_RUNTIME_ARTIFACT_UNRESOLVED")) return;
    const stored = byReference.get(key);
    if (
      stored.resource?.apiVersion !== SURVEY_API_VERSION ||
      stored.resource?.kind !== RUNTIME_ARTIFACT_KIND ||
      stored.resource?.metadata?.name !== reference.name
    ) {
      issues.push(issue(
        "SESSION_RUNTIME_ARTIFACT_RESOURCE_TYPE_MISMATCH",
        path,
        "The reference must resolve to one stored SurveyRuntimeArtifact resource."
      ));
      return;
    }
    if (validatedRuntimeResources.has(key)) return;
    validatedRuntimeResources.add(key);
    const resourcePath =
      `/authoring/workspace/spec/resourceVersions/${indexByReference.get(key)}/resource`;
    const structure = validateGeneratedById(
      RUNTIME_ARTIFACT_SCHEMA_ID,
      stored.resource
    );
    if (!structure.valid) {
      issues.push(issue(
        "SESSION_RUNTIME_ARTIFACT_SCHEMA_INVALID",
        resourcePath,
        `Stored runtime ingress violates its closed schema: ${structure.errors.slice(0, 4).join("; ")}`
      ));
      return;
    }
    issues.push(...runtimeArtifactProvenanceIssues(
      session,
      stored.resource,
      resourcePath
    ));
  });

  versions.forEach((stored, index) => {
    if (
      stored.resource.apiVersion === SURVEY_API_VERSION &&
      RUNTIME_VARIANT_KINDS.has(stored.resource.kind)
    ) {
      issues.push(issue(
        "SESSION_INLINE_RUNTIME_VARIANT_FORBIDDEN",
        `/authoring/workspace/spec/resourceVersions/${index}/resource/kind`,
        "Runtime variants must be wrapped by the closed SurveyRuntimeArtifact resource."
      ));
    }
    if (
      stored.resource.apiVersion === SURVEY_API_VERSION &&
      stored.resource.kind === RUNTIME_ARTIFACT_KIND &&
      !declaredRuntimeReferences.has(referenceKey(stored.reference))
    ) {
      issues.push(issue(
        "SESSION_RUNTIME_ARTIFACT_REFERENCE_REQUIRED",
        `/authoring/workspace/spec/resourceVersions/${index}/reference`,
        "Every stored SurveyRuntimeArtifact admitted to authoring must have one typed ingress reference."
      ));
    }
  });

  return issues;
}

function journalIssues(session, matrixPairs) {
  const { journal } = session;
  const workspace = session.authoring.workspace;
  const transitionAuthority = canonicalMachineTransitionAuthority();
  const issues = [];
  if (session.commitRevision !== journal.length) {
    issues.push(issue(
      "SESSION_COMMIT_REVISION_MISMATCH",
      "/commitRevision",
      "commitRevision must equal the global journal length."
    ));
  }

  const genesisRevisionState = sessionGenesisRevisionState(session);
  const genesisSealDigest = sessionGenesisSealDigest(session);
  const commitIds = new Set();
  const idempotencyKeys = new Set();
  let previousAfter = null;
  let previousRecordDigest = null;
  const lastEdgeByMachine = new Map();
  const machineHeads = new Map(
    [...canonicalMachineGenesisStates()].map(([machineId, state]) => [
      machineId,
      {
        state,
        digest: sessionMachineStateDigest(session, {
          machineId,
          state,
          journalOrdinal: 0
        })
      }
    ])
  );

  journal.forEach((entry, index) => {
    const entryPath = `/journal/${index}`;
    if (entry.ordinal !== index + 1) {
      issues.push(issue(
        "SESSION_JOURNAL_ORDINAL_MISMATCH",
        `${entryPath}/ordinal`,
        "Journal ordinals must be the contiguous one-based commit sequence."
      ));
    }
    if (commitIds.has(entry.commitId)) {
      issues.push(issue(
        "SESSION_JOURNAL_COMMIT_ID_DUPLICATE",
        `${entryPath}/commitId`,
        "Commit IDs are globally unique within one session journal."
      ));
    }
    commitIds.add(entry.commitId);
    const idempotencyKey =
      `${entry.idempotency.machineId}\u0000${entry.idempotency.key}`;
    if (idempotencyKeys.has(idempotencyKey)) {
      issues.push(issue(
        "SESSION_JOURNAL_IDEMPOTENCY_DUPLICATE",
        `${entryPath}/idempotency`,
        "A machine-qualified idempotency key can identify only one commit."
      ));
    }
    idempotencyKeys.add(idempotencyKey);

    if (index === 0 && !sameRevisionState(entry.before, genesisRevisionState)) {
      issues.push(issue(
        "SESSION_JOURNAL_GENESIS_STATE_MISMATCH",
        `${entryPath}/before`,
        "The first journal record must begin at the canonical session genesis revision state."
      ));
    } else if (
      previousAfter !== null &&
      !sameRevisionState(entry.before, previousAfter)
    ) {
      issues.push(issue(
        "SESSION_JOURNAL_REVISION_DISCONTINUITY",
        `${entryPath}/before`,
        "Each journal before-state must equal the previous commit after-state."
      ));
    }
    const expectedPreviousSealDigest =
      index === 0 ? genesisSealDigest : previousRecordDigest;
    if (entry.previousSealDigest !== expectedPreviousSealDigest) {
      issues.push(issue(
        index === 0
          ? "SESSION_JOURNAL_GENESIS_SEAL_MISMATCH"
          : "SESSION_JOURNAL_SEAL_CHAIN_MISMATCH",
        `${entryPath}/previousSealDigest`,
        index === 0
          ? "The first journal record must bind the canonical session genesis seal."
          : "Each journal record must bind the exact prior journal record digest."
      ));
    }
    previousAfter = entry.after;
    previousRecordDigest = entry.recordDigest;

    try {
      issues.push(...prefixIssues(
        validateContractSemantics(entry),
        entryPath
      ));
    } catch {
      issues.push(issue(
        "SESSION_JOURNAL_RECORD_INVALID",
        entryPath,
        "The journal record is not structurally safe for semantic validation."
      ));
    }

    const counts = new Map();
    const edgeKeys = new Set();
    entry.machineEdges.forEach((edge, edgeIndex) => {
      const edgePath = `${entryPath}/machineEdges/${edgeIndex}`;
      if (!MACHINE_IDS.has(edge.machineId)) {
        issues.push(issue(
          "SESSION_MACHINE_EDGE_UNKNOWN",
          `${edgePath}/machineId`,
          "Session journal edges may target only authoring, phase, or runtime."
        ));
      } else {
        const key = machineTransitionKey(edge.machineId, edge.transitionId);
        edgeKeys.add(key);
        const transition = transitionAuthority.transitions.get(key);
        if (!transition) {
          issues.push(issue(
            "SESSION_MACHINE_EDGE_TRANSITION_UNKNOWN",
            `${edgePath}/transitionId`,
            "The machine edge transition ID is not declared by its canonical machine."
          ));
        } else if (
          !transition.sources.has(edge.fromState) ||
          transition.eventId !== edge.eventId ||
          (
            transition.toState === "same"
              ? edge.toState !== edge.fromState
              : transition.toState !== edge.toState
          )
        ) {
          issues.push(issue(
            "SESSION_MACHINE_EDGE_TUPLE_MISMATCH",
            edgePath,
            "The machine edge must equal its canonical transition ID, from-state, event, and to-state tuple."
          ));
        }
      }
      counts.set(edge.machineId, (counts.get(edge.machineId) ?? 0) + 1);
      const prior = lastEdgeByMachine.get(edge.machineId);
      const head = machineHeads.get(edge.machineId);
      if (head) {
        if (
          head.state !== edge.fromState ||
          head.digest !== edge.beforeStateDigest
        ) {
          issues.push(issue(
            prior
              ? "SESSION_MACHINE_EDGE_DISCONTINUITY"
              : "SESSION_MACHINE_EDGE_GENESIS_MISMATCH",
            edgePath,
            prior
              ? "Filtered machine edges must share the exact prior state occurrence."
              : "The first edge for each machine must begin at its canonical session genesis state occurrence."
          ));
        }
        const expectedAfterStateDigest = sessionMachineStateDigest(session, {
          machineId: edge.machineId,
          state: edge.toState,
          journalOrdinal: entry.ordinal
        });
        if (edge.afterStateDigest !== expectedAfterStateDigest) {
          issues.push(issue(
            "SESSION_MACHINE_EDGE_DIGEST_MISMATCH",
            `${edgePath}/afterStateDigest`,
            "A machine edge after-state digest must bind its exact session, protocol, state, and owning journal ordinal."
          ));
        }
        machineHeads.set(edge.machineId, {
          state: edge.toState,
          digest: edge.afterStateDigest
        });
      }
      lastEdgeByMachine.set(edge.machineId, edge);
    });

    const repeatedMachineEdge = [...counts.values()].some(
      (count) => count > 1
    );
    const atomicSequence = repeatedMachineEdge
      ? transitionAuthority.atomicSequences.get(
        machineEdgeSequenceKey(entry.machineEdges)
      )
      : null;
    const atomicSequenceEdgeKeys =
      atomicSequence?.edgeKeys ?? new Set();
    if (repeatedMachineEdge && !atomicSequence) {
      issues.push(issue(
        "SESSION_MACHINE_EDGE_SEQUENCE_UNDECLARED",
        `${entryPath}/machineEdges`,
        "More than one edge for a machine is legal only when the complete ordered edge list exactly matches one canonical protocol atomic sequence."
      ));
    }

    const coupledEdges = new Set();
    for (const key of edgeKeys) {
      if (atomicSequenceEdgeKeys.has(key)) continue;
      const partners = transitionAuthority.couplings.get(key);
      if (!partners) continue;
      for (const partner of partners) {
        if (edgeKeys.has(partner)) {
          coupledEdges.add(key);
          coupledEdges.add(partner);
        } else {
          issues.push(issue(
            "SESSION_MACHINE_EDGE_COUPLING_REQUIRED",
            `${entryPath}/machineEdges`,
            "An atomic canonical coupling must persist every declared counterpart edge in the same journal record."
          ));
        }
      }
    }

    const representedMachines = new Set(
      entry.machineEdges.map((edge) => edge.machineId)
    );
    if (representedMachines.size > 1) {
      entry.machineEdges.forEach((edge, edgeIndex) => {
        const key = machineTransitionKey(edge.machineId, edge.transitionId);
        if (
          !coupledEdges.has(key) &&
          !atomicSequenceEdgeKeys.has(key)
        ) {
          issues.push(issue(
            "SESSION_MACHINE_EDGE_COUPLING_UNDECLARED",
            `${entryPath}/machineEdges/${edgeIndex}`,
            "Edges from different machines may share a commit only through a declared canonical coupling."
          ));
        }
      });
    }

    for (let edgeIndex = 1; edgeIndex < entry.machineEdges.length; edgeIndex += 1) {
      const before = entry.machineEdges[edgeIndex - 1];
      const after = entry.machineEdges[edgeIndex];
      if (
        MACHINE_ORDER.has(before.machineId) &&
        MACHINE_ORDER.has(after.machineId) &&
        MACHINE_ORDER.get(after.machineId) < MACHINE_ORDER.get(before.machineId)
      ) {
        issues.push(issue(
          "SESSION_MACHINE_EDGE_ORDER_INVALID",
          `${entryPath}/machineEdges/${edgeIndex}`,
          "Coupled machine edges must preserve authoring, phase, then runtime order."
        ));
      }
    }

    const authoringEdges = entry.machineEdges.filter(
      (edge) => edge.machineId === "authoring"
    );
    const phaseEdges = entry.machineEdges.filter(
      (edge) => edge.machineId === "phase"
    );
    if (authoringEdges.length === 1 && phaseEdges.length > 0) {
      const beforeKey = matrixPairKey(
        authoringEdges[0].fromState,
        phaseEdges[0].fromState
      );
      const afterKey = matrixPairKey(
        authoringEdges[0].toState,
        phaseEdges.at(-1).toState
      );
      if (!matrixPairs.has(beforeKey) || !matrixPairs.has(afterKey)) {
        issues.push(issue(
          "SESSION_COUPLED_EDGE_PAIR_ILLEGAL",
          `${entryPath}/machineEdges`,
          "A coupled authoring/phase edge sequence must begin and end on declared legal matrix pairs."
        ));
      }
    }
  });

  if (journal.length === 0) {
    if (
      workspace.spec.semanticRevision !== 0 ||
      workspace.spec.evidenceRevision !== 0 ||
      workspace.spec.integrity.semanticStateDigest !==
        genesisRevisionState.semanticStateDigest
    ) {
      issues.push(issue(
        "SESSION_EMPTY_JOURNAL_REVISION_MISMATCH",
        "/authoring/workspace/spec",
        "An empty global journal can represent only the canonical zero-revision genesis state."
      ));
    }
  } else if (
    previousAfter.semanticRevision !== workspace.spec.semanticRevision ||
    previousAfter.evidenceRevision !== workspace.spec.evidenceRevision ||
    previousAfter.semanticStateDigest !==
      workspace.spec.integrity.semanticStateDigest
  ) {
    issues.push(issue(
      "SESSION_JOURNAL_WORKSPACE_MISMATCH",
      "/journal",
      "The final journal after-state must equal the persisted workspace state."
    ));
  }

  const terminalFields = [
    ["authoring", workspace.spec.authoringState],
    ["phase", session.phase],
    ["runtime", session.runtimeStatus]
  ];
  const terminalAuthoringPhasePairIsLegal = matrixPairs.has(matrixPairKey(
    workspace.spec.authoringState,
    session.phase
  ));
  terminalFields.forEach(([machineId, expectedState]) => {
    const reachedState = machineHeads.get(machineId)?.state;
    if (
      reachedState !== expectedState &&
      (
        machineId === "runtime" ||
        terminalAuthoringPhasePairIsLegal
      )
    ) {
      issues.push(issue(
        "SESSION_MACHINE_EDGE_FINAL_STATE_MISMATCH",
        "/journal",
        `The final ${machineId} edge does not reach the persisted session state.`
      ));
    }
  });

  return issues;
}

/**
 * Validate v2 cross-document session semantics after structural schema
 * validation. The paired-state authority is imported from the canonical
 * package-owned matrix and cannot be supplied by session or caller data.
 */
export function validateSessionSemantics(session) {
  if (
    !record(session) ||
    session.$schema !== SESSION_SCHEMA_V2 ||
    session.schemaVersion !== "2.0.0" ||
    !record(session.authoring) ||
    !Array.isArray(session.authoring.runtimeArtifactReferences) ||
    !Array.isArray(session.events) ||
    !Array.isArray(session.journal)
  ) {
    return Object.freeze([issue(
      "SESSION_V2_SHAPE_REQUIRED",
      "/",
      "Session semantics require a structurally validated session-state:v2 value."
    )]);
  }
  const matrixPairs = canonicalPairedStateIndex();
  const workspaceIssues = workspaceContractIssues(session.authoring.workspace);
  if (workspaceIssues.length > 0) return Object.freeze(workspaceIssues);

  const authoringState = session.authoring.workspace.spec.authoringState;
  const pair = matrixPairs.get(matrixPairKey(authoringState, session.phase));
  const issues = [];
  if (!pair) {
    issues.push(issue(
      "SESSION_PAIRED_STATE_ILLEGAL",
      "/authoring/workspace/spec/authoringState",
      "The persisted authoring and phase states are not a declared legal matrix pair."
    ));
  }
  issues.push(
    ...workspaceReferenceIssues(session),
    ...journalIssues(session, matrixPairs)
  );
  return Object.freeze(issues);
}

export function assertSessionSemantics(session) {
  const issues = validateSessionSemantics(session);
  if (issues.length > 0) {
    const error = new Error(
      issues.map((item) => `${item.code} ${item.field}: ${item.reason}`).join("; ")
    );
    error.name = "SessionSemanticValidationError";
    error.code = issues[0].code;
    error.issues = issues;
    throw error;
  }
  return session;
}

export class SessionContractSelectionError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SessionContractSelectionError";
    this.code = code;
  }
}

function assertFrozenV1Identity(session) {
  if (
    session.schemaVersion !== "1.0.0" ||
    session.package?.id !== SURVEY_PACKAGE_ID ||
    session.package?.version !== "1.0.0" ||
    session.package?.projectionDigest !== FROZEN_V1_PROJECTION_DIGEST ||
    session.protocol?.id !== SURVEY_PROTOCOL_ID ||
    session.protocol?.version !== "1.0.0" ||
    session.protocol?.digest !== FROZEN_V1_PROTOCOL_DIGEST ||
    session.protocol?.digest !== sha256Value(canonicalSurveyProtocolV1) ||
    canonicalize(session.protocol?.snapshot) !==
      canonicalize(canonicalSurveyProtocolV1)
  ) {
    throw new SessionContractSelectionError(
      "FROZEN_V1_IDENTITY_REQUIRED",
      "Historical v1 sessions must retain their exact frozen package and protocol identity."
    );
  }
}

function assertActiveV1Identity(session) {
  if (
    session.$schema !== ACTIVE_SESSION_SCHEMA_V1 ||
    session.schemaVersion !== "1.0.0" ||
    session.package?.id !== SURVEY_PACKAGE_ID ||
    session.package?.version !== "2.0.0" ||
    session.package?.projectionDigest !== candidateProjectionLock.aggregateDigest ||
    session.protocol?.id !== SURVEY_PROTOCOL_ID ||
    session.protocol?.version !== "1.0.0" ||
    session.protocol?.digest !== FROZEN_V1_PROTOCOL_DIGEST ||
    session.protocol?.digest !== sha256Value(canonicalSurveyProtocolV1) ||
    canonicalize(session.protocol?.snapshot) !==
      canonicalize(canonicalSurveyProtocolV1)
  ) {
    throw new SessionContractSelectionError(
      "ACTIVE_V1_IDENTITY_REQUIRED",
      "Active protocol-v1 sessions must retain the current package projection and exact canonical v1 protocol snapshot."
    );
  }
}

function assertCandidateV2Identity(session) {
  const expectedProtocolDigest = sha256Value(canonicalSurveyProtocol);
  const expectedAuthoringProtocol = canonicalSurveyProtocol.machines.find(
    (machine) => machine.id === "authoring"
  )?.reference;
  const workspaceProtocol = session.authoring?.workspace?.spec?.protocol;
  if (
    session.schemaVersion !== "2.0.0" ||
    session.package?.id !== SURVEY_PACKAGE_ID ||
    session.package?.version !== "2.0.0" ||
    session.package?.projectionDigest !== candidateProjectionLock.aggregateDigest ||
    session.protocol?.id !== SURVEY_PROTOCOL_ID ||
    session.protocol?.version !== "2.0.0" ||
    session.protocol?.digest !== expectedProtocolDigest ||
    canonicalize(session.protocol?.snapshot) !==
      canonicalize(canonicalSurveyProtocol) ||
    workspaceProtocol?.protocolDigest !==
      expectedAuthoringProtocol?.semanticDigest ||
    canonicalize(workspaceProtocol?.reference) !==
      canonicalize(expectedAuthoringProtocol)
  ) {
    throw new SessionContractSelectionError(
      "CANDIDATE_V2_IDENTITY_REQUIRED",
      "Candidate sessions must retain the current package projection, canonical Survey protocol snapshot, and exact workspace AuthoringProtocol binding."
    );
  }
}

/**
 * Select a versioned session contract without migration or reinterpretation.
 * Persisted protocol-v1 sessions route by their exact package root: historical
 * v1 remains resume-only, active-package v1 remains the implicit default, and
 * protocol v2 always needs the explicit candidate selector.
 */
export function selectSessionContract(session, selector = undefined) {
  if (!record(session)) {
    throw new TypeError("session must be an object");
  }
  if (
    session.$schema === SESSION_SCHEMA_V1 ||
    session.$schema === ACTIVE_SESSION_SCHEMA_V1
  ) {
    if (selector !== undefined) {
      throw new SessionContractSelectionError(
        "CANDIDATE_SELECTOR_REFUSES_V1",
        "The candidate selector cannot reinterpret a frozen v1 session."
      );
    }
    let selected;
    if (session.$schema === SESSION_SCHEMA_V1) {
      assertFrozenV1Identity(session);
      selected = HISTORICAL_V1_SELECTOR;
    } else {
      assertActiveV1Identity(session);
      selected = ACTIVE_V1_SELECTOR;
    }
    return Object.freeze({
      selector: selected,
      schemaId: session.$schema,
      package: Object.freeze(structuredClone(session.package)),
      protocol: Object.freeze(structuredClone(session.protocol))
    });
  }
  if (session.$schema === SESSION_SCHEMA_V2) {
    if (selector !== CANDIDATE_V2_SELECTOR) {
      throw new SessionContractSelectionError(
        "EXPLICIT_CANDIDATE_SELECTOR_REQUIRED",
        "A v2 session is accessible only through explicit candidate selection."
      );
    }
    assertCandidateV2Identity(session);
    return Object.freeze({
      selector: CANDIDATE_V2_SELECTOR,
      schemaId: SESSION_SCHEMA_V2,
      package: Object.freeze(structuredClone(session.package)),
      protocol: Object.freeze(structuredClone(session.protocol))
    });
  }
  throw new SessionContractSelectionError(
    "SESSION_SCHEMA_UNSUPPORTED",
    "The session does not identify a supported versioned contract."
  );
}

export function pairedStatePathClasses(session) {
  const pairs = canonicalPairedStateIndex();
  const pair = pairs.get(matrixPairKey(
    session?.authoring?.workspace?.spec?.authoringState,
    session?.phase
  ));
  return pair ? Object.freeze([...pair.pathClasses]) : Object.freeze([]);
}
