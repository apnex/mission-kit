import {
  createTextSubmission,
} from "../kernel/assignment-dag.mjs";
import {
  compileExecutableRegistry,
  invokeProjector,
} from "../kernel/executable-registry.mjs";
import {
  textContentBytes,
} from "../kernel/text-forms.mjs";
import {
  createOneShotCommandAdmission,
} from "../runtime/command-admission.mjs";
import {
  createAuthoringTransactionCoordinator,
} from "../runtime/transaction-coordinator.mjs";
import {
  validateById,
} from "../../../generated/validators.mjs";
import {
  createSurveyInitializationAdapter,
} from "./initialization-adapter.mjs";
import {
  loadSurveyProfileAuthority,
} from "./profile-authority.mjs";
import {
  createSurveyProfileExecutableRegistry,
} from "./profile-executables.mjs";

export const SURVEY_AUTHORING_MACHINE_ID = "authoring";
export const SURVEY_PHASE_MACHINE_ID = "phase";

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

function validateContract(resource) {
  const schemaId = schemaByKind[resource?.kind];
  return schemaId !== undefined &&
    validateById(schemaId, resource).valid;
}

function projectionRenderer(runtime, projectionBinding) {
  return (input) => {
    const result = invokeProjector(
      runtime.compiled,
      projectionBinding.engine,
      input,
    );
    if (result.status !== "accept") {
      const error = new Error(
        `Survey projection rejected: ${
          result.issues?.[0]?.code ?? "UNKNOWN"
        }`,
      );
      error.code =
        result.issues?.[0]?.code ??
        "SURVEY_PROJECTION_REJECTED";
      throw error;
    }
    return textContentBytes(result.content);
  };
}

function assignmentBindings(runtime, pending) {
  const projectionBinding =
    runtime.profile.spec.projectionBindings.find(
      (binding) =>
        binding.id ===
          pending.request.spec.bindings.projection.id,
    );
  const formBinding = runtime.profile.spec.formBindings.find(
    (binding) =>
      binding.id === pending.request.spec.bindings.form.id,
  );
  const formDefinition = runtime.forms.find(
    (form) =>
      form.metadata.name === formBinding?.definition?.name,
  );
  if (!projectionBinding || !formBinding || !formDefinition) {
    const error = new Error(
      "pending Assignment has no exact executable form binding",
    );
    error.code = "SURVEY_PENDING_BINDING_INVALID";
    throw error;
  }
  return {
    projectionBinding,
    formDefinition,
  };
}

/**
 * Construct the production Survey profile runtime over one injected K13
 * store and compiled JournalIdentityPort. This module owns Survey vocabulary;
 * the coordinator and store contracts remain domain-neutral.
 */
export async function createSurveyAuthoringRuntime({
  store,
  identity,
  systemActorId = "surveyctl",
}) {
  const authority = await loadSurveyProfileAuthority();
  const executables = createSurveyProfileExecutableRegistry({
    bindings: authority.bindings,
  });
  const compiled = compileExecutableRegistry(executables);
  const eventAdmission = createOneShotCommandAdmission(
    authority.profile.spec.eventCommandAdmission,
  );
  const coordinator = createAuthoringTransactionCoordinator({
    store,
    profile: authority.profile,
    protocol: authority.protocol,
    trustedInputs: {
      validateContract,
      kernel: authority.profile.spec.kernel,
      inventory: authority.resources,
      executables,
    },
    identity,
    authoringMachineId: SURVEY_AUTHORING_MACHINE_ID,
    systemActor: {
      class: "automation",
      id: systemActorId,
    },
    evidenceAuthority: {
      class: "kernel",
      id: "survey-v2-evidence-authority",
      policy: {
        id: "survey-v2-evidence-policy",
        digest:
          authority.profile.spec.profileDigest,
      },
    },
    eventCommandAdmission: eventAdmission.verifier,
  });
  const admittedInitialization = eventAdmission.bind(coordinator);
  return Object.freeze({
    ...authority,
    coordinator,
    compiled,
    executables,
    identity,
    initialize(storeId, hostAuthority, dependencyResult) {
      const adapter = createSurveyInitializationAdapter(
        hostAuthority,
        {
          coordinator: {
            read(storeIdInput) {
              return coordinator.read(storeIdInput);
            },
            execute(storeIdInput, command) {
              return admittedInitialization.execute(
                storeIdInput,
                command,
              );
            },
          },
          identity: {
            machineStateDigest(input) {
              return identity.machineStateDigest(input);
            },
          },
          storeId,
        },
      );
      return adapter.advance(
        adapter.initialState,
        dependencyResult,
      );
    },
  });
}

export async function nextSurveyAuthoringTask(
  runtime,
  storeId,
) {
  return runtime.coordinator.execute(
    storeId,
    { class: "next", inputs: {} },
  );
}

export async function readSurveyAuthoringState(
  runtime,
  storeId,
) {
  return runtime.coordinator.read(storeId);
}

export function createSurveyTextSubmission({
  runtime,
  pending,
  submittedBytes,
  producerProvenance,
}) {
  if (pending?.kind !== "assignment") {
    const error = new Error(
      "one pending authoring Assignment is required",
    );
    error.code = "SURVEY_ASSIGNMENT_REQUIRED";
    throw error;
  }
  const {
    projectionBinding,
    formDefinition,
  } = assignmentBindings(runtime, pending);
  return createTextSubmission({
    name: `survey-submission-${pending.assignment.spec.handle}`,
    request: pending.request,
    contextClosure: pending.contextClosure,
    assignment: pending.assignment,
    projectionArtifact: pending.projectionArtifact,
    projectionBinding,
    formDefinition,
    submittedBytes,
    producerProvenance,
    renderProjection: projectionRenderer(
      runtime,
      projectionBinding,
    ),
  });
}

export async function submitSurveyAuthoringTask({
  runtime,
  storeId,
  pending,
  submission,
}) {
  return runtime.coordinator.execute(storeId, {
    class: "submit",
    request: pending.request,
    assignment: pending.assignment,
    submission,
    externalCouplings: [],
  });
}
