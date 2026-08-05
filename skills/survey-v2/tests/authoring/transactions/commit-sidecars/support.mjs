import {
  journalRecordDigest,
  projectJournalRecordAuthenticationCore,
  resourceReferenceFrom,
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  compileExecutableRegistry,
} from "../../../../source/authoring/kernel/executable-registry.mjs";
import {
  deriveCommitSidecars,
} from "../../../../source/authoring/runtime/commit-sidecars.mjs";
import {
  compileJournalIdentityPort,
  replayAuthoringJournal,
} from "../../../../source/authoring/runtime/journal-replay.mjs";
import {
  createAuthoringTransactionCoordinator,
} from "../../../../source/authoring/runtime/transaction-coordinator.mjs";
import {
  workspaceRevisionState,
} from "../../../../source/authoring/runtime/workspace-application.mjs";
import {
  createReducerSubmissionScenario,
  defaultProjectorInvoke,
  executableDigest,
  passRegistrySource,
  rehashAuthority,
  trustedReducerInputs,
  validBriefProduct,
} from "../../reducer/support.mjs";
import {
  resolveCoordinatorContractDriver,
} from "../coordinator/driver-config.mjs";
import {
  submissionFor,
  submitCommand,
} from "../coordinator/support.mjs";

export const commitAuditType = Object.freeze({
  apiVersion: "audit.example/v1alpha1",
  kind: "CommitAudit",
});
export const sidecarBindingId = "commit-audit-binding";
export const sidecarExecutableId = "commit-audit-sidecar";

function exactKeys(value, keys) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.keys(value).sort().join("\u0000") ===
      [...keys].sort().join("\u0000")
  );
}

function exactReference(value) {
  return (
    exactKeys(
      value,
      ["apiVersion", "kind", "name", "semanticDigest"],
    ) &&
    ["apiVersion", "kind", "name", "semanticDigest"].every(
      (key) =>
        typeof value[key] === "string" &&
        value[key].length > 0,
    )
  );
}

export function commitAuditResource(
  input,
  {
    name = "commit-audit",
    type = commitAuditType,
  } = {},
) {
  return {
    apiVersion: type.apiVersion,
    kind: type.kind,
    metadata: { name },
    spec: {
      receipt: resourceReferenceFrom(input.receipt),
      transitionId:
        input.mutation.spec.cause.edge.transitionId,
    },
  };
}

function validCommitAuditContract(candidate) {
  return (
    exactKeys(
      candidate,
      ["apiVersion", "kind", "metadata", "spec"],
    ) &&
    candidate.apiVersion === commitAuditType.apiVersion &&
    candidate.kind === commitAuditType.kind &&
    exactKeys(candidate.metadata, ["name"]) &&
    typeof candidate.metadata.name === "string" &&
    candidate.metadata.name.length > 0 &&
    exactKeys(candidate.spec, ["receipt", "transitionId"]) &&
    exactReference(candidate.spec.receipt) &&
    typeof candidate.spec.transitionId === "string" &&
    candidate.spec.transitionId.length > 0
  );
}

export function sidecarBinding({
  id = sidecarBindingId,
  executableId = sidecarExecutableId,
  cardinality = { min: 1, max: 1 },
  executableDigest: selectedDigest = executableDigest(),
} = {}) {
  return {
    id,
    executable: {
      id: executableId,
      digest: selectedDigest,
    },
    targets: [{
      resourceType: { ...commitAuditType },
      cardinality: { ...cardinality },
    }],
  };
}

function sidecarSchemaBinding() {
  return {
    id: "commit-audit-schema",
    resourceType: { ...commitAuditType },
    schema: {
      id: "brief-schema-module",
      digest: executableDigest(),
    },
    semanticValidator: {
      id: "brief-validator",
      digest: executableDigest(),
    },
  };
}

export function attachSidecarAuthority(
  scenario,
  {
    cardinality,
    executableDigest: selectedDigest,
  } = {},
) {
  scenario.profile.spec.schemaBindings.push(
    sidecarSchemaBinding(),
  );
  scenario.profile.spec.commitSidecarBindings = [
    sidecarBinding({
      cardinality,
      executableDigest: selectedDigest,
    }),
  ];
  const transition =
    scenario.profile.spec.transitionBindings.find(
      (entry) => entry.transitionId === "AT01",
    );
  transition.commitSidecarBindingIds = [sidecarBindingId];
  rehashAuthority(scenario);
}

function directProfile({
  cardinality,
  executableDigest: selectedDigest,
} = {}) {
  return {
    spec: {
      transitionBindings: [{
        transitionId: "AT01",
        commitSidecarBindingIds: [sidecarBindingId],
      }],
      commitSidecarBindings: [
        sidecarBinding({
          cardinality,
          executableDigest: selectedDigest,
        }),
      ],
      schemaBindings: [sidecarSchemaBinding()],
    },
  };
}

function directAncestry() {
  const resource = (kind, name) => ({
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind,
    metadata: { name },
    spec: {},
  });
  const mutation = resource(
    "AuthoringMutation",
    "mutation-direct",
  );
  mutation.spec.cause = {
    edge: { transitionId: "AT01" },
  };
  return {
    request: resource("AuthoringRequest", "request-direct"),
    assignment: resource(
      "AuthoringAssignment",
      "assignment-direct",
    ),
    submission: resource(
      "AuthoringSubmission",
      "submission-direct",
    ),
    contextClosure: resource(
      "ContextClosure",
      "context-direct",
    ),
    mutation,
    receipt: resource(
      "AuthoringCommitReceipt",
      "receipt-direct",
    ),
  };
}

export function deriveDirectSidecars({
  sidecarInvoke,
  cardinality,
  manifestExecutableDigest,
  registryExecutableDigest = executableDigest(),
  includeSidecarExecutable = true,
  existingResources = [],
} = {}) {
  const executables = {
    guards: [],
    handlers: [{
      id: sidecarExecutableId,
      digest: registryExecutableDigest,
      invoke() {
        throw new Error(
          "sidecar dispatch crossed into handlers",
        );
      },
    }],
    validators: [
      {
        id: "brief-schema-module",
        digest: executableDigest(),
        invoke: () => ({ status: "pass" }),
      },
      {
        id: "brief-validator",
        digest: executableDigest(),
        invoke: () => ({ status: "pass" }),
      },
    ],
    projectors: [],
    ...(includeSidecarExecutable
      ? {
          sidecars: [{
            id: sidecarExecutableId,
            digest: registryExecutableDigest,
            invoke: sidecarInvoke,
          }],
        }
      : {}),
  };
  return deriveCommitSidecars({
    profile: directProfile({
      cardinality,
      executableDigest: manifestExecutableDigest,
    }),
    transitionId: "AT01",
    executables,
    ...directAncestry(),
    resources: existingResources,
    validateContract: (resource) =>
      validCommitAuditContract(resource),
  });
}

export async function createSidecarCoordinatorHarness({
  storeId = "commit-sidecar-store",
  driver,
  driverName,
  persistence,
  initialize = true,
  sidecarInvoke,
  cardinality,
  manifestExecutableDigest,
  registryExecutableDigest = executableDigest(),
  includeSidecarExecutable = true,
} = {}) {
  const contractDriver =
    await resolveCoordinatorContractDriver({
      driver,
      driverName,
    });
  const selectedPersistence =
    persistence ??
    await contractDriver.createPersistence({ storeId });
  const scenario = await createReducerSubmissionScenario();
  attachSidecarAuthority(scenario, {
    cardinality,
    executableDigest: manifestExecutableDigest,
  });
  const adapterScope =
    await contractDriver.createAdapterScope({ storeId });
  const rawIdentity =
    await contractDriver.createIdentityConfiguration({
    genesisRevisionState:
      workspaceRevisionState(scenario.workspace),
    genesisWorkspaceIntegrityDigest:
      scenario.workspace.spec.integrity
        .workspaceIntegrityDigest,
    genesisMachines: [
      {
        machineId: "authoring-kernel",
        state: scenario.workspace.spec.authoringState,
      },
      {
        machineId: "runtime-kernel",
        state: "execution_ready",
      },
    ],
    adapterScope,
  });
  const identity = compileJournalIdentityPort(rawIdentity);
  const initialSnapshot = {
    storeId,
    commitRevision: 0,
    workspace: structuredClone(scenario.workspace),
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
  const counts = {
    guard: 0,
    handler: 0,
    projector: 0,
    sidecar: 0,
    validator: 0,
  };
  const selectedSidecar = sidecarInvoke ??
    ((input) => ({
      status: "accept",
      resources: [commitAuditResource(input)],
    }));
  const executables = passRegistrySource({
    guardInvoke() {
      counts.guard += 1;
      return { status: "pass" };
    },
    handlerInvoke(input) {
      counts.handler += 1;
      return {
        status: "accept",
        products: input.phase === "submission"
          ? [validBriefProduct(scenario)]
          : [],
      };
    },
    validatorInvoke() {
      counts.validator += 1;
      return { status: "pass" };
    },
    projectorInvoke(input) {
      counts.projector += 1;
      return defaultProjectorInvoke(input);
    },
  });
  if (includeSidecarExecutable) {
    executables.sidecars = [{
      id: sidecarExecutableId,
      digest: registryExecutableDigest,
      invoke(input) {
        counts.sidecar += 1;
        return selectedSidecar(input);
      },
    }];
  }
  const trustedInputs = await trustedReducerInputs({
    executables,
    inventory: [
      scenario.formDefinition,
      scenario.revisionFormDefinition,
      scenario.runtimeProtocol,
    ],
  });
  const submissionExecutableRegistry =
    compileExecutableRegistry(executables);
  const baseValidateContract = trustedInputs.validateContract;
  trustedInputs.validateContract = (candidate) =>
    candidate?.kind === commitAuditType.kind
      ? validCommitAuditContract(candidate)
      : baseValidateContract(candidate);
  const store = await contractDriver.createStore({
    persistence: selectedPersistence,
    initialSnapshots: initialize ? [initialSnapshot] : [],
    identityAuthority: identity,
    authoringMachineId: "authoring-kernel",
  });
  const coordinator = createAuthoringTransactionCoordinator({
    store,
    profile: scenario.profile,
    protocol: scenario.protocol,
    trustedInputs,
    identity,
    authoringMachineId: "authoring-kernel",
    systemActor: {
      class: "automation",
      id: "authoring-runtime",
    },
    evidenceAuthority: {
      class: "kernel",
      id: "evidence-authority",
      policy: {
        id: "evidence-policy",
        digest: executableDigest(),
      },
    },
  });
  return {
    coordinator,
    counts,
    driver: contractDriver,
    identity,
    initialSnapshot,
    persistence: selectedPersistence,
    scenario,
    store,
    storeId,
    submissionExecutableRegistry,
  };
}

export async function prepareSubmission(harness) {
  const issued = await harness.coordinator.execute(
    harness.storeId,
    { class: "next", inputs: {} },
  );
  const submission = submissionFor(harness, issued);
  const command = await submitCommand(
    harness,
    issued,
    submission,
  );
  return { command, issued, submission };
}

export async function snapshot(harness) {
  return harness.store.read(harness.storeId);
}

export function terminalOutcome(snapshotValue) {
  return snapshotValue.idempotencyOutcomeView.at(-1).outcome;
}

export function replaySnapshot(
  harness,
  snapshotValue,
  {
    workspace = snapshotValue.workspace,
    journal = snapshotValue.journal,
    machineHeads = snapshotValue.machineHeads,
    idempotencyOutcomeView =
      snapshotValue.idempotencyOutcomeView,
  } = {},
) {
  return replayAuthoringJournal({
    commitRevision: snapshotValue.commitRevision,
    workspace,
    journal,
    machineHeads,
    idempotencyOutcomeView,
    authoringMachineId: "authoring-kernel",
    identity: harness.identity,
  });
}

export function rehashTerminalRecord(
  harness,
  journal,
  idempotencyOutcomeView,
) {
  const record = journal.at(-1);
  record.authenticationDigest =
    harness.identity.recordAuthenticationDigest(
      projectJournalRecordAuthenticationCore(record),
    );
  record.recordDigest = journalRecordDigest(record);
  idempotencyOutcomeView.at(-1).recordDigest =
    record.recordDigest;
}
