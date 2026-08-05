import { createCanonicalSubmission } from "../../../../source/authoring/kernel/assignment-dag.mjs";
import {
  profileManifestDigest,
  resourceReferenceFrom,
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  compileJournalIdentityPort,
} from "../../../../source/authoring/runtime/journal-replay.mjs";
import {
  createAuthoringTransactionCoordinator,
} from "../../../../source/authoring/runtime/transaction-coordinator.mjs";
import {
  workspaceRevisionState,
} from "../../../../source/authoring/runtime/workspace-application.mjs";
import {
  createReducerSubmissionScenario,
  executableDigest,
  passRegistrySource,
  reducerCommandBase,
  trustedReducerInputs,
  validBriefProduct,
} from "../../reducer/support.mjs";
import {
  resolveCoordinatorContractDriver,
} from "./driver-config.mjs";
export {
  optionalDriverFaultPoint,
} from "./drivers/driver-contract.mjs";

export const authoringMachineId = "authoring-kernel";
export const runtimeMachineId = "runtime-kernel";

export function digest(fill) {
  return `sha256:${fill.repeat(64)}`;
}

export function alternateProfile(profile) {
  profile.metadata.name = `${profile.metadata.name}-alternate`;
  profile.spec.profileDigest = profileManifestDigest(profile);
  return profile;
}

export function alternateProtocol(protocol) {
  protocol.metadata.name = `${protocol.metadata.name}-alternate`;
  return protocol;
}

export function writeCountingStoreTransform(counter) {
  return (store) => ({
    read(storeId) {
      return store.read(storeId);
    },
    withWriter(storeId, operation) {
      return store.withWriter(
        storeId,
        (writer) => operation({
          read: writer.read,
          compareAndCommit(request) {
            counter.count += 1;
            return writer.compareAndCommit(request);
          },
        }),
      );
    },
  });
}

export async function createCoordinatorHarness({
  storeId = "brief-store",
  driver,
  driverName,
  persistence,
  initialize = true,
  faultInjector,
  storeTransform = (store) => store,
  contractValidatorTransform = (validator) => validator,
  profileTransform = (profile) => profile,
  protocolTransform = (protocol) => protocol,
  guardInvoke = () => ({ status: "pass" }),
  handlerInvoke,
  authenticationKey,
  callbackCounts = {
    guard: 0,
    handler: 0,
    validator: 0,
  },
} = {}) {
  const contractDriver =
    await resolveCoordinatorContractDriver({
      driver,
      driverName,
    });
  if (
    faultInjector !== undefined &&
    contractDriver.capabilities
      .logicalFaultInjection === undefined
  ) {
    throw new TypeError(
      `coordinator contract driver ${contractDriver.id} does not expose logical fault injection`,
    );
  }
  const selectedPersistence =
    persistence ??
    await contractDriver.createPersistence({ storeId });
  const scenario = await createReducerSubmissionScenario();
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
          machineId: authoringMachineId,
          state: scenario.workspace.spec.authoringState,
        },
        {
          machineId: runtimeMachineId,
          state: "execution_ready",
        },
      ],
      adapterScope,
    }, authenticationKey);
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
  const selectedHandler = handlerInvoke ?? ((input) => ({
    status: "accept",
    products: input.phase === "submission"
      ? [validBriefProduct(scenario)]
      : [],
  }));
  const executables = passRegistrySource({
    guardInvoke(input) {
      callbackCounts.guard += 1;
      return guardInvoke(input);
    },
    handlerInvoke(input) {
      callbackCounts.handler += 1;
      return selectedHandler(input);
    },
    validatorInvoke() {
      callbackCounts.validator += 1;
      return { status: "pass" };
    },
  });
  const trustedInputs = await trustedReducerInputs({
    executables,
    inventory: [
      scenario.formDefinition,
      scenario.revisionFormDefinition,
      scenario.runtimeProtocol,
    ],
  });
  trustedInputs.validateContract =
    contractValidatorTransform(
      trustedInputs.validateContract,
    );
  const backingStore = await contractDriver.createStore({
    persistence: selectedPersistence,
    initialSnapshots: initialize ? [initialSnapshot] : [],
    identityAuthority: identity,
    authoringMachineId,
    faultInjector,
  });
  const store = storeTransform(backingStore);
  const coordinator = createAuthoringTransactionCoordinator({
    store,
    profile: profileTransform(
      structuredClone(scenario.profile),
    ),
    protocol: protocolTransform(
      structuredClone(scenario.protocol),
    ),
    trustedInputs,
    identity,
    authoringMachineId,
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
    adapterScope,
    backingStore,
    callbackCounts,
    coordinator,
    driver: contractDriver,
    identity,
    initialSnapshot,
    persistence: selectedPersistence,
    rawIdentity,
    scenario,
    store,
    storeId,
    trustedInputs,
  };
}

export async function issueAssignment(harness) {
  return harness.coordinator.execute(
    harness.storeId,
    { class: "next", inputs: {} },
  );
}

export function submissionFor(
  harness,
  issued,
  {
    name = "brief-submission",
    summary = "A concise launch brief.",
    raw = `${summary}\n`,
    producerId = "text-adapter",
  } = {},
) {
  const projectionBinding =
    harness.scenario.profile.spec.projectionBindings.find(
      (binding) =>
        binding.id ===
          issued.request.spec.bindings.projection.id,
    );
  return createCanonicalSubmission({
    name,
    request: issued.request,
    contextClosure: issued.contextClosure,
    assignment: issued.assignment,
    projectionArtifact: issued.projectionArtifact,
    projectionBinding,
    formDefinition: harness.scenario.formDefinition,
    normalizedValues: { summary },
    rawEvidenceBytes: Buffer.from(raw, "utf8"),
    producerProvenance: {
      producerId,
      producerClass: "adapter",
      evidenceDigest: executableDigest(),
    },
  });
}

export function assignmentBinding(issued) {
  return {
    reference: resourceReferenceFrom(issued.assignment),
    assignmentDigest:
      issued.assignment.spec.assignmentDigest,
  };
}

export async function currentExternalCouplings(harness) {
  const { snapshot } = await harness.coordinator.read(
    harness.storeId,
  );
  const ordinal = snapshot.journal.length + 1;
  const runtimeHead = snapshot.machineHeads.find(
    (head) => head.machineId === runtimeMachineId,
  );
  const stateDigest = (state) =>
    harness.identity.machineStateDigest({
      machineId: runtimeMachineId,
      state,
      journalOrdinal: ordinal,
    });
  return [
    {
      machineId: runtimeMachineId,
      transitionId: "RT01",
      fromState: "execution_ready",
      eventId: "BEGIN",
      toState: "refreeze_pending",
      beforeStateDigest: runtimeHead.stateDigest,
      afterStateDigest: stateDigest("refreeze_pending"),
    },
    {
      machineId: runtimeMachineId,
      transitionId: "RT02",
      fromState: "refreeze_pending",
      eventId: "COMPLETE",
      toState: "execution_ready",
      beforeStateDigest: stateDigest("refreeze_pending"),
      afterStateDigest: stateDigest("execution_ready"),
    },
  ];
}

export async function submitCommand(
  harness,
  issued,
  submission,
) {
  return {
    class: "submit",
    request: issued.request,
    assignment: issued.assignment,
    submission,
    externalCouplings:
      await currentExternalCouplings(harness),
  };
}

export async function acceptSubmission(
  harness,
  issued,
  submission = submissionFor(harness, issued),
) {
  return harness.coordinator.execute(
    harness.storeId,
    await submitCommand(
      harness,
      issued,
      submission,
    ),
  );
}

export async function eventCommand(
  harness,
  {
    eventId = "ACCEPT",
    commandFill = "1",
    payloadFill = "2",
    evidenceFill = "3",
  } = {},
) {
  const { snapshot } = await harness.coordinator.read(
    harness.storeId,
  );
  return {
    class: "event",
    eventId,
    base: reducerCommandBase(snapshot.workspace),
    commandDigest: digest(commandFill),
    payloadDigest: digest(payloadFill),
    evidenceDigest: digest(evidenceFill),
    inputs: {},
    externalCouplings: [],
  };
}
