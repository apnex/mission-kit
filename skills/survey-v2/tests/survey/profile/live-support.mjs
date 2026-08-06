import {
  createCanonicalSubmission,
} from "../../../source/authoring/kernel/assignment-dag.mjs";
import {
  textContentBytes,
} from "../../../source/authoring/kernel/text-forms.mjs";
import {
  invokeProjector,
} from "../../../source/authoring/kernel/executable-registry.mjs";
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  compileJournalIdentityPort,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  createAuthoringTransactionCoordinator,
} from "../../../source/authoring/runtime/transaction-coordinator.mjs";
import {
  createOneShotCommandAdmission,
} from "../../../source/authoring/runtime/command-admission.mjs";
import {
  resealWorkspace,
  storedResourceVersionFromResource,
  workspaceRevisionState,
} from "../../../source/authoring/runtime/workspace-application.mjs";
import {
  createSurveyProfileExecutableRegistry,
} from "../../../source/authoring/survey/profile-executables.mjs";
import {
  createSurveyInitializationAdapter,
} from "../../../source/authoring/survey/initialization-adapter.mjs";
import {
  buildSurveySourceSnapshot,
} from "../../../source/authoring/survey/source-snapshot.mjs";
import {
  buildSurveyPolicySnapshot,
} from "../../../source/authoring/survey/survey-policy-snapshot.mjs";
import {
  validateById,
} from "../../../generated/validators.mjs";
import {
  inMemoryCoordinatorContractDriver,
} from "../../authoring/transactions/coordinator/drivers/in-memory-driver.mjs";
import {
  reducerCommandBase,
} from "../../authoring/reducer/support.mjs";
import {
  loadProfileScenario,
  surveyFrameValues,
} from "./support.mjs";

export const surveyAuthoringMachineId = "authoring";
export const surveyPhaseMachineId = "phase";

const zeroDigest = `sha256:${"0".repeat(64)}`;
const schemaByKind = Object.freeze({
  AuthoringAssignment:
    "urn:mission-kit:authoring:schema:authoring-assignment:v1alpha1",
  AuthoringCommitReceipt:
    "urn:mission-kit:authoring:schema:authoring-commit-receipt:v1alpha1",
  AuthoringFormDefinition:
    "urn:mission-kit:authoring:schema:authoring-form-definition:v1alpha1",
  AuthoringJournalRecord:
    "urn:mission-kit:authoring:schema:authoring-journal-record:v1alpha1",
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
  ContextFrame:
    "urn:mission-kit:schemas:context-frame:v1alpha1",
  GenerationRecord:
    "urn:mission-kit:survey:schema:generation-record:v1alpha1",
  QuestionFrameSet:
    "urn:mission-kit:survey:schema:question-frame-set:v1alpha1",
  Question:
    "urn:mission-kit:schemas:question:v1alpha1",
  SurveyQuestionBinding:
    "urn:mission-kit:survey:schema:survey-question-binding:v1alpha1",
  RoundInstrument:
    "urn:mission-kit:survey:schema:round-instrument:v1alpha1",
  ProjectionArtifact:
    "urn:mission-kit:authoring:schema:projection-artifact:v1alpha1",
  SourceSnapshot:
    "urn:mission-kit:authoring:schema:source-snapshot:v1alpha1",
  Survey:
    "urn:mission-kit:survey:schema:survey:v1alpha1",
  SurveyRound:
    "urn:mission-kit:survey:schema:survey-round:v1alpha1",
  SurveyPolicySnapshot:
    "urn:mission-kit:survey:schema:survey-policy-snapshot:v1alpha1",
  ValidationIssue:
    "urn:mission-kit:authoring:schema:validation-issue:v1alpha1",
});

export function digest(character) {
  return `sha256:${character.repeat(64)}`;
}

export function validateContract(resource) {
  const schemaId = schemaByKind[resource?.kind];
  return schemaId !== undefined &&
    validateById(schemaId, resource).valid;
}

function policyInput(profile) {
  const schemaBindings = profile.spec.schemaBindings.map(
    (binding) => ({
      id: binding.id,
      digest: binding.schema.digest,
    }),
  );
  const validatorBindings = profile.spec.validatorSets.flatMap(
    (validatorSet) =>
      validatorSet.members.map((member) => ({
        id: member.id,
        digest: member.digest,
      })),
  );
  const at01 = profile.spec.transitionBindings.find(
    (binding) => binding.transitionId === "AT01",
  );
  const surveyFrame = profile.spec.tasks.find(
    (task) => task.id === "author-survey-frame",
  );
  const selectorBindings = [
    ...at01.inputSelectors,
    ...surveyFrame.contextSelectors,
  ].map((selector) => ({
    id: selector.id,
    digest: selector.selectorDigest,
  }));
  return {
    profile,
    schemaBindings,
    validatorBindings,
    selectorBindings,
  };
}

function initialWorkspace({
  profile,
  protocol,
  sourceSnapshot,
  policySnapshot,
}) {
  return resealWorkspace({
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringWorkspace",
    metadata: { name: "survey-v2-live-profile" },
    spec: {
      profile: {
        reference: resourceReferenceFrom(profile),
        profileDigest: profile.spec.profileDigest,
      },
      protocol: {
        reference: resourceReferenceFrom(protocol),
        protocolDigest:
          resourceReferenceFrom(protocol).semanticDigest,
      },
      authoringState: "new",
      semanticRevision: 0,
      evidenceRevision: 0,
      resourceVersions: [
        storedResourceVersionFromResource(sourceSnapshot),
        storedResourceVersionFromResource(policySnapshot),
      ],
      activeHeads: [
        {
          slot: "intake",
          reference: resourceReferenceFrom(sourceSnapshot),
        },
        {
          slot: "policy",
          reference: resourceReferenceFrom(policySnapshot),
        },
      ],
      dependencyEdges: [],
      handoffProducts: [],
      history: [],
      openAssignment: null,
      integrity: {
        semanticStateDigest: zeroDigest,
        workspaceIntegrityDigest: zeroDigest,
      },
    },
  });
}

export async function createLiveSurveyHarness({
  storeId = "survey-v2-profile-live",
  faultInjector,
  sourceEntries = [{
    logicalName: "intent.txt",
    bytes: Buffer.from(
      "Design a precise context-framed Survey authoring workflow.\n",
      "utf8",
    ),
  }],
} = {}) {
  const scenario = await loadProfileScenario();
  const sourceSnapshot = buildSurveySourceSnapshot(sourceEntries);
  const policySnapshot = buildSurveyPolicySnapshot(
    policyInput(scenario.profile),
  );
  const workspace = initialWorkspace({
    profile: scenario.profile,
    protocol: scenario.protocol,
    sourceSnapshot,
    policySnapshot,
  });
  const driver = inMemoryCoordinatorContractDriver;
  const adapterScope = await driver.createAdapterScope({ storeId });
  const rawIdentity = await driver.createIdentityConfiguration({
    genesisRevisionState: workspaceRevisionState(workspace),
    genesisWorkspaceIntegrityDigest:
      workspace.spec.integrity.workspaceIntegrityDigest,
    genesisMachines: [
      {
        machineId: surveyAuthoringMachineId,
        state: "new",
      },
      {
        machineId: surveyPhaseMachineId,
        state: "initialized",
      },
    ],
    adapterScope,
  });
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
    identityBinding: structuredClone(rawIdentity.identityBinding),
    identityScope: structuredClone(rawIdentity.identityScope),
  };
  const persistence = await driver.createPersistence({ storeId });
  const store = await driver.createStore({
    persistence,
    initialSnapshots: [initialSnapshot],
    identityAuthority: identity,
    authoringMachineId: surveyAuthoringMachineId,
    faultInjector,
  });
  const executables = createSurveyProfileExecutableRegistry({
    bindings: scenario.bindings,
  });
  const eventAdmission =
    createOneShotCommandAdmission(
      scenario.profile.spec.eventCommandAdmission,
    );
  const coordinator = createAuthoringTransactionCoordinator({
    store,
    profile: scenario.profile,
    protocol: scenario.protocol,
    trustedInputs: {
      validateContract,
      kernel: scenario.profile.spec.kernel,
      inventory: scenario.resources,
      executables,
    },
    identity,
    authoringMachineId: surveyAuthoringMachineId,
    systemActor: {
      class: "automation",
      id: "survey-v2-live-harness",
    },
    evidenceAuthority: {
      class: "kernel",
      id: "survey-v2-evidence-authority",
      policy: {
        id: "survey-v2-evidence-policy",
        digest: digest("e"),
      },
    },
    eventCommandAdmission: eventAdmission.verifier,
  });
  const admittedInitializationPort =
    eventAdmission.bind(coordinator);
  const createInitializationAdapter = (
    authority,
    observe = () => {},
  ) =>
    createSurveyInitializationAdapter(
      authority,
      {
        coordinator: {
          async read(storeIdInput) {
            observe("read");
            return coordinator.read(storeIdInput);
          },
          async execute(storeIdInput, command) {
            observe("execute");
            return admittedInitializationPort.execute(
              storeIdInput,
              command,
            );
          },
        },
        identity: {
          machineStateDigest(input) {
            observe("machineStateDigest");
            return identity.machineStateDigest(input);
          },
        },
        storeId,
      },
    );
  return {
    ...scenario,
    coordinator,
    createInitializationAdapter,
    driver,
    executables,
    identity,
    initialSnapshot,
    persistence,
    policySnapshot,
    sourceSnapshot,
    store,
    storeId,
    workspace,
  };
}

export async function createBeginSurveyCommand(harness) {
  const { snapshot } = await harness.coordinator.read(
    harness.storeId,
  );
  const journalOrdinal = snapshot.journal.length + 1;
  const phaseHead = snapshot.machineHeads.find(
    (head) => head.machineId === surveyPhaseMachineId,
  );
  return {
    class: "event",
    eventId: "BEGIN_AUTHORING",
    base: reducerCommandBase(snapshot.workspace),
    commandDigest: digest("1"),
    payloadDigest: digest("2"),
    evidenceDigest: digest("3"),
    inputs: {},
    externalCouplings: [{
      machineId: surveyPhaseMachineId,
      transitionId: "T02",
      fromState: "initialized",
      eventId: "BEGIN_R1_DESIGN",
      toState: "round_1_drafting",
      beforeStateDigest: phaseHead.stateDigest,
      afterStateDigest: harness.identity.machineStateDigest({
        machineId: surveyPhaseMachineId,
        state: "round_1_drafting",
        journalOrdinal,
      }),
    }],
  };
}

export async function beginSurveyAuthoring(harness) {
  const dependencyResult = {
    status: "ready",
    resultDigest: digest("8"),
  };
  const adapter = harness.createInitializationAdapter({
    directorRef: "director.live-harness",
    proposerRef: "proposer.live-harness",
    bindingEvidence: "host-adapter:live-harness",
  });
  const result = await adapter.advance(
    adapter.initialState,
    dependencyResult,
  );
  return {
    adapter,
    command: result.state.accepted.command,
    dependencyResult,
    result,
  };
}

export async function issueSurveyFrameAssignment(harness) {
  return harness.coordinator.execute(
    harness.storeId,
    { class: "next", inputs: {} },
  );
}

export async function issueRoundOneFrameAssignment(harness) {
  return harness.coordinator.execute(
    harness.storeId,
    { class: "next", inputs: {} },
  );
}

export async function issueRoundOneQuestionFramesAssignment(harness) {
  return harness.coordinator.execute(
    harness.storeId,
    { class: "next", inputs: {} },
  );
}

export async function issueRoundOneQuestionsAssignment(harness) {
  return harness.coordinator.execute(
    harness.storeId,
    { class: "next", inputs: {} },
  );
}

function projectionRenderer(harness, projectionBinding) {
  return (input) => {
    const result = invokeProjector(
      harness.compiled,
      projectionBinding.engine,
      input,
    );
    if (result.status !== "accept") {
      throw new Error(
        `Survey projection rejected: ${result.issues[0].code}`,
      );
    }
    return textContentBytes(result.content);
  };
}

export function createSurveyFrameSubmission(
  harness,
  issued,
) {
  const projectionBinding =
    harness.profile.spec.projectionBindings.find(
      (binding) =>
        binding.id ===
          issued.request.spec.bindings.projection.id,
    );
  const formBinding = harness.profile.spec.formBindings.find(
    (binding) =>
      binding.id === issued.request.spec.bindings.form.id,
  );
  const formDefinition = harness.forms.find(
    (form) =>
      form.metadata.name === formBinding.definition.name,
  );
  return createCanonicalSubmission({
    name: "survey-frame-live-submission",
    request: issued.request,
    contextClosure: issued.contextClosure,
    assignment: issued.assignment,
    projectionArtifact: issued.projectionArtifact,
    projectionBinding,
    formDefinition,
    normalizedValues: surveyFrameValues(),
    rawEvidenceBytes: Buffer.from(
      "Survey frame values supplied by the live integration harness.\n",
      "utf8",
    ),
    producerProvenance: {
      producerId: "survey-frame-test-agent",
      producerClass: "agent",
      evidenceDigest: digest("4"),
      generation: {
        attemptId: "survey-frame-attempt-1",
        provider: "mission-kit-test",
        model: "deterministic-agent-fixture",
        adapter: {
          id: "survey-frame-agent-adapter",
          digest: digest("5"),
        },
        configurationDigest: digest("6"),
        telemetry: {
          inputTokens: 100,
          outputTokens: 40,
          latencyMs: 12,
        },
      },
    },
    renderProjection: projectionRenderer(
      harness,
      projectionBinding,
    ),
  });
}

export function createRoundOneFrameSubmission(
  harness,
  issued,
  normalizedValues,
) {
  const projectionBinding =
    harness.profile.spec.projectionBindings.find(
      (binding) =>
        binding.id ===
          issued.request.spec.bindings.projection.id,
    );
  const formBinding = harness.profile.spec.formBindings.find(
    (binding) =>
      binding.id === issued.request.spec.bindings.form.id,
  );
  const formDefinition = harness.forms.find(
    (form) =>
      form.metadata.name === formBinding.definition.name,
  );
  return createCanonicalSubmission({
    name: "round-one-frame-live-submission",
    request: issued.request,
    contextClosure: issued.contextClosure,
    assignment: issued.assignment,
    projectionArtifact: issued.projectionArtifact,
    projectionBinding,
    formDefinition,
    normalizedValues,
    rawEvidenceBytes: Buffer.from(
      "Round 1 frame values supplied by the live integration harness.\n",
      "utf8",
    ),
    producerProvenance: {
      producerId: "round-one-frame-test-agent",
      producerClass: "agent",
      evidenceDigest: digest("a"),
      generation: {
        attemptId: "round-one-frame-attempt-1",
        provider: "mission-kit-test",
        model: "deterministic-agent-fixture",
        adapter: {
          id: "round-one-frame-agent-adapter",
          digest: digest("b"),
        },
        configurationDigest: digest("c"),
        telemetry: {
          inputTokens: 120,
          outputTokens: 50,
          latencyMs: 14,
        },
      },
    },
    renderProjection: projectionRenderer(
      harness,
      projectionBinding,
    ),
  });
}

export function createRoundOneQuestionFramesSubmission(
  harness,
  issued,
  normalizedValues,
) {
  const projectionBinding =
    harness.profile.spec.projectionBindings.find(
      (binding) =>
        binding.id ===
          issued.request.spec.bindings.projection.id,
    );
  const formBinding = harness.profile.spec.formBindings.find(
    (binding) =>
      binding.id === issued.request.spec.bindings.form.id,
  );
  const formDefinition = harness.forms.find(
    (form) =>
      form.metadata.name === formBinding.definition.name,
  );
  return createCanonicalSubmission({
    name: "round-one-question-frames-live-submission",
    request: issued.request,
    contextClosure: issued.contextClosure,
    assignment: issued.assignment,
    projectionArtifact: issued.projectionArtifact,
    projectionBinding,
    formDefinition,
    normalizedValues,
    rawEvidenceBytes: Buffer.from(
      "Round 1 QuestionFrame values supplied by the live integration harness.\n",
      "utf8",
    ),
    producerProvenance: {
      producerId: "round-one-question-frames-test-agent",
      producerClass: "agent",
      evidenceDigest: digest("d"),
      generation: {
        attemptId: "round-one-question-frames-attempt-1",
        provider: "mission-kit-test",
        model: "deterministic-agent-fixture",
        adapter: {
          id: "round-one-question-frames-agent-adapter",
          digest: digest("f"),
        },
        configurationDigest: digest("7"),
        telemetry: {
          inputTokens: 180,
          outputTokens: 80,
          latencyMs: 18,
        },
      },
    },
    renderProjection: projectionRenderer(
      harness,
      projectionBinding,
    ),
  });
}

export function createRoundOneQuestionsSubmission(
  harness,
  issued,
  normalizedValues,
) {
  const projectionBinding =
    harness.profile.spec.projectionBindings.find(
      (binding) =>
        binding.id ===
          issued.request.spec.bindings.projection.id,
    );
  const formBinding = harness.profile.spec.formBindings.find(
    (binding) =>
      binding.id === issued.request.spec.bindings.form.id,
  );
  const formDefinition = harness.forms.find(
    (form) =>
      form.metadata.name === formBinding.definition.name,
  );
  return createCanonicalSubmission({
    name: "round-one-questions-live-submission",
    request: issued.request,
    contextClosure: issued.contextClosure,
    assignment: issued.assignment,
    projectionArtifact: issued.projectionArtifact,
    projectionBinding,
    formDefinition,
    normalizedValues,
    rawEvidenceBytes: Buffer.from(
      "Round 1 Question values supplied by the live integration harness.\n",
      "utf8",
    ),
    producerProvenance: {
      producerId: "round-one-questions-test-agent",
      producerClass: "agent",
      evidenceDigest: digest("9"),
      generation: {
        attemptId: "round-one-questions-attempt-1",
        provider: "mission-kit-test",
        model: "deterministic-agent-fixture",
        adapter: {
          id: "round-one-questions-agent-adapter",
          digest: digest("e"),
        },
        configurationDigest: digest("0"),
        telemetry: {
          inputTokens: 220,
          outputTokens: 110,
          latencyMs: 22,
        },
      },
    },
    renderProjection: projectionRenderer(
      harness,
      projectionBinding,
    ),
  });
}

export async function submitSurveyFrame(
  harness,
  issued,
  submission,
) {
  const command = {
    class: "submit",
    request: issued.request,
    assignment: issued.assignment,
    submission,
    externalCouplings: [],
  };
  return {
    command,
    result: await harness.coordinator.execute(
      harness.storeId,
      command,
    ),
  };
}

export async function submitRoundOneFrame(
  harness,
  issued,
  submission,
) {
  const command = {
    class: "submit",
    request: issued.request,
    assignment: issued.assignment,
    submission,
    externalCouplings: [],
  };
  return {
    command,
    result: await harness.coordinator.execute(
      harness.storeId,
      command,
    ),
  };
}

export async function submitRoundOneQuestionFrames(
  harness,
  issued,
  submission,
) {
  const command = {
    class: "submit",
    request: issued.request,
    assignment: issued.assignment,
    submission,
    externalCouplings: [],
  };
  return {
    command,
    result: await harness.coordinator.execute(
      harness.storeId,
      command,
    ),
  };
}

export async function submitRoundOneQuestions(
  harness,
  issued,
  submission,
) {
  const { snapshot } = await harness.coordinator.read(
    harness.storeId,
  );
  const phaseHead = snapshot.machineHeads.find(
    (head) => head.machineId === surveyPhaseMachineId,
  );
  const journalOrdinal = snapshot.journal.length + 1;
  const command = {
    class: "submit",
    request: issued.request,
    assignment: issued.assignment,
    submission,
    externalCouplings: [{
      machineId: surveyPhaseMachineId,
      transitionId: "T03",
      fromState: "round_1_drafting",
      eventId: "FREEZE_R1",
      toState: "round_1_q1_ready",
      beforeStateDigest: phaseHead.stateDigest,
      afterStateDigest: harness.identity.machineStateDigest({
        machineId: surveyPhaseMachineId,
        state: "round_1_q1_ready",
        journalOrdinal,
      }),
    }],
  };
  return {
    command,
    result: await harness.coordinator.execute(
      harness.storeId,
      command,
    ),
  };
}
