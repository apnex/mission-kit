import { sha256Value } from "../../../../source/authoring/kernel/canonical.mjs";
import {
  assignmentDigest as deriveAssignmentDigest,
  contextClosureDigest,
  mutationDigest,
  normalizedSubmissionDigest,
  projectionArtifactDigest,
  requestCoreDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
  workspaceIntegrityDigest,
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  applyEvidenceWorkspace,
  applyTransitionWorkspace,
  deriveWorkspaceCommitBoundary,
  resealWorkspace,
  retainWorkspaceEvidence,
  storedResourceVersionFromResource,
  workspaceRevisionState,
} from "../../../../source/authoring/runtime/workspace-application.mjs";
import {
  assembleJournalRecord,
  createAuthoringCommitReceipt,
  createEvidenceCommitPlan,
  createIdempotencyOutcomeEntry,
  deriveOperationIdentity,
  deriveSupersededDescendants,
  deriveTransitionMachineEdges,
  receiptOutcome,
} from "../../../../source/authoring/runtime/commit-records.mjs";
import {
  createNeutralJournalIdentityConfiguration,
  replayAuthoringJournal,
} from "../../../../source/authoring/runtime/journal-replay.mjs";

export const digest = (character) =>
  `sha256:${character.repeat(64)}`;

export const journalAuthenticationKey = Uint8Array.from(
  { length: 32 },
  (_, index) => index + 1,
);

export function resource(
  kind,
  name,
  spec = { value: name },
  apiVersion = "fixture.example/v1alpha1",
) {
  return {
    apiVersion,
    kind,
    metadata: { name },
    spec,
  };
}

export function stored(resourceValue) {
  return structuredClone(storedResourceVersionFromResource(resourceValue));
}

export function slot(slotName, resourceValue) {
  return {
    slot: slotName,
    reference: resourceReferenceFrom(resourceValue),
  };
}

export function assignmentResource(
  name = "assignment-one",
  assignmentDigest,
) {
  const assignment = resource(
    "AuthoringAssignment",
    name,
    { assignmentDigest: assignmentDigest ?? digest("0") },
    "authoring.mission-kit/v1alpha1",
  );
  if (assignmentDigest === undefined) {
    assignment.spec.assignmentDigest =
      deriveAssignmentDigest(assignment);
  }
  return assignment;
}

export function assignmentBinding(assignment) {
  return {
    reference: resourceReferenceFrom(assignment),
    assignmentDigest: assignment.spec.assignmentDigest,
  };
}

function makeAssignmentDag(workspace) {
  const contextClosure = resource(
    "ContextClosure",
    "context-one",
    {
      closureDigest: digest("0"),
      layers: [],
    },
    "authoring.mission-kit/v1alpha1",
  );
  contextClosure.spec.closureDigest =
    contextClosureDigest(contextClosure);
  const executableBinding = (id, fill) => ({
    id,
    digest: digest(fill),
  });
  const request = resource(
    "AuthoringRequest",
    "request-one",
    {
      requestDigest: digest("0"),
      operation: {
        class: "task-submission",
        task: {
          id: "fixture-task",
          stateId: workspace.spec.authoringState,
          transitionId: "AT01",
          eventId: "SUBMIT",
        },
        target: {
          slot: "brief",
          resourceType: {
            apiVersion: "fixture.example/v1alpha1",
            kind: "Brief",
          },
          cardinality: { min: 1, max: 1 },
        },
        inputs: {},
      },
      base: {
        authoringState: workspace.spec.authoringState,
        semanticRevision: workspace.spec.semanticRevision,
        semanticStateDigest:
          workspace.spec.integrity.semanticStateDigest,
      },
      contextClosure: {
        reference: resourceReferenceFrom(contextClosure),
        closureDigest: contextClosure.spec.closureDigest,
      },
      submissionContract: {
        schema: executableBinding("fixture-schema", "a"),
        validatorSet: executableBinding(
          "fixture-validator-set",
          "b",
        ),
        form: executableBinding("fixture-form", "c"),
      },
      bindings: {
        kernel: executableBinding("fixture-kernel", "d"),
        profile: executableBinding("fixture-profile", "2"),
        protocol: executableBinding("fixture-protocol", "4"),
        handler: executableBinding("fixture-handler", "6"),
        parser: executableBinding("fixture-parser", "e"),
        form: executableBinding("fixture-form", "c"),
        schema: executableBinding("fixture-schema", "a"),
        validatorSet: executableBinding(
          "fixture-validator-set",
          "b",
        ),
        projection: executableBinding(
          "fixture-projection",
          "f",
        ),
      },
    },
    "authoring.mission-kit/v1alpha1",
  );
  request.spec.requestDigest = requestCoreDigest(request);
  const projectionArtifact = resource(
    "ProjectionArtifact",
    "projection-one",
    {
      projectionArtifactDigest: digest("0"),
      projectionId: "fixture-projection",
      projectionDefinitionDigest: digest("f"),
      sources: [
        {
          role: "request",
          reference: resourceReferenceFrom(request),
          integrityDigest: resourceIntegrityDigest(request),
        },
        {
          role: "context",
          reference: resourceReferenceFrom(contextClosure),
          integrityDigest: resourceIntegrityDigest(contextClosure),
        },
      ],
      form: {
        reference: {
          apiVersion: "authoring.mission-kit/v1alpha1",
          kind: "AuthoringFormDefinition",
          name: "fixture-form",
          semanticDigest: digest("c"),
        },
        formDigest: digest("c"),
      },
      engine: executableBinding("fixture-projection-engine", "f"),
      output: {
        content: {
          mediaType: "text/plain;charset=utf-8",
          encoding: "base64",
          byteLength: 0,
          data: "",
        },
        outputDigest: digest("f"),
      },
    },
    "authoring.mission-kit/v1alpha1",
  );
  projectionArtifact.spec.projectionArtifactDigest =
    projectionArtifactDigest(projectionArtifact);
  const assignment = resource(
    "AuthoringAssignment",
    "assignment-one",
    {
      assignmentDigest: digest("0"),
      request: {
        reference: resourceReferenceFrom(request),
        requestDigest: request.spec.requestDigest,
      },
      projectionArtifact: {
        reference: resourceReferenceFrom(projectionArtifact),
        projectionArtifactDigest:
          projectionArtifact.spec.projectionArtifactDigest,
      },
      handle: "00000000",
      baseSemanticRevision: workspace.spec.semanticRevision,
      baseSemanticStateDigest:
        workspace.spec.integrity.semanticStateDigest,
      uneditedSkeleton: {
        content: {
          mediaType: "text/plain;charset=utf-8",
          encoding: "base64",
          byteLength: 0,
          data: "",
        },
        blankViewDigest: digest("f"),
      },
    },
    "authoring.mission-kit/v1alpha1",
  );
  assignment.spec.assignmentDigest =
    deriveAssignmentDigest(assignment);
  return {
    contextClosure,
    request,
    projectionArtifact,
    assignment,
  };
}

export function makeWorkspace({
  authoringState = "draft_task",
  semanticRevision = 0,
  evidenceRevision = 0,
  resources = [],
  activeHeads = [],
  dependencyEdges = [],
  handoffProducts = [],
  history = [],
  openAssignment = null,
} = {}) {
  return structuredClone(resealWorkspace({
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringWorkspace",
    metadata: { name: "fixture-workspace" },
    spec: {
      profile: {
        reference: {
          apiVersion: "authoring.mission-kit/v1alpha1",
          kind: "AuthoringProfileManifest",
          name: "fixture-profile",
          semanticDigest: digest("1"),
        },
        profileDigest: digest("2"),
      },
      protocol: {
        reference: {
          apiVersion: "authoring.mission-kit/v1alpha1",
          kind: "AuthoringProtocol",
          name: "fixture-protocol",
          semanticDigest: digest("3"),
        },
        protocolDigest: digest("4"),
      },
      authoringState,
      semanticRevision,
      evidenceRevision,
      resourceVersions: resources.map(stored),
      activeHeads,
      dependencyEdges,
      handoffProducts,
      history,
      openAssignment,
      integrity: {
        semanticStateDigest: digest("0"),
        workspaceIntegrityDigest: digest("0"),
      },
    },
  }));
}

export function makeMutation({
  workspace,
  createdResources = [],
  activeHeadChanges = [],
  supersededResources = [],
  dependencyEdges = { created: [], superseded: [] },
  handoffProducts = [],
  nextAuthoringState = "complete",
  externalCouplings = [],
  cause,
} = {}) {
  const mutation = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringMutation",
    metadata: { name: "fixture-mutation" },
    spec: {
      mutationDigest: digest("0"),
      expected: {
        authoringState: workspace.spec.authoringState,
        semanticRevision: workspace.spec.semanticRevision,
        semanticStateDigest:
          workspace.spec.integrity.semanticStateDigest,
      },
      cause: cause ?? {
        class: "event",
        edge: {
          transitionId: "AT01",
          fromState: workspace.spec.authoringState,
          eventId: "ADVANCE",
          toState: nextAuthoringState,
        },
        authority: {
          class: "fixture",
          id: "fixture-authority",
          policy: { id: "fixture-policy", digest: digest("5") },
        },
        execution: {
          profile: { id: "fixture-profile", digest: digest("2") },
          protocol: { id: "fixture-protocol", digest: digest("4") },
          handler: { id: "fixture-handler", digest: digest("6") },
        },
        commandDigest: digest("7"),
        payloadDigest: digest("8"),
        evidenceDigest: digest("9"),
        inputs: [],
      },
      createdResources: createdResources.map((item) => ({
        slot: item.slot,
        ...stored(item.resource),
      })),
      activeHeadChanges,
      supersededResources,
      dependencyEdges,
      handoffProducts,
      nextAuthoringState,
      externalCouplings,
    },
  };
  mutation.spec.mutationDigest = mutationDigest(mutation);
  return mutation;
}

export function errorCode(operation) {
  try {
    operation();
  } catch (error) {
    return error.code;
  }
  return "NO_ERROR";
}

function machineOccurrenceDigest(adapterScope, occurrence) {
  return sha256Value({
    domain: "mission-kit:authoring:neutral-machine-state/v1",
    adapterScope,
    occurrence,
  });
}

export function makeIdentity({
  genesisRevisionState,
  genesisWorkspaceIntegrityDigest,
  authoringState = "draft_task",
  externalState = "ready",
} = {}) {
  const adapterScope = {
    fixture: "k13",
    storeId: "fixture-store",
  };
  const head = (machineId, state) => ({
    machineId,
    state,
    stateDigest: machineOccurrenceDigest(adapterScope, {
      machineId,
      state,
      journalOrdinal: 0,
    }),
  });
  return createNeutralJournalIdentityConfiguration({
    genesisRevisionState,
    genesisWorkspaceIntegrityDigest,
    genesisMachineHeads: [
      head("authoring-kernel", authoringState),
      head("runtime-kernel", externalState),
    ],
    adapterScope,
  }, journalAuthenticationKey);
}

export function machineDigest(identity, machineId, state, ordinal) {
  return identity.identity.machineStateDigest({
    machineId,
    state,
    journalOrdinal: ordinal,
  });
}

export function makeEvidenceJournalScenario() {
  const genesisWorkspace = makeWorkspace();
  const genesisRevisionState = workspaceRevisionState(genesisWorkspace);
  const identity = makeIdentity({
    genesisRevisionState,
    genesisWorkspaceIntegrityDigest:
      workspaceIntegrityDigest(genesisWorkspace),
  });
  const assignmentDag = makeAssignmentDag(genesisWorkspace);
  const { assignment } = assignmentDag;
  const assignmentStored = stored(assignment);
  const issuedResources = [
    assignmentDag.contextClosure,
    assignmentDag.request,
    assignmentDag.projectionArtifact,
    assignment,
  ];
  const issuedStored = issuedResources.map(stored);
  const operation = deriveOperationIdentity({
    operationClass: "assignment-issuance",
    machineId: "authoring-kernel",
    requestDigest: digest("b"),
    assignmentDigest: assignment.spec.assignmentDigest,
    priorEvidenceRevision: 0,
  });
  const workspace = applyEvidenceWorkspace({
    workspace: genesisWorkspace,
    retainedResourceVersions: issuedStored,
    historyReferences: issuedResources.map(resourceReferenceFrom),
    openAssignmentAfter: assignmentBinding(assignment),
  });
  const outcome = {
    class: "assignment-issued",
    assignment: assignmentBinding(assignment),
  };
  const plan = createEvidenceCommitPlan({
    priorJournalHeadDigest: identity.identity.genesisChainDigest(),
    idempotency: operation.idempotency,
    commandDigest: operation.commandDigest,
    payloadDigest: operation.payloadDigest,
    before: genesisRevisionState,
    after: workspaceRevisionState(workspace),
    retainedResourceVersions: issuedStored,
    openAssignment: {
      before: null,
      after: assignmentBinding(assignment),
    },
    outcome,
  });
  const workspaceBoundary = deriveWorkspaceCommitBoundary({
    beforeWorkspace: genesisWorkspace,
    afterWorkspace: workspace,
  });
  const record = assembleJournalRecord({
    journal: [],
    genesisChainDigest: identity.identity.genesisChainDigest(),
    genesisRevisionState,
    genesisWorkspaceIntegrityDigest:
      workspaceIntegrityDigest(genesisWorkspace),
    commitId: "commit-evidence-1",
    commitKind: "evidence",
    actor: { class: "fixture", id: "fixture-actor" },
    authority: {
      class: "fixture",
      id: "fixture-authority",
      policy: { id: "fixture-policy", digest: digest("5") },
    },
    idempotency: operation.idempotency,
    commandDigest: operation.commandDigest,
    payloadDigest: operation.payloadDigest,
    before: genesisRevisionState,
    after: workspaceRevisionState(workspace),
    ...workspaceBoundary,
    mutationDigest: plan.mutationDigest,
    machineEdges: [],
    evidencePlan: plan,
  }, identity.identity);
  const outcomeEntry = createIdempotencyOutcomeEntry({
    record,
    outcome,
    evidencePlan: plan,
  });
  return {
    genesisWorkspace,
    genesisRevisionState,
    identity,
    ...assignmentDag,
    assignment,
    assignmentStored,
    workspace,
    plan,
    record,
    journal: [record],
    outcome,
    outcomes: [outcomeEntry],
    machineHeads: identity.identity.genesisMachineHeads,
  };
}

export function appendTransitionScenario({
  repeatedExternalEdges = false,
  supersedeAssignment = false,
} = {}) {
  const evidence = makeEvidenceJournalScenario();
  const product = resource("Brief", "brief-one");
  const submission = resource(
    "AuthoringSubmission",
    "submission-one",
    {
      normalizedSubmissionDigest: digest("0"),
      assignment: assignmentBinding(evidence.assignment),
      normalizedValues: {},
    },
    "authoring.mission-kit/v1alpha1",
  );
  submission.evidence = {
    rawEvidence: {
      content: {
        mediaType: "text/plain;charset=utf-8",
        encoding: "base64",
        byteLength: 0,
        data: "",
      },
      rawEvidenceDigest: digest("c"),
    },
    producerProvenance: {
      producerId: "fixture-actor",
      producerClass: "fixture",
      evidenceDigest: digest("9"),
    },
  };
  submission.spec.normalizedSubmissionDigest =
    normalizedSubmissionDigest(submission);
  const externalCouplings = repeatedExternalEdges
    ? [
      {
        machineId: "runtime-kernel",
        transitionId: "RT01",
        fromState: "ready",
        eventId: "REFREEZE",
        toState: "pending",
        beforeStateDigest:
          evidence.machineHeads[1].stateDigest,
        afterStateDigest: machineDigest(
          evidence.identity,
          "runtime-kernel",
          "pending",
          2,
        ),
      },
      {
        machineId: "runtime-kernel",
        transitionId: "RT02",
        fromState: "pending",
        eventId: "COMPLETE",
        toState: "ready",
        beforeStateDigest: machineDigest(
          evidence.identity,
          "runtime-kernel",
          "pending",
          2,
        ),
        afterStateDigest: machineDigest(
          evidence.identity,
          "runtime-kernel",
          "ready",
          2,
        ),
      },
    ]
    : [];
  const mutation = makeMutation({
    workspace: evidence.workspace,
    createdResources: [{ slot: "brief", resource: product }],
    activeHeadChanges: [{
      slot: "brief",
      before: null,
      after: resourceReferenceFrom(product),
    }],
    handoffProducts: [slot("brief", product)],
    supersededResources: supersedeAssignment
      ? [resourceReferenceFrom(evidence.assignment)]
      : [],
    externalCouplings,
    cause: {
      class: "task-submission",
      edge: {
        transitionId: "AT01",
        fromState: "draft_task",
        eventId: "SUBMIT",
        toState: "complete",
      },
      authority: {
        class: "fixture",
        id: "fixture-authority",
        policy: { id: "fixture-policy", digest: digest("5") },
      },
      execution: {
        profile: { id: "fixture-profile", digest: digest("2") },
        protocol: { id: "fixture-protocol", digest: digest("4") },
        handler: { id: "fixture-handler", digest: digest("6") },
      },
      assignment: assignmentBinding(evidence.assignment),
      submission: {
        reference: resourceReferenceFrom(submission),
        normalizedSubmissionDigest:
          submission.spec.normalizedSubmissionDigest,
      },
    },
  });
  const semanticWorkspace = applyTransitionWorkspace({
    workspace: evidence.workspace,
    mutation,
    handoffSlots: ["brief"],
    retainedResourceVersions: [
      stored(submission),
      stored(mutation),
    ],
    historyReferences: [
      resourceReferenceFrom(submission),
      resourceReferenceFrom(mutation),
    ],
  });
  const operation = deriveOperationIdentity({
    operationClass: "submission-attempt",
    machineId: "authoring-kernel",
    assignmentDigest: evidence.assignment.spec.assignmentDigest,
    normalizedSubmissionDigest:
      submission.spec.normalizedSubmissionDigest,
  });
  const receipt = createAuthoringCommitReceipt({
    mutation,
    beforeWorkspace: evidence.workspace,
    afterWorkspace: semanticWorkspace,
    idempotencyKey: operation.idempotency.key,
    supersededDescendants:
      deriveSupersededDescendants(mutation),
  });
  const workspace = retainWorkspaceEvidence({
    workspace: semanticWorkspace,
    retainedResourceVersions: [stored(receipt)],
    historyReferences: [resourceReferenceFrom(receipt)],
  });
  const edgeBundle = deriveTransitionMachineEdges({
    mutation,
    machineHeads: evidence.machineHeads,
    authoringMachineId: "authoring-kernel",
    journalOrdinal: 2,
    identity: evidence.identity.identity,
  });
  const record = assembleJournalRecord({
    journal: evidence.journal,
    genesisChainDigest: evidence.identity.identity.genesisChainDigest(),
    genesisRevisionState: evidence.genesisRevisionState,
    genesisWorkspaceIntegrityDigest:
      workspaceIntegrityDigest(evidence.genesisWorkspace),
    commitId: "commit-transition-2",
    commitKind: "transition",
    actor: { class: "fixture", id: "fixture-actor" },
    authority: {
      class: "fixture",
      id: "fixture-authority",
      policy: { id: "fixture-policy", digest: digest("5") },
    },
    idempotency: operation.idempotency,
    commandDigest: operation.commandDigest,
    payloadDigest: operation.payloadDigest,
    before: workspaceRevisionState(evidence.workspace),
    after: workspaceRevisionState(workspace),
    ...deriveWorkspaceCommitBoundary({
      beforeWorkspace: evidence.workspace,
      afterWorkspace: workspace,
      handoffSlots: ["brief"],
    }),
    mutationDigest: mutation.spec.mutationDigest,
    machineEdges: edgeBundle.machineEdges,
  }, evidence.identity.identity);
  const outcome = receiptOutcome(receipt);
  const outcomeEntry = createIdempotencyOutcomeEntry({ record, outcome });
  const journal = [...evidence.journal, record];
  const outcomes = [...evidence.outcomes, outcomeEntry];
  const replay = () => replayAuthoringJournal({
    commitRevision: journal.length,
    workspace,
    journal,
    machineHeads: edgeBundle.machineHeads,
    idempotencyOutcomeView: outcomes,
    authoringMachineId: "authoring-kernel",
    identity: evidence.identity.identity,
  });
  return {
    ...evidence,
    product,
    submission,
    mutation,
    semanticWorkspace,
    receipt,
    workspace,
    edgeBundle,
    transitionRecord: record,
    journal,
    outcomes,
    replay,
  };
}
