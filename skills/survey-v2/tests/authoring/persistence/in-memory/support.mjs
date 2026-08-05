import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  journalRecordDigest,
  projectJournalRecordAuthenticationCore,
  resourceIntegrityDigest,
  resourceReferenceFrom,
  workspaceIntegrityDigest,
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  createInMemoryAuthoringStore,
  inMemoryGenesisChainDigest,
  createInMemoryJournalIdentityConfiguration,
  createInMemoryStoreBacking,
  inMemoryRecordAuthenticationDigest,
} from "../../../../source/authoring/adapters/in-memory-store.mjs";
import {
  compileJournalIdentityPort,
} from "../../../../source/authoring/runtime/journal-replay.mjs";
import {
  createEvidenceCommitPlan,
} from "../../../../source/authoring/runtime/commit-records.mjs";
import {
  snapshotExpectedToken,
} from "../../../../source/authoring/runtime/store-port.mjs";
import {
  deriveWorkspaceCommitBoundary,
} from "../../../../source/authoring/runtime/workspace-application.mjs";

const workspaceFixture = new URL(
  "../../../fixtures/authoring/contracts/positive/authoring-workspace.json",
  import.meta.url,
);

export function digest(fill) {
  return `sha256:${fill.repeat(64)}`;
}

export const journalAuthenticationKey = Uint8Array.from(
  { length: 32 },
  (_, index) => 255 - index,
);

export async function loadWorkspace() {
  return JSON.parse(await readFile(workspaceFixture, "utf8"));
}

function revisionState(workspace) {
  return {
    semanticRevision: workspace.spec.semanticRevision,
    evidenceRevision: workspace.spec.evidenceRevision,
    semanticStateDigest:
      workspace.spec.integrity.semanticStateDigest,
  };
}

export async function createStoreHarness({
  storeId = "brief-store",
  faultInjector,
  backing = createInMemoryStoreBacking(),
  initialize = true,
  authenticationKey = journalAuthenticationKey,
} = {}) {
  const workspace = await loadWorkspace();
  const rawIdentity = createInMemoryJournalIdentityConfiguration({
    genesisRevisionState: revisionState(workspace),
    genesisWorkspaceIntegrityDigest:
      workspace.spec.integrity.workspaceIntegrityDigest,
    genesisMachines: [
      {
        machineId: "authoring-kernel",
        state: workspace.spec.authoringState,
      },
    ],
    adapterScope: {
      adapter: "in-memory",
      storeId,
    },
  }, authenticationKey);
  const identity = compileJournalIdentityPort(rawIdentity);
  const initialSnapshot = {
    storeId,
    commitRevision: 0,
    workspace: structuredClone(workspace),
    journal: [],
    machineHeads: structuredClone(
      rawIdentity.identityScope.genesisMachineHeads,
    ),
    idempotencyOutcomeView: [],
    identityBinding: structuredClone(
      rawIdentity.identityBinding,
    ),
    identityScope: structuredClone(rawIdentity.identityScope),
  };
  const store = createInMemoryAuthoringStore({
    backing,
    initialSnapshots: initialize ? [initialSnapshot] : [],
    identityAuthority: identity,
    authoringMachineId: "authoring-kernel",
    faultInjector,
  });
  return {
    authenticationKey,
    backing,
    identity,
    initialSnapshot,
    store,
    storeId,
  };
}

export function evidencePostImage(
  snapshot,
  {
    commitId = `commit-${String(
      snapshot.commitRevision + 1,
    ).padStart(4, "0")}`,
    key = `event:${digest("1").slice("sha256:".length)}`,
    outcome,
    authenticationKey = journalAuthenticationKey,
  } = {},
) {
  const workspace = structuredClone(snapshot.workspace);
  workspace.spec.evidenceRevision += 1;
  const issueResource = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "ValidationIssue",
    metadata: {
      name: `event-rejected-${String(
        snapshot.commitRevision + 1,
      ).padStart(4, "0")}`,
    },
    spec: {
      code: "EVENT_REJECTED",
      field: "",
      reason: "The fixture event was rejected.",
      boundary: "fixture-validator",
      nextAction: "retry",
      correction: "Retry with an admitted fixture event.",
    },
  };
  const issueReference = resourceReferenceFrom(issueResource);
  workspace.spec.resourceVersions.push({
    reference: structuredClone(issueReference),
    integrityDigest: resourceIntegrityDigest(issueResource),
    resource: issueResource,
  });
  workspace.spec.history.push(structuredClone(issueReference));
  workspace.spec.integrity.workspaceIntegrityDigest =
    workspaceIntegrityDigest(workspace);
  const workspaceBoundary = deriveWorkspaceCommitBoundary({
    beforeWorkspace: snapshot.workspace,
    afterWorkspace: workspace,
  });
  const commandDigest = digest("1");
  const payloadDigest = digest("2");
  const operationDigest = digest("3");
  const selectedOutcome = structuredClone(outcome ?? {
    class: "event-rejected",
    eventId: "EVENT_REJECTED",
    issues: [structuredClone(issueReference)],
  });
  const previousSealDigest =
    snapshot.journal.length === 0
      ? inMemoryGenesisChainDigest(
        snapshot.identityScope.adapterScope,
        snapshot.identityScope.genesisRevisionState,
      )
      : snapshot.journal[snapshot.journal.length - 1]
        .recordDigest;
  const evidencePlan = createEvidenceCommitPlan({
    priorJournalHeadDigest: previousSealDigest,
    idempotency: {
      machineId: "authoring-kernel",
      key,
    },
    operationDigest,
    commandDigest,
    payloadDigest,
    before: revisionState(snapshot.workspace),
    after: revisionState(workspace),
    retainedResourceVersions: [
      workspace.spec.resourceVersions.at(-1),
    ],
    openAssignment: {
      before: snapshot.workspace.spec.openAssignment,
      after: workspace.spec.openAssignment,
    },
    outcome: selectedOutcome,
  });
  const record = {
    recordDigest: digest("0"),
    authenticationDigest: digest("0"),
    commitId,
    ordinal: snapshot.commitRevision + 1,
    commitKind: "evidence",
    actor: {
      class: "automation",
      id: "fixture-writer",
    },
    authority: {
      class: "kernel",
      id: "fixture-authority",
      policy: {
        id: "fixture-policy",
        digest: digest("e"),
      },
    },
    idempotency: {
      machineId: "authoring-kernel",
      key,
    },
    operationDigest,
    commandDigest,
    payloadDigest,
    previousSealDigest,
    before: revisionState(snapshot.workspace),
    after: revisionState(workspace),
    ...workspaceBoundary,
    mutationDigest: evidencePlan.mutationDigest,
    machineEdges: [],
  };
  record.authenticationDigest =
    inMemoryRecordAuthenticationDigest(
      authenticationKey,
      snapshot.identityBinding,
      snapshot.identityScope.adapterScope,
      projectJournalRecordAuthenticationCore(record),
    );
  record.recordDigest = journalRecordDigest(record);
  const outcomeEntry = {
    machineId: record.idempotency.machineId,
    key: record.idempotency.key,
    recordDigest: record.recordDigest,
    operationDigest,
    commandDigest,
    payloadDigest,
    outcome: selectedOutcome,
  };
  return {
    storeId: snapshot.storeId,
    commitRevision: snapshot.commitRevision + 1,
    workspace,
    journal: [
      ...structuredClone(snapshot.journal),
      record,
    ],
    machineHeads: structuredClone(snapshot.machineHeads),
    idempotencyOutcomeView: [
      ...structuredClone(snapshot.idempotencyOutcomeView),
      outcomeEntry,
    ],
    identityBinding: structuredClone(snapshot.identityBinding),
    identityScope: structuredClone(snapshot.identityScope),
  };
}

export async function commitEvidence(harness, options) {
  return harness.store.withWriter(
    harness.storeId,
    async (writer) => {
      const current = await writer.read();
      return writer.compareAndCommit({
        expected: snapshotExpectedToken(
          current,
          harness.identity,
        ),
        next: evidencePostImage(current, options),
      });
    },
  );
}

export function assertDeepFrozen(value) {
  const pending = [value];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === null || typeof current !== "object") continue;
    assert.equal(Object.isFrozen(current), true);
    pending.push(...Object.values(current));
  }
}

export function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}
