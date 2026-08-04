import { readFile } from "node:fs/promises";
import {
  journalRecordDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
  workspaceIntegrityDigest,
  workspaceSemanticStateDigest
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  sha256Value
} from "../../../../source/executables/runtime/lib/canonical.mjs";

const digest = (character) => `sha256:${character.repeat(64)}`;

async function readJson(relativeUrl) {
  return JSON.parse(await readFile(new URL(relativeUrl, import.meta.url), "utf8"));
}

export const candidateProtocol = Object.freeze(
  await readJson("../../../../source/protocol/survey-v2.protocol.json")
);
export const pairedStateMatrix = Object.freeze(
  await readJson("../../../../source/protocol/paired-state-matrix.v2.json")
);

export function storedResourceVersion(resource) {
  return {
    reference: resourceReferenceFrom(resource),
    integrityDigest: resourceIntegrityDigest(resource),
    resource: structuredClone(resource)
  };
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
    pairedStateMatrix.authoringProtocol ?? {
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
  return {
    $schema: "urn:mission-kit:survey-v2:schema:session-state:v2",
    schemaVersion: "2.0.0",
    sessionId: "session-v2-fixture",
    slug: "session-v2-fixture",
    package: {
      id: "urn:mission-kit:survey-v2:package:survey-v2",
      version: "1.0.0",
      projectionDigest: digest("c")
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
      workItem: "Capture exact fixture intent.",
      outcomeAxes: [
        "quality",
        "speed"
      ],
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
      runtimeArtifactReferences: structuredClone(runtimeArtifactReferences)
    },
    journal: [],
    snapshotDigest: digest("e")
  };
}

export function makeJournalRecord({
  commitId,
  ordinal,
  commitKind = "evidence",
  before,
  after,
  machineEdges = [],
  idempotencyMachine = "authoring",
  idempotencyKey = `journal-${ordinal}`
}) {
  const value = {
    recordDigest: digest("0"),
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
    commandDigest: digest("1"),
    payloadDigest: digest("2"),
    previousSealDigest: digest("3"),
    before: structuredClone(before),
    after: structuredClone(after),
    mutationDigest: digest("4"),
    machineEdges: structuredClone(machineEdges)
  };
  value.recordDigest = journalRecordDigest(value);
  return value;
}

export function attachJournal(session, entries) {
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

  const journal = entries.map((entry, index) => {
    const next = structuredClone(entry);
    if (next.before.semanticStateDigest === "$workspace") {
      next.before.semanticStateDigest =
        workspace.spec.integrity.semanticStateDigest;
    }
    if (next.after.semanticStateDigest === "$workspace") {
      next.after.semanticStateDigest =
        workspace.spec.integrity.semanticStateDigest;
    }
    next.ordinal ??= index + 1;
    next.recordDigest = journalRecordDigest(next);
    return next;
  });
  session.journal = journal;
  session.commitRevision = journal.length;
  return session;
}

export function matrixSession(pair) {
  return makeSession({
    authoringState: pair.authoringState,
    phaseState: pair.phaseState
  });
}

export function runtimeArtifactResource({
  name = "runtime-evidence",
  variant = "RoundResponseSet"
} = {}) {
  return {
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyRuntimeArtifact",
    metadata: {
      name
    },
    spec: {
      variant,
      sourceRun: "session-v2-fixture",
      sourceEvent: "event-fixture",
      sourceTransition: "T00",
      sourcePhase: "new",
      sourceSemanticRevision: 0,
      sourceDigest: digest("9"),
      payload: {
        fixture: true
      }
    }
  };
}
