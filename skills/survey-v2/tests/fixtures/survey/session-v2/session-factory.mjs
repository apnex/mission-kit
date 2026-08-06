import { readFile } from "node:fs/promises";
import {
  contextClosureDigest,
  journalRecordDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
  workspaceIntegrityDigest,
  workspaceSemanticStateDigest
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  sha256Value
} from "../../../../source/executables/runtime/lib/canonical.mjs";
import {
  normalizeAuthoringCommand
} from "../../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  journalIdentityScopeDigest
} from "../../../../source/authoring/runtime/journal-replay.mjs";
import {
  sessionGenesisRevisionState,
  sessionGenesisSealDigest,
  sessionMachineStateDigest
} from "../../../../source/authoring/survey/session-semantics.mjs";
import {
  createSurveySessionAdapterScope
} from "../../../../source/authoring/survey/session-bootstrap-boundary.mjs";

const digest = (character) => `sha256:${character.repeat(64)}`;

async function readJson(relativeUrl) {
  return JSON.parse(await readFile(new URL(relativeUrl, import.meta.url), "utf8"));
}

export const candidateProtocol = Object.freeze(
  await readJson("../../../../source/protocol/survey-v2.protocol.json")
);
export const candidateProjectionLock = Object.freeze(
  await readJson("../../../../generated/projection-lock.json")
);
export const pairedStateMatrix = Object.freeze(
  await readJson("../../../../source/protocol/paired-state-matrix.v2.json")
);
const runtimeArtifactTemplate = Object.freeze(
  await readJson("../contracts/positive/runtime-revision-directive.json")
);
const contextClosureTemplate = Object.freeze(
  await readJson("../../authoring/contracts/positive/context-closure.json")
);

export function contextClosureResource(
  sourceResource,
  { name = "session-context-closure" } = {}
) {
  const closure = structuredClone(contextClosureTemplate);
  closure.metadata.name = name;
  const layer = closure.spec.layers[0];
  layer.sourceSnapshot = structuredClone(sourceResource);
  layer.sourceReference = resourceReferenceFrom(sourceResource);
  layer.sourceIntegrityDigest = resourceIntegrityDigest(sourceResource);
  closure.spec.closureDigest = contextClosureDigest(closure);
  return closure;
}

export function storedResourceVersion(resource) {
  const stored = {
    reference: resourceReferenceFrom(resource),
    integrityDigest: resourceIntegrityDigest(resource),
    resource: structuredClone(resource)
  };
  return stored;
}

export function sealWorkspace(workspace) {
  workspace.spec.integrity.semanticStateDigest =
    workspaceSemanticStateDigest(workspace);
  workspace.spec.integrity.workspaceIntegrityDigest =
    workspaceIntegrityDigest(workspace);
  return workspace;
}

export function makeWorkspace({
  authoringState = "new",
  semanticRevision = 0,
  evidenceRevision = 0,
  resourceVersions = [],
  activeHeads = [],
  history = [],
  dependencyEdges = [],
  handoffProducts = [],
  openAssignment = null
} = {}) {
  const authoringProtocolReference =
    candidateProtocol.machines.find(
      (machine) => machine.id === "authoring"
    )?.reference ?? pairedStateMatrix.authoringProtocol ?? {
      apiVersion: "authoring.mission-kit/v1alpha1",
      kind: "AuthoringProtocol",
      name: "survey-v2-authoring",
      semanticDigest: digest("a")
    };
  const workspace = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringWorkspace",
    metadata: {
      name: "survey-session-workspace"
    },
    spec: {
      profile: {
        reference: {
          apiVersion: "authoring.mission-kit/v1alpha1",
          kind: "AuthoringProfileManifest",
          name: "survey-v2-profile",
          semanticDigest: digest("b")
        },
        profileDigest: digest("b")
      },
      protocol: {
        reference: structuredClone(authoringProtocolReference),
        protocolDigest: authoringProtocolReference.semanticDigest
      },
      authoringState,
      semanticRevision,
      evidenceRevision,
      resourceVersions: structuredClone(resourceVersions),
      activeHeads: structuredClone(activeHeads),
      dependencyEdges: structuredClone(dependencyEdges),
      handoffProducts: structuredClone(handoffProducts),
      history: structuredClone(history),
      openAssignment: structuredClone(openAssignment),
      integrity: {
        semanticStateDigest: digest("0"),
        workspaceIntegrityDigest: digest("0")
      }
    }
  };
  return sealWorkspace(workspace);
}

function legacyDraftNeutralState() {
  return {
    round1Instruments: [],
    round1Interpretations: [],
    round2Instruments: [],
    round2Interpretations: [],
    composites: [],
    current: {}
  };
}

export function makeSession({
  authoringState = "new",
  phaseState = "new",
  runtimeStatus = ["intent_captured", "aborted"].includes(phaseState)
    ? "closed"
    : "rehydrating",
  resourceVersions = [],
  activeHeads = [],
  history = [],
  dependencyEdges = [],
  handoffProducts = [],
  openAssignment = null,
  runtimeArtifactReferences = []
} = {}) {
  const workspace = makeWorkspace({
    authoringState,
    resourceVersions,
    activeHeads,
    history,
    dependencyEdges,
    handoffProducts,
    openAssignment
  });
  const session = {
    $schema: "urn:mission-kit:survey-v2:schema:session-state:v2",
    schemaVersion: "2.0.0",
    sessionId: "session-v2-fixture",
    slug: "session-v2-fixture",
    package: {
      id: "urn:mission-kit:survey-v2:package:survey-v2",
      version: "2.0.0",
      projectionDigest: candidateProjectionLock.aggregateDigest
    },
    protocol: {
      id: "urn:mission-kit:survey-v2:protocol:survey",
      version: "2.0.0",
      digest: sha256Value(candidateProtocol),
      snapshot: structuredClone(candidateProtocol)
    },
    revision: 0,
    commitRevision: 0,
    phase: phaseState,
    runtimeStatus,
    blockReason: null,
    lineage: {
      parentSessionId: null,
      restartReason: null,
      parentEvidence: []
    },
    inputs: {
      sourceSnapshotRef: {
        apiVersion: "authoring.mission-kit/v1alpha1",
        kind: "SourceSnapshot",
        name: "fixture-intake",
        semanticDigest: digest("1")
      },
      policySnapshotRef: {
        apiVersion: "survey.mission-kit/v1alpha1",
        kind: "SurveyPolicySnapshot",
        name: "fixture-policy",
        semanticDigest: digest("2")
      },
      requestedArtifactPath: "session-v2-fixture.md",
      axiomCorpus: false,
      pendingInputDigest: digest("d")
    },
    authority: {
      directorRef: "director-fixture",
      proposerRef: "proposer-fixture",
      bindingEvidence: "test-host"
    },
    events: [],
    rejections: [],
    idempotency: {},
    outbox: null,
    pendingProjection: null,
    attempts: [],
    responses: {},
    drafts: legacyDraftNeutralState(),
    interpretations: {},
    dependencies: {
      plan: [
        "urn:mission-kit:survey-v2:reference:mission-kit-axioms"
      ],
      resolverAttempts: [],
      resolverReceipts: [],
      rehydrationOutputs: [
        {
          hook: "rehydrate",
          phase: phaseState,
          pendingInputDigest: digest("d"),
          initializationResultDigest: null,
          frozenSnapshotDigest: null,
          previousEventDigest: null,
          complete: true,
          producedBy: "deterministic-runtime",
          resultDigest: digest("8")
        }
      ],
      outputs: {}
    },
    candidates: [],
    feedback: [],
    ratification: null,
    finalization: null,
    authoring: {
      workspace,
      runtimeArtifactReferences: structuredClone(runtimeArtifactReferences),
      persistence: null
    },
    journal: [],
    snapshotDigest: digest("e")
  };
  const adapterScope = createSurveySessionAdapterScope(
    session,
    "protocol-start"
  );
  const genesisRevisionState = sessionGenesisRevisionState(session);
  const genesisMachineHeads = [
    ["authoring", "new"],
    ["phase", "new"],
    ["runtime", "rehydrating"]
  ].map(([machineId, state]) => ({
    machineId,
    state,
    stateDigest: sessionMachineStateDigest(session, {
      machineId,
      state,
      journalOrdinal: 0
    })
  }));
  const identityScope = {
    genesisRevisionState,
    genesisWorkspaceIntegrityDigest:
      workspace.spec.integrity.workspaceIntegrityDigest,
    genesisMachineHeads,
    adapterScope
  };
  session.authoring.persistence = {
    machineHeads: structuredClone(genesisMachineHeads),
    idempotencyOutcomeView: [],
    identityBinding: {
      id: "survey-session-journal-identity",
      digest: sha256Value({
        domain: "survey-v2/session-fixture-journal-identity/v4"
      }),
      scopeDigest: journalIdentityScopeDigest(identityScope)
    },
    identityScope
  };
  return session;
}

export function makeJournalRecord({
  commitId,
  ordinal,
  commitKind = "evidence",
  before,
  after,
  machineEdges = [],
  idempotencyMachine = "authoring",
  idempotencyKey = `journal-${ordinal}`,
  commandDigest = digest("1"),
  payloadDigest = digest("2"),
  previousSealDigest = digest("3"),
  beforeWorkspaceIntegrityDigest = digest("5"),
  afterWorkspaceIntegrityDigest = digest("6"),
  workspaceEffect = {
    retainedResources: [],
    historyReferences: [],
    openAssignment: {
      before: null,
      after: null
    },
    activeHeads: {
      before: [],
      after: []
    },
    dependencyEdges: {
      before: [],
      after: []
    },
    handoffProducts: {
      before: [],
      after: []
    },
    handoffSlots: []
  }
}) {
  const normalizedOperation = normalizeAuthoringCommand({
    class: "event",
    eventId: machineEdges[0]?.eventId ?? "FIXTURE_EVIDENCE",
    base: {
      authoringState:
        machineEdges.find((edge) => edge.machineId === "authoring")
          ?.fromState ?? "new",
      semanticRevision: before.semanticRevision,
      semanticStateDigest: before.semanticStateDigest,
      activeHeads: structuredClone(workspaceEffect.activeHeads.before)
    },
    commandDigest,
    payloadDigest,
    evidenceDigest: sha256Value({
      domain: "survey-v2/session-journal-fixture-evidence/v1",
      commitId,
      ordinal,
      commitKind,
      idempotency: {
        machineId: idempotencyMachine,
        key: idempotencyKey
      },
      before,
      after,
      machineEdges
    }),
    inputs: {},
    externalCouplings: []
  });
  const value = {
    recordDigest: digest("0"),
    authenticationDigest: digest("a"),
    commitId,
    ordinal,
    commitKind,
    actor: {
      class: "automation",
      id: "session-test-author"
    },
    authority: {
      class: "kernel",
      id: "session-test-authority",
      policy: {
        id: "session-test-policy",
        digest: digest("f")
      }
    },
    idempotency: {
      machineId: idempotencyMachine,
      key: idempotencyKey
    },
    operationDigest: sha256Value({
      domain: "mission-kit:authoring:normalized-operation-envelope/v1",
      command: normalizedOperation
    }),
    commandDigest,
    payloadDigest,
    previousSealDigest,
    before: structuredClone(before),
    after: structuredClone(after),
    beforeWorkspaceIntegrityDigest,
    afterWorkspaceIntegrityDigest,
    workspaceEffect: structuredClone(workspaceEffect),
    mutationDigest: digest("4"),
    machineEdges: structuredClone(machineEdges)
  };
  value.recordDigest = journalRecordDigest(value);
  return value;
}

export function attachJournal(session, entries) {
  const genesisWorkspaceIntegrityDigest =
    session.authoring.persistence.identityScope
      .genesisWorkspaceIntegrityDigest;
  const finalState = entries.at(-1)?.after ?? {
    semanticRevision: 0,
    evidenceRevision: 0,
    semanticStateDigest: session.authoring.workspace.spec.integrity
      .semanticStateDigest
  };
  const workspace = session.authoring.workspace;
  workspace.spec.semanticRevision = finalState.semanticRevision;
  workspace.spec.evidenceRevision = finalState.evidenceRevision;
  sealWorkspace(workspace);

  const journal = [];
  entries.forEach((entry, index) => {
    const next = structuredClone(entry);
    if (index === 0) {
      next.before = structuredClone(sessionGenesisRevisionState(session));
    }
    if (next.before.semanticStateDigest === "$workspace") {
      next.before.semanticStateDigest =
        workspace.spec.integrity.semanticStateDigest;
    }
    if (next.after.semanticStateDigest === "$workspace") {
      next.after.semanticStateDigest =
        workspace.spec.integrity.semanticStateDigest;
    }
    next.ordinal ??= index + 1;
    next.previousSealDigest = index === 0
      ? sessionGenesisSealDigest(session)
      : journal[index - 1].recordDigest;
    next.beforeWorkspaceIntegrityDigest = index === 0
      ? genesisWorkspaceIntegrityDigest
      : journal[index - 1].afterWorkspaceIntegrityDigest;
    if (index === entries.length - 1) {
      next.afterWorkspaceIntegrityDigest =
        workspace.spec.integrity.workspaceIntegrityDigest;
    }
    next.recordDigest = journalRecordDigest(next);
    journal.push(next);
  });
  session.journal = journal;
  session.commitRevision = journal.length;
  const machineHeads = new Map(
    session.authoring.persistence.identityScope.genesisMachineHeads
      .map((head) => [head.machineId, structuredClone(head)])
  );
  journal.forEach((record) => {
    record.machineEdges.forEach((edge) => {
      machineHeads.set(edge.machineId, {
        machineId: edge.machineId,
        state: edge.toState,
        stateDigest: edge.afterStateDigest
      });
    });
  });
  session.authoring.persistence.machineHeads =
    [...machineHeads.values()];
  session.authoring.persistence.idempotencyOutcomeView =
    journal.map((record) => ({
      machineId: record.idempotency.machineId,
      key: record.idempotency.key,
      recordDigest: record.recordDigest,
      operationDigest: record.operationDigest,
      commandDigest: record.commandDigest,
      payloadDigest: record.payloadDigest,
      outcome: {
        class: "fixture"
      }
    }));
  return session;
}

export function makeAcceptedEvent({
  id,
  eventId,
  transitionId,
  actor = {
    role: "substrate",
    ref: "session-v2-runtime",
    assertionSource: "test-host"
  },
  payload = {},
  ordinal = 0,
  previousDigest = null
}) {
  const event = {
    ordinal,
    id,
    eventId,
    transitionId,
    actor: structuredClone(actor),
    payload: structuredClone(payload),
    previousDigest
  };
  event.digest = sha256Value(event);
  return event;
}

const authoringMachine = candidateProtocol.machines.find(
  (machine) => machine.id === "authoring"
);
const phaseMachine = candidateProtocol.machines.find(
  (machine) => machine.id === "phase"
);
const runtimeMachine = candidateProtocol.machines.find(
  (machine) => machine.id === "runtime"
);
const authoringTransitions = authoringMachine.protocol.spec.transitions;
const phaseTransitions = [
  ...phaseMachine.transitions,
  ...phaseMachine.families
];
const runtimeTransitions = [
  ...runtimeMachine.transitions,
  ...runtimeMachine.families
];
const phaseById = new Map(
  phaseTransitions.map((transition) => [transition.id, transition])
);
const runtimeById = new Map(
  runtimeTransitions.map((transition) => [transition.id, transition])
);
const authoringById = new Map(
  authoringTransitions.map((transition) => [transition.id, transition])
);
const authoringCouplingById = new Map(
  candidateProtocol.authoringCouplings.map((coupling) => [
    coupling.authoringTransitionId,
    coupling
  ])
);
const coupledPhaseIds = new Set(
  candidateProtocol.authoringCouplings.map(
    (coupling) => coupling.phaseTransitionId
  )
);
const coupledRuntimeIds = new Set(
  phaseTransitions.flatMap((transition) => [
    transition.coupledTransition,
    transition.coupledFamily
  ]).filter(Boolean)
);
const legalPairKeys = new Set(
  pairedStateMatrix.pairs.map(
    (pair) => `${pair.authoringState}\u0000${pair.phaseState}`
  )
);

function machineSelectors(machine) {
  return new Map(
    (machine.selectors ?? []).map(
      (selector) => [selector.id, new Set(selector.members)]
    )
  );
}

const phaseSelectors = machineSelectors(phaseMachine);
const runtimeSelectors = machineSelectors(runtimeMachine);

function transitionApplicable(transition, state, selectors = new Map()) {
  if (transition.source?.mode === "single") {
    return transition.source.stateId === state;
  }
  if (transition.source?.mode === "set") {
    return transition.source.stateIds.includes(state);
  }
  if (transition.fromSelector) {
    return selectors.get(transition.fromSelector)?.has(state) === true;
  }
  return transition.from === state;
}

function transitionTarget(transition, state) {
  const target = transition.toState ?? transition.to;
  return target === "same" ? state : target;
}

function transitionEvent(transition) {
  return transition.eventId ?? transition.event;
}

function phaseRuntimeTransition(phaseTransition, runtimeState) {
  const runtimeId =
    phaseTransition.coupledTransition ?? phaseTransition.coupledFamily;
  if (!runtimeId) return null;
  const transition = runtimeById.get(runtimeId);
  return transitionApplicable(transition, runtimeState, runtimeSelectors)
    ? transition
    : undefined;
}

function legalPair(authoringState, phaseState) {
  return legalPairKeys.has(`${authoringState}\u0000${phaseState}`);
}

function transitionAction(machineId, transition, fromState, selectors) {
  return {
    machineId,
    transitionId: transition.id,
    eventId: transitionEvent(transition),
    fromState,
    toState: transitionTarget(transition, fromState),
    selectors
  };
}

function actionsFrom(state) {
  const actions = [];

  for (const coupling of candidateProtocol.authoringCouplings) {
    const authoring = authoringById.get(coupling.authoringTransitionId);
    const phase = phaseById.get(coupling.phaseTransitionId);
    if (
      !transitionApplicable(authoring, state.authoring) ||
      !transitionApplicable(phase, state.phase, phaseSelectors)
    ) {
      continue;
    }
    const nextAuthoring = transitionTarget(authoring, state.authoring);
    const nextPhase = transitionTarget(phase, state.phase);
    if (!legalPair(nextAuthoring, nextPhase)) continue;
    const runtime = phaseRuntimeTransition(phase, state.runtime);
    if (runtime === undefined) continue;
    const edges = [
      transitionAction("authoring", authoring, state.authoring),
      transitionAction("phase", phase, state.phase, phaseSelectors)
    ];
    let nextRuntime = state.runtime;
    if (runtime) {
      edges.push(
        transitionAction("runtime", runtime, state.runtime, runtimeSelectors)
      );
      nextRuntime = transitionTarget(runtime, state.runtime);
    }
    actions.push({
      edges,
      next: {
        authoring: nextAuthoring,
        phase: nextPhase,
        runtime: nextRuntime
      }
    });
  }

  for (const transition of authoringTransitions) {
    if (
      authoringCouplingById.has(transition.id) ||
      !transitionApplicable(transition, state.authoring)
    ) {
      continue;
    }
    const nextAuthoring = transitionTarget(transition, state.authoring);
    if (!legalPair(nextAuthoring, state.phase)) continue;
    actions.push({
      edges: [
        transitionAction("authoring", transition, state.authoring)
      ],
      next: {
        ...state,
        authoring: nextAuthoring
      }
    });
  }

  for (const transition of phaseTransitions) {
    if (
      coupledPhaseIds.has(transition.id) ||
      !transitionApplicable(transition, state.phase, phaseSelectors)
    ) {
      continue;
    }
    const nextPhase = transitionTarget(transition, state.phase);
    if (!legalPair(state.authoring, nextPhase)) continue;
    const runtime = phaseRuntimeTransition(transition, state.runtime);
    if (runtime === undefined) continue;
    const edges = [
      transitionAction("phase", transition, state.phase, phaseSelectors)
    ];
    let nextRuntime = state.runtime;
    if (runtime) {
      edges.push(
        transitionAction("runtime", runtime, state.runtime, runtimeSelectors)
      );
      nextRuntime = transitionTarget(runtime, state.runtime);
    }
    actions.push({
      edges,
      next: {
        authoring: state.authoring,
        phase: nextPhase,
        runtime: nextRuntime
      }
    });
  }

  for (const transition of runtimeTransitions) {
    if (
      coupledRuntimeIds.has(transition.id) ||
      !transitionApplicable(transition, state.runtime, runtimeSelectors)
    ) {
      continue;
    }
    actions.push({
      edges: [
        transitionAction("runtime", transition, state.runtime, runtimeSelectors)
      ],
      next: {
        ...state,
        runtime: transitionTarget(transition, state.runtime)
      }
    });
  }
  return actions;
}

function stateKey(state) {
  return `${state.authoring}\u0000${state.phase}\u0000${state.runtime}`;
}

function pathToPair(pair) {
  const initial = {
    authoring: authoringMachine.protocol.spec.initialState,
    phase: phaseMachine.initial,
    runtime: runtimeMachine.initial
  };
  const queue = [{ state: initial, path: [] }];
  const seen = new Set([stateKey(initial)]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (
      current.state.authoring === pair.authoringState &&
      current.state.phase === pair.phaseState
    ) {
      return current;
    }
    for (const action of actionsFrom(current.state)) {
      const key = stateKey(action.next);
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push({
        state: action.next,
        path: [...current.path, action]
      });
    }
  }
  throw new Error(
    `canonical protocol cannot reach pair ${pair.authoringState}/${pair.phaseState}`
  );
}

export function matrixSession(pair) {
  const route = pathToPair(pair);
  const session = materializePhaseContract(makeSession({
    authoringState: pair.authoringState,
    phaseState: pair.phaseState,
    runtimeStatus: route.state.runtime
  }));
  if (route.path.length === 0) return session;

  const machineDigests = new Map(
    [
      ["authoring", authoringMachine.protocol.spec.initialState],
      ["phase", phaseMachine.initial],
      ["runtime", runtimeMachine.initial]
    ].map(([machineId, state]) => [
      machineId,
      sessionMachineStateDigest(session, {
        machineId,
        state,
        journalOrdinal: 0
      })
    ])
  );
  let revisionState = sessionGenesisRevisionState(session);
  const records = route.path.map((action, index) => {
    const ordinal = index + 1;
    const machineEdges = action.edges.map((edge) => {
      const beforeStateDigest = machineDigests.get(edge.machineId);
      const afterStateDigest = sessionMachineStateDigest(session, {
        machineId: edge.machineId,
        state: edge.toState,
        journalOrdinal: ordinal
      });
      machineDigests.set(edge.machineId, afterStateDigest);
      return {
        machineId: edge.machineId,
        transitionId: edge.transitionId,
        fromState: edge.fromState,
        eventId: edge.eventId,
        toState: edge.toState,
        beforeStateDigest,
        afterStateDigest
      };
    });
    const after = {
      semanticRevision: ordinal,
      evidenceRevision: ordinal,
      semanticStateDigest: index === route.path.length - 1
        ? "$workspace"
        : sha256Value({
          domain: "survey-v2/matrix-journal-state/v1",
          ordinal,
          state: action.next
        })
    };
    const record = makeJournalRecord({
      commitId: `matrix-${String(ordinal).padStart(2, "0")}-${machineEdges
        .map((edge) => edge.transitionId)
        .join("-")}`.toLowerCase(),
      ordinal,
      commitKind: "transition",
      before: revisionState,
      after,
      machineEdges,
      idempotencyMachine: machineEdges[0].machineId,
      idempotencyKey: `matrix-transition-${ordinal}`
    });
    revisionState = after;
    return record;
  });
  return attachJournal(session, records);
}

export function runtimeArtifactResource({
  name = "runtime-evidence",
  variant = "RevisionDirective"
} = {}) {
  if (variant !== runtimeArtifactTemplate.spec.artifactType) {
    throw new TypeError(
      `session fixture supports only the schema-valid ${runtimeArtifactTemplate.spec.artifactType} runtime artifact`
    );
  }
  const resource = structuredClone(runtimeArtifactTemplate);
  resource.metadata.name = name;
  return resource;
}

function legacyResponse(questionOrdinal) {
  return {
    questionId: `Q${questionOrdinal}`,
    raw: "a",
    normalizedPicks: ["a"],
    contradictions: [],
    rationale: null,
    eventId: `response-Q${questionOrdinal}`,
    acknowledgedViewDigest: digest("6")
  };
}

function legacyQuestion(questionOrdinal) {
  const round = questionOrdinal <= 3 ? 1 : 2;
  return {
    id: `Q${questionOrdinal}`,
    round,
    intentDimension: `dimension-Q${questionOrdinal}`,
    prompt: `Choose the intent posture for Q${questionOrdinal}.`,
    options: [
      { id: "a", label: "Alpha", meaning: "alpha constraint" },
      { id: "b", label: "Beta", meaning: "beta constraint" },
      { id: "c", label: "Gamma", meaning: "gamma constraint" }
    ],
    optionRelationship: "composable",
    incompatibilities: [],
    designRationale: `Question Q${questionOrdinal} covers one intent dimension.`,
    axisPreAnchors: {
      primary: ["quality"],
      secondary: []
    },
    ...(round === 2 ? { round1Relation: "refines" } : {}),
    sourceEvidenceRefs: ["fixture"]
  };
}

function legacyCandidateModel() {
  return {
    $schema: "urn:mission-kit:survey-v2:schema:envelope-model:v1",
    schemaVersion: "1.0.0",
    title: "Fixture intent",
    workItem: "Capture exact fixture intent.",
    methodology: {
      name: "Survey v2",
      schemaVersion: "1.0.0",
      protocolDigest: digest("7"),
      projectionDigest: digest("8")
    },
    authority: {
      directorRef: "director-fixture",
      proposerRef: "proposer-fixture",
      bindingEvidence: "test-host",
      ratificationAuthority: "director-only"
    },
    outcomeAxes: ["quality"],
    instrument: Array.from({ length: 6 }, (_, index) =>
      legacyQuestion(index + 1)
    ),
    responses: Array.from({ length: 6 }, (_, index) =>
      legacyResponse(index + 1)
    ),
    interpretations: {
      round1: {},
      round1Digest: digest("9"),
      round2: {},
      round2Digest: digest("a"),
      axisMapping: {},
      anchors: []
    },
    contradictions: [],
    tensions: [],
    compositeIntent: "Preserve the exact fixture intent.",
    scope: [],
    antiGoals: [],
    openDesignQuestions: [],
    dependencies: [],
    calibration: {
      stakeholderTimeCostMinutes: 0,
      comparisonBaseline: "fixture",
      notes: "Schema-only paired-state fixture."
    },
    ratification: {
      authority: "director-only",
      status: "pending",
      eventId: null,
      semanticDigest: null,
      renderDigest: null
    },
    lifecycleHandoff: {
      from: "intent-open",
      to: "intent-captured",
      authorityRef: "director-fixture",
      planningInputRef: "self"
    }
  };
}

function legacyCandidate() {
  return {
    revision: 1,
    model: legacyCandidateModel(),
    semanticDigest: digest("b"),
    renderDigest: digest("c"),
    renderedBytes: "fixture candidate",
    superseded: false
  };
}

const PHASE_RESPONSE_COUNTS = new Map([
  ["round_1_q2_ready", 1],
  ["round_1_q2_awaiting", 1],
  ["round_1_q3_ready", 2],
  ["round_1_q3_awaiting", 2],
  ["round_1_responses_complete", 3],
  ["round_1_interpreting", 3],
  ["round_1_interpreted", 3],
  ["round_2_drafting", 3],
  ["round_2_q4_ready", 3],
  ["round_2_q4_awaiting", 3],
  ["round_2_q5_ready", 4],
  ["round_2_q5_awaiting", 4],
  ["round_2_q6_ready", 5],
  ["round_2_q6_awaiting", 5]
]);

const COMPLETE_RESPONSE_PHASES = new Set([
  "round_2_responses_complete",
  "round_2_interpreting",
  "round_2_interpreted",
  "composite_drafting",
  "composite_candidate",
  "walkthrough_ready",
  "walkthrough_in_progress",
  "awaiting_ratification",
  "revision_requested",
  "ratified",
  "finalizing",
  "intent_captured"
]);

const ROUND_ONE_INTERPRETATION_PHASES = new Set([
  "round_1_responses_complete",
  "round_1_interpreting",
  "round_1_interpreted",
  "round_2_drafting",
  "round_2_q4_ready",
  "round_2_q4_awaiting",
  "round_2_q5_ready",
  "round_2_q5_awaiting",
  "round_2_q6_ready",
  "round_2_q6_awaiting",
  ...COMPLETE_RESPONSE_PHASES
]);

const ROUND_ONE_COMPLETE_PHASES = new Set([
  "round_1_interpreted",
  "round_2_drafting",
  "round_2_q4_ready",
  "round_2_q4_awaiting",
  "round_2_q5_ready",
  "round_2_q5_awaiting",
  "round_2_q6_ready",
  "round_2_q6_awaiting",
  ...COMPLETE_RESPONSE_PHASES
]);

const ROUND_TWO_INTERPRETATION_PHASES = new Set([
  "round_2_responses_complete",
  "round_2_interpreting",
  "round_2_interpreted",
  "composite_drafting",
  "composite_candidate",
  "walkthrough_ready",
  "walkthrough_in_progress",
  "awaiting_ratification",
  "revision_requested",
  "ratified",
  "finalizing",
  "intent_captured"
]);

const ROUND_TWO_COMPLETE_PHASES = new Set([
  "round_2_interpreted",
  "composite_drafting",
  "composite_candidate",
  "walkthrough_ready",
  "walkthrough_in_progress",
  "awaiting_ratification",
  "revision_requested",
  "ratified",
  "finalizing",
  "intent_captured"
]);

const CANDIDATE_PHASES = new Set([
  "composite_candidate",
  "walkthrough_ready",
  "walkthrough_in_progress",
  "awaiting_ratification",
  "revision_requested",
  "ratified",
  "finalizing",
  "intent_captured"
]);

function materializePhaseContract(session) {
  const phase = session.phase;
  if (!["new", "initializing", "aborted"].includes(phase)) {
    session.dependencies.outputs.initResolve = {
      applicability: "not-applicable",
      dependencyId: "urn:mission-kit:survey-v2:reference:mission-kit-axioms",
      evaluatedFactsDigest: digest("1"),
      hook: "init-resolve",
      pendingInputDigest: digest("2"),
      producedBy: "deterministic-runtime",
      receiptId: "session-v2-fixture:init-resolve:1",
      remainingStages: [],
      resolverAttemptId: null,
      resultDigest: digest("3")
    };
  }

  const responseCount = COMPLETE_RESPONSE_PHASES.has(phase)
    ? 6
    : (PHASE_RESPONSE_COUNTS.get(phase) ?? 0);
  session.responses = Object.fromEntries(
    Array.from({ length: responseCount }, (_, index) => [
      `Q${index + 1}`,
      legacyResponse(index + 1)
    ])
  );

  if (ROUND_ONE_INTERPRETATION_PHASES.has(phase)) {
    session.interpretations.round1Instrument = null;
    session.interpretations.round1ResponseDigest = digest("4");
  }
  if (ROUND_ONE_COMPLETE_PHASES.has(phase)) {
    session.interpretations.round1 = {};
    session.interpretations.round1Digest = digest("5");
  }
  if (ROUND_TWO_INTERPRETATION_PHASES.has(phase)) {
    session.interpretations.round2Instrument = null;
    session.interpretations.round2ResponseDigest = digest("6");
  }
  if (ROUND_TWO_COMPLETE_PHASES.has(phase)) {
    session.interpretations.round2 = {};
    session.interpretations.round2Digest = digest("7");
  }
  if ([
    "walkthrough_ready",
    "walkthrough_in_progress",
    "awaiting_ratification"
  ].includes(phase)) {
    session.interpretations.candidateValidation = {};
    session.interpretations.walkthrough = {
      candidateRevision: 1,
      segments: [{ id: "fixture", content: "Fixture walkthrough." }],
      index: 0,
      acknowledgements: []
    };
  }
  if (CANDIDATE_PHASES.has(phase)) {
    session.candidates = [legacyCandidate()];
  }
  if (phase === "revision_requested") {
    session.feedback = [{ kind: "correction" }];
  }
  if (["ratified", "finalizing", "intent_captured"].includes(phase)) {
    session.ratification = {
      candidateRevision: 1,
      semanticDigest: digest("b"),
      renderDigest: digest("c"),
      eventId: "ratify-fixture",
      directorRef: "director-fixture"
    };
  }
  if (["finalizing", "intent_captured"].includes(phase)) {
    session.finalization = {
      candidateRevision: 1,
      bytes: "fixture candidate",
      digest: digest("d"),
      targetPath: "fixture.md",
      validation: phase === "intent_captured" ? "passed" : "pending",
      ...(phase === "intent_captured"
        ? {
            handoff: {
              path: "fixture.md",
              digest: digest("d"),
              terminalEventId: "finalize-fixture"
            }
          }
        : {})
    };
  }
  return session;
}
