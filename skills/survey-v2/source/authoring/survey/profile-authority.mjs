import { readFile } from "node:fs/promises";
import { validateById } from "../../../generated/validators.mjs";
import {
  canonicalize,
  sha256Bytes,
  sha256Value,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  contextSelectorDigest,
  formDefinitionDigest,
  profileManifestDigest,
  resourceReferenceFrom,
  resourceSemanticDigest,
} from "../kernel/digests.mjs";
import {
  validateContractSemantics,
  validateTransactionClosureSemantics,
} from "../kernel/contract-semantics.mjs";
import {
  SURVEY_AUTHORING_PROTOCOL_NAME,
  validateSurveyAuthoringProtocol,
} from "./protocol-semantics.mjs";
import {
  createSurveyFrameFormDefinition,
} from "./survey-frame-authority.mjs";
import {
  createRoundOneFrameFormDefinition,
} from "./round-one-frame-authority.mjs";
import {
  createRoundOneQuestionFramesFormDefinition,
} from "./round-one-question-frames-authority.mjs";

export const SURVEY_PROFILE_NAME = "survey-v2-authoring-profile";
export const SURVEY_EXECUTION_CLOSURE_ID =
  "r11-round-one-question-frame-set";
export const SURVEY_GENERATION_SIDECAR_BINDING_ID =
  "survey-generation-record-sidecar";
export const SURVEY_EVENT_COMMAND_ADMISSION_ID =
  "survey-initialization-event-port";

const zeroDigest = `sha256:${"0".repeat(64)}`;
const profileSchemaId =
  "urn:mission-kit:authoring:schema:authoring-profile-manifest:v1alpha1";
const packageRoot = new URL("../../../", import.meta.url);
const protocolUrl = new URL(
  "source/protocol/survey-v2.protocol.json",
  packageRoot,
);
const executableUrl = new URL("./profile-executables.mjs", import.meta.url);
const kernelMembers = Object.freeze([
  "assignment-dag.mjs",
  "canonical.mjs",
  "context-resolver.mjs",
  "contract-semantics.mjs",
  "digests.mjs",
  "executable-registry.mjs",
  "limits.mjs",
  "manifest-reducer.mjs",
  "manifest-selection.mjs",
  "mutation-planner.mjs",
  "reducer-results.mjs",
  "request-planner.mjs",
  "resource-resolution.mjs",
  "text-forms.mjs",
]);
const executableClosureMembers = Object.freeze([
  "../../../generated/validators.mjs",
  "../kernel/contract-semantics.mjs",
  "../kernel/executable-registry.mjs",
  "../kernel/text-forms.mjs",
  "./generation-record.mjs",
  "./profile-executables.mjs",
  "./resource-semantics.mjs",
  "./round-one-frame-authority.mjs",
  "./round-one-frame-projector.mjs",
  "./round-one-question-frames-authority.mjs",
  "./round-one-question-frames-projector.mjs",
  "./survey-frame-authority.mjs",
  "./survey-frame-projection-admission.mjs",
  "./survey-frame-projector.mjs",
  "../../../dependencies/shared-schemas/v1/snapshot/context-frame/v1alpha1/context-frame.validator.mjs",
]);

const concreteTypes = Object.freeze({
  authoringSubmission: Object.freeze({
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringSubmission",
  }),
  survey: Object.freeze({
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "Survey",
  }),
  surveyRound: Object.freeze({
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyRound",
  }),
  contextFrame: Object.freeze({
    apiVersion: "schemas.mission-kit/v1alpha1",
    kind: "ContextFrame",
  }),
  generationRecord: Object.freeze({
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "GenerationRecord",
  }),
  questionFrameSet: Object.freeze({
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "QuestionFrameSet",
  }),
});

const schemaSources = Object.freeze({
  authoringSubmission:
    "schemas/authoring/v1alpha1/authoring-submission.schema.json",
  survey: "schemas/survey/v1alpha1/survey.schema.json",
  surveyRound: "schemas/survey/v1alpha1/survey-round.schema.json",
  contextFrame:
    "dependencies/shared-schemas/v1/snapshot/context-frame/v1alpha1/context-frame.schema.json",
  generationRecord:
    "schemas/survey/v1alpha1/generation-record.schema.json",
  questionFrameSet:
    "schemas/survey/v1alpha1/question-frame-set.schema.json",
});

const futureTaskTargets = Object.freeze({
  "author-round-1-frame-set": [
    "round-1-question-frame-set",
    "QuestionFrameSet",
    "survey.mission-kit/v1alpha1",
  ],
  "author-round-1-questions": [
    "round-1-instrument",
    "RoundInstrument",
    "survey.mission-kit/v1alpha1",
  ],
  "author-round-1-interpretation": [
    "round-1-interpretation",
    "RoundInterpretation",
    "survey.mission-kit/v1alpha1",
  ],
  "author-round-2-frame": ["round-2-frame", "ContextFrame", "schemas.mission-kit/v1alpha1"],
  "author-round-2-frame-set": [
    "round-2-question-frame-set",
    "QuestionFrameSet",
    "survey.mission-kit/v1alpha1",
  ],
  "author-round-2-questions": [
    "round-2-instrument",
    "RoundInstrument",
    "survey.mission-kit/v1alpha1",
  ],
  "author-round-2-interpretation": [
    "round-2-interpretation",
    "RoundInterpretation",
    "survey.mission-kit/v1alpha1",
  ],
  "author-composite": [
    "composite-candidate",
    "EnvelopeModel",
    "survey.mission-kit/v1",
  ],
});

function freezeValue(value) {
  if (
    value !== null &&
    typeof value === "object" &&
    !Object.isFrozen(value)
  ) {
    for (const child of Object.values(value)) freezeValue(child);
    Object.freeze(value);
  }
  return value;
}

function target(slot, resourceType, minimum = 1, maximum = 1) {
  return {
    slot,
    resourceType: stableValue(resourceType),
    cardinality: { min: minimum, max: maximum },
  };
}

function futureTarget(taskId) {
  const [slot, kind, apiVersion] = futureTaskTargets[taskId];
  return target(slot, { apiVersion, kind });
}

function executableBinding(id, closureDigest) {
  return {
    id,
    digest: sha256Value({
      domain: "mission-kit:survey-v2:profile-executable-binding/v1",
      id,
      closureDigest,
    }),
  };
}

function schemaExecutableBinding(id, schemaDigest, closureDigest) {
  return {
    id,
    digest: sha256Value({
      domain: "mission-kit:survey-v2:profile-schema-executable-binding/v1",
      id,
      schemaDigest,
      closureDigest,
    }),
  };
}

function form(name) {
  const result = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringFormDefinition",
    metadata: { name },
    spec: {
      formDigest: zeroDigest,
      grammarVersion: "mission-kit-authoring-text/v1",
      title: "Unavailable Survey authoring stage",
      introduction:
        "This canonical task is declared but cannot execute in the active profile closure.",
      fields: [{
        id: "unavailable",
        ordinal: 1,
        heading: "Unavailable",
        instruction: "This field is never issued while the stage is closed.",
        type: "paragraph",
        required: true,
        placeholder: "Unavailable",
        constraints: { minLength: 1, maxLength: 80 },
      }],
    },
  };
  result.spec.formDigest = formDefinitionDigest(result);
  return result;
}

function projection(id, fields) {
  return {
    id,
    digest: sha256Value({
      domain: "mission-kit:survey-v2:context-projection-definition/v1",
      id,
      fields,
    }),
    fields,
  };
}

function selector({
  id,
  ordinal,
  role,
  resourceType,
  slot,
  fields,
}) {
  const result = {
    id,
    selectorDigest: zeroDigest,
    ordinal,
    role,
    resourceType: stableValue(resourceType),
    cardinality: { min: 1, max: 1 },
    requiredLifecycleState: "frozen",
    lifecycleRule: { mode: "workspace-resource-version" },
    selection: { mode: "active-head", slot },
    projection: projection(`${id}-projection`, fields),
  };
  result.selectorDigest = contextSelectorDigest(result);
  return result;
}

function eventSelector({
  id,
  ordinal,
  role,
  resourceType,
  slot,
  fields,
}) {
  return selector({
    id,
    ordinal,
    role,
    resourceType,
    slot,
    fields,
  });
}

function surveyFrameSelectors() {
  return [
    selector({
      id: "survey-frame-intake",
      ordinal: 1,
      role: "intake",
      resourceType: {
        apiVersion: "authoring.mission-kit/v1alpha1",
        kind: "SourceSnapshot",
      },
      slot: "intake",
      fields: ["/spec/inventory"],
    }),
    selector({
      id: "survey-frame-policy",
      ordinal: 2,
      role: "policy",
      resourceType: {
        apiVersion: "survey.mission-kit/v1alpha1",
        kind: "SurveyPolicySnapshot",
      },
      slot: "policy",
      fields: ["/spec"],
    }),
  ];
}

function roundOneFrameSelectors() {
  return [
    selector({
      id: "round-one-survey-frame",
      ordinal: 1,
      role: "survey-frame",
      resourceType: concreteTypes.contextFrame,
      slot: "survey-frame",
      fields: ["/spec"],
    }),
    selector({
      id: "round-one-survey",
      ordinal: 2,
      role: "survey",
      resourceType: concreteTypes.survey,
      slot: "survey",
      fields: ["/spec/outcomeAxes"],
    }),
  ];
}

function roundOneQuestionFrameSelectors() {
  return [
    selector({
      id: "round-one-question-survey-frame",
      ordinal: 1,
      role: "survey-frame",
      resourceType: concreteTypes.contextFrame,
      slot: "survey-frame",
      fields: ["/spec"],
    }),
    selector({
      id: "round-one-question-round-frame",
      ordinal: 2,
      role: "round-frame",
      resourceType: concreteTypes.contextFrame,
      slot: "round-1-frame",
      fields: ["/spec"],
    }),
    selector({
      id: "round-one-question-survey",
      ordinal: 3,
      role: "survey",
      resourceType: concreteTypes.survey,
      slot: "survey",
      fields: ["/spec/outcomeAxes"],
    }),
  ];
}

function initializationSelectors() {
  return [
    eventSelector({
      id: "begin-authoring-intake",
      ordinal: 1,
      role: "intake",
      resourceType: {
        apiVersion: "authoring.mission-kit/v1alpha1",
        kind: "SourceSnapshot",
      },
      slot: "intake",
      fields: ["/spec/inventory"],
    }),
    eventSelector({
      id: "begin-authoring-policy",
      ordinal: 2,
      role: "policy",
      resourceType: {
        apiVersion: "survey.mission-kit/v1alpha1",
        kind: "SurveyPolicySnapshot",
      },
      slot: "policy",
      fields: ["/spec"],
    }),
  ];
}

function validatorSet(id, member) {
  return {
    id,
    digest: sha256Value({
      domain: "mission-kit:survey-v2:validator-set/v1",
      id,
      members: [member],
    }),
    members: [stableValue(member)],
  };
}

function schemaBinding(id, resourceType, schema, semanticValidator) {
  return {
    id,
    resourceType: stableValue(resourceType),
    schema: stableValue(schema),
    semanticValidator: stableValue(semanticValidator),
  };
}

function authority(transitionId, implemented) {
  const id = transitionId.toLowerCase();
  return {
    class: implemented ? "survey-profile" : "future-placeholder",
    id: `survey-${id}-authority`,
    policy: {
      id: `survey-${id}-policy`,
      digest: sha256Value({
        domain: "mission-kit:survey-v2:transition-policy/v1",
        transitionId,
        implemented,
      }),
    },
  };
}

function couplingMap(source) {
  return new Map(
    source.authoringCouplings.map((coupling) => [
      coupling.authoringTransitionId,
      {
        machineId: "phase",
        transitionId: coupling.phaseTransitionId,
      },
    ]),
  );
}

/**
 * Mechanically adapt the canonical legacy phase machine into the neutral
 * AuthoringProtocol shape used solely to verify external coupled edges.
 * Direct transition identity/from/event/to is preserved. The TF01 abort
 * family is represented as its exact canonical source-set transition.
 */
function phaseAuthoringProtocol(phaseMachine) {
  const selectors = new Map(
    phaseMachine.selectors.map((entry) => [entry.id, entry]),
  );
  const guardId = (id) => `phase-${id.toLowerCase()}`;
  const direct = phaseMachine.transitions.map((transition) => ({
    id: transition.id,
    source: { mode: "single", stateId: transition.from },
    eventId: transition.event,
    toState: transition.to,
    guardIds: [guardId(transition.guard)],
  }));
  const abortFamily = phaseMachine.families.find(
    (family) => family.id === "TF01",
  );
  const abortSelector = selectors.get(abortFamily?.fromSelector);
  if (abortFamily === undefined || abortSelector === undefined) {
    throw new Error(
      "canonical phase machine lacks the exact TF01 abort family",
    );
  }
  const protocol = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringProtocol",
    metadata: { name: "survey-v2-phase-authoring-adapter" },
    spec: {
      initialState: phaseMachine.initial,
      states: phaseMachine.states.map((state) => ({
        id: state.id,
        label: state.label,
        class: state.terminal ? "terminal" : "wait",
      })),
      events: phaseMachine.events.map((event) => stableValue(event)),
      guards: phaseMachine.guards.map((guard) => ({
        id: guardId(guard.id),
        description: guard.description,
      })),
      transitions: [
        ...direct,
        {
          id: abortFamily.id,
          source: {
            mode: "set",
            stateIds: [...abortSelector.members].sort(),
          },
          eventId: abortFamily.event,
          toState: abortFamily.to,
          guardIds: [guardId(abortFamily.guard)],
        },
      ],
    },
  };
  const issues = validateContractSemantics(protocol);
  if (issues.length > 0) {
    throw new Error(
      `canonical phase adapter is invalid: ${issues[0].code}`,
    );
  }
  return stableValue(protocol);
}

function mutationFootprint(transition, coupling, implemented) {
  if (transition.id === "AT02") {
    return {
      created: [
        target("survey-frame", concreteTypes.contextFrame),
        target("survey", concreteTypes.survey),
      ],
      activeHeadSlots: ["survey-frame", "survey"],
      supersededSlots: [],
      dependencyRelations: ["derived-from", "governed-by", "frames"],
      handoffSlots: [],
      nextState: transition.toState,
    };
  }
  if (transition.id === "AT03") {
    return {
      created: [
        target("round-1-frame", concreteTypes.contextFrame),
        target("round-1", concreteTypes.surveyRound),
      ],
      activeHeadSlots: ["round-1-frame", "round-1"],
      supersededSlots: [],
      dependencyRelations: [
        "belongs-to",
        "derived-from",
        "frames",
        "parent-frame",
      ],
      handoffSlots: [],
      nextState: transition.toState,
    };
  }
  if (transition.id === "AT04") {
    return {
      created: [
        target("round-1-question-frame-1", concreteTypes.contextFrame),
        target("round-1-question-frame-2", concreteTypes.contextFrame),
        target("round-1-question-frame-3", concreteTypes.contextFrame),
        target(
          "round-1-question-frame-set",
          concreteTypes.questionFrameSet,
        ),
      ],
      activeHeadSlots: [
        "round-1-question-frame-1",
        "round-1-question-frame-2",
        "round-1-question-frame-3",
        "round-1-question-frame-set",
      ],
      supersededSlots: [],
      dependencyRelations: [
        "belongs-to",
        "derived-from",
        "frames",
        "parent-frame",
      ],
      handoffSlots: [],
      nextState: transition.toState,
    };
  }
  return {
    created: [],
    activeHeadSlots: [],
    supersededSlots: [],
    dependencyRelations: [],
    handoffSlots: [],
    nextState: transition.toState,
    ...(coupling === undefined
      ? {}
      : { externalCouplings: [stableValue(coupling)] }),
  };
}

function transitionBindings({
  protocol,
  source,
  handlerBindingIds,
}) {
  const states = new Map(
    protocol.spec.states.map((state) => [state.id, state]),
  );
  const couplings = couplingMap(source);
  return protocol.spec.transitions.map((transition) => {
    const sourceIds = transition.source.mode === "single"
      ? [transition.source.stateId]
      : transition.source.stateIds;
    const taskState = sourceIds.length === 1
      ? states.get(sourceIds[0])
      : undefined;
    const isTask = taskState?.class === "task";
    const implemented = transition.id === "AT01" ||
      transition.id === "AT02" ||
      transition.id === "AT03" ||
      transition.id === "AT04";
    return {
      transitionId: transition.id,
      triggerClass: isTask ? "task-submission" : "event",
      ...(isTask
        ? { taskId: taskState.taskId }
        : {
          inputSelectors:
            transition.id === "AT01" ? initializationSelectors() : [],
        }),
      handlerBindingId: handlerBindingIds.get(transition.id),
      authority: authority(transition.id, implemented),
      mutationFootprint: mutationFootprint(
        transition,
        couplings.get(transition.id),
        implemented,
      ),
      ...(isTask
        ? {
          commitSidecarBindingIds: [
            SURVEY_GENERATION_SIDECAR_BINDING_ID,
          ],
        }
        : {}),
    };
  });
}

function buildBindings({
  protocol,
  executableClosureDigest,
  schemaDigests,
  textFormsDigest,
}) {
  const guards = Object.fromEntries(
    protocol.spec.guards.map(({ id }) => [
      id,
      executableBinding(`survey-guard-${id}`, executableClosureDigest),
    ]),
  );
  const handlers = Object.fromEntries(
    protocol.spec.transitions.map(({ id }) => [
      id,
      executableBinding(
        `survey-${id.toLowerCase()}-handler`,
        executableClosureDigest,
      ),
    ]),
  );
  const validators = {
    authoringSubmissionSchema: schemaExecutableBinding(
      "authoring-submission-schema-validator",
      schemaDigests.authoringSubmission,
      executableClosureDigest,
    ),
    authoringSubmissionSemantics: executableBinding(
      "authoring-submission-semantic-validator",
      executableClosureDigest,
    ),
    surveySchema: schemaExecutableBinding(
      "survey-schema-validator",
      schemaDigests.survey,
      executableClosureDigest,
    ),
    surveySemantics: executableBinding(
      "survey-semantic-validator",
      executableClosureDigest,
    ),
    surveyRoundSchema: schemaExecutableBinding(
      "survey-round-schema-validator",
      schemaDigests.surveyRound,
      executableClosureDigest,
    ),
    surveyRoundSemantics: executableBinding(
      "survey-round-semantic-validator",
      executableClosureDigest,
    ),
    contextFrameSchema: schemaExecutableBinding(
      "context-frame-schema-validator",
      schemaDigests.contextFrame,
      executableClosureDigest,
    ),
    contextFrameSemantics: executableBinding(
      "context-frame-semantic-validator",
      executableClosureDigest,
    ),
    generationRecordSchema: schemaExecutableBinding(
      "generation-record-schema-validator",
      schemaDigests.generationRecord,
      executableClosureDigest,
    ),
    generationRecordSemantics: executableBinding(
      "generation-record-semantic-validator",
      executableClosureDigest,
    ),
    questionFrameSetSchema: schemaExecutableBinding(
      "question-frame-set-schema-validator",
      schemaDigests.questionFrameSet,
      executableClosureDigest,
    ),
    questionFrameSetSemantics: executableBinding(
      "question-frame-set-semantic-validator",
      executableClosureDigest,
    ),
  };
  return stableValue({
    guards,
    handlers,
    validators,
    projectors: {
      surveyFrame: executableBinding(
        "survey-frame-operational-projector",
        executableClosureDigest,
      ),
      roundOneFrame: executableBinding(
        "round-one-frame-operational-projector",
        executableClosureDigest,
      ),
      roundOneQuestionFrames: executableBinding(
        "round-one-question-frames-operational-projector",
        executableClosureDigest,
      ),
      future: executableBinding(
        "survey-future-fail-closed-projector",
        executableClosureDigest,
      ),
    },
    sidecars: {
      generationRecord: executableBinding(
        "survey-generation-record-sidecar",
        executableClosureDigest,
      ),
    },
    renderer: executableBinding(
      "survey-text-form-renderer",
      textFormsDigest,
    ),
    parser: executableBinding(
      "survey-text-form-parser",
      textFormsDigest,
    ),
  });
}

async function digestMembers(members) {
  const records = await Promise.all(members.map(async (member) => ({
    path: member,
    digest: sha256Bytes(await readFile(new URL(member, import.meta.url))),
  })));
  return sha256Value({
    domain: "mission-kit:survey-v2:executable-closure/v1",
    members: records,
  });
}

async function kernelBinding() {
  const members = await Promise.all(kernelMembers.map(async (name) => ({
    path: `source/authoring/kernel/${name}`,
    digest: sha256Bytes(await readFile(
      new URL(`../kernel/${name}`, import.meta.url),
    )),
  })));
  return {
    id: "authoring-kernel",
    digest: sha256Value({
      domain: "mission-kit:authoring:kernel-closure/v1",
      members,
    }),
  };
}

function canonicalProtocol(source) {
  const matches = source.machines.filter(
    (machine) =>
      machine.id === "authoring" &&
      machine.protocol?.metadata?.name === SURVEY_AUTHORING_PROTOCOL_NAME,
  );
  if (matches.length !== 1) {
    throw new Error(
      "canonical Survey protocol must contain exactly one survey-v2-authoring resource",
    );
  }
  const protocol = stableValue(matches[0].protocol);
  if (
    canonicalize(matches[0].reference) !==
      canonicalize(resourceReferenceFrom(protocol))
  ) {
    throw new Error(
      "embedded Survey AuthoringProtocol differs from its exact source reference",
    );
  }
  const issues = validateSurveyAuthoringProtocol(protocol);
  if (issues.length > 0) {
    throw new Error(
      `canonical Survey AuthoringProtocol is invalid: ${issues[0].code}`,
    );
  }
  return protocol;
}

function buildTasks({
  protocol,
  handlerBindingIds,
}) {
  const surveySelectors = surveyFrameSelectors();
  const roundOneSelectors = roundOneFrameSelectors();
  const questionFrameSelectors = roundOneQuestionFrameSelectors();
  return protocol.spec.states
    .filter((state) => state.class === "task")
    .map((state) => {
      const surveyFrame = state.taskId === "author-survey-frame";
      const roundOneFrame =
        state.taskId === "author-round-1-frame";
      const roundOneQuestionFrames =
        state.taskId === "author-round-1-frame-set";
      return {
        id: state.taskId,
        stateId: state.id,
        target: surveyFrame
          ? target("survey-frame", concreteTypes.contextFrame)
          : roundOneFrame
            ? target("round-1-frame", concreteTypes.contextFrame)
            : roundOneQuestionFrames
              ? target(
                "round-1-question-frame-set",
                concreteTypes.questionFrameSet,
              )
            : futureTarget(state.taskId),
        contextSelectors: surveyFrame
          ? surveySelectors
          : roundOneFrame
            ? roundOneSelectors
            : roundOneQuestionFrames
              ? questionFrameSelectors
            : [],
        ...(surveyFrame
          ? {
            requestInputBindings: [
              {
                inputKey: "intake",
                selectorId: "survey-frame-intake",
              },
              {
                inputKey: "policy",
                selectorId: "survey-frame-policy",
              },
              ],
            }
            : roundOneFrame
            ? {
              requestInputBindings: [
                {
                  inputKey: "survey-frame",
                  selectorId: "round-one-survey-frame",
                },
                {
                  inputKey: "survey",
                  selectorId: "round-one-survey",
                },
              ],
            }
            : roundOneQuestionFrames
            ? {
              requestInputBindings: [
                {
                  inputKey: "survey-frame",
                  selectorId: "round-one-question-survey-frame",
                },
                {
                  inputKey: "round-frame",
                  selectorId: "round-one-question-round-frame",
                },
                {
                  inputKey: "survey",
                  selectorId: "round-one-question-survey",
                },
              ],
            }
              : {}),
        submissionSchemaBindingId:
          "authoring-submission-schema-binding",
        formBindingId: surveyFrame
          ? "survey-frame-form-binding"
          : roundOneFrame
            ? "round-one-frame-form-binding"
            : roundOneQuestionFrames
              ? "round-one-question-frames-form-binding"
            : "survey-future-form-binding",
        handlerBindingId: handlerBindingIds.get(
          protocol.spec.transitions.find(
            (transition) =>
              transition.source.mode === "single" &&
              transition.source.stateId === state.id,
          ).id,
        ),
        projectionBindingId: surveyFrame
          ? "survey-frame-projection-binding"
          : roundOneFrame
            ? "round-one-frame-projection-binding"
            : roundOneQuestionFrames
              ? "round-one-question-frames-projection-binding"
            : "survey-future-projection-binding",
        validatorSetId: "authoring-submission-validator-set",
      };
    });
}

function assertProfile(profile, protocol, phaseProtocol, forms) {
  const structural = validateById(profileSchemaId, profile);
  if (!structural.valid) {
    throw new Error(
      `constructed Survey profile is structurally invalid: ${structural.errors.join("; ")}`,
    );
  }
  const semanticIssues = validateContractSemantics(profile);
  if (semanticIssues.length > 0) {
    throw new Error(
      `constructed Survey profile is semantically invalid: ${semanticIssues[0].code}`,
    );
  }
  const graphIssues = validateTransactionClosureSemantics(
    [protocol, phaseProtocol, profile, ...forms],
    { roots: [profile] },
  );
  if (graphIssues.length > 0) {
    throw new Error(
      `constructed Survey profile graph is invalid: ${graphIssues[0].code} ${graphIssues[0].field} ${graphIssues[0].reason}`,
    );
  }
  if (profile.spec.profileDigest !== profileManifestDigest(profile)) {
    throw new Error("constructed Survey profile digest is unstable");
  }
}

let authorityPromise;

async function buildAuthority() {
  const [
    protocolBytes,
    executableBytes,
    executableClosureDigest,
    kernel,
    schemaEntries,
    textFormsBytes,
  ] = await Promise.all([
    readFile(protocolUrl),
    readFile(executableUrl),
    digestMembers(executableClosureMembers),
    kernelBinding(),
    Promise.all(Object.entries(schemaSources).map(
      async ([id, relativePath]) => [
        id,
        sha256Bytes(await readFile(new URL(relativePath, packageRoot))),
      ],
    )),
    readFile(new URL("../kernel/text-forms.mjs", import.meta.url)),
  ]);
  const source = JSON.parse(protocolBytes.toString("utf8"));
  const protocol = canonicalProtocol(source);
  const schemaDigests = Object.fromEntries(schemaEntries);
  const bindings = buildBindings({
    protocol,
    executableClosureDigest: sha256Value({
      domain: "mission-kit:survey-v2:profile-executable-module/v1",
      executableBytesDigest: sha256Bytes(executableBytes),
      dependencyClosureDigest: executableClosureDigest,
    }),
    schemaDigests,
    textFormsDigest: sha256Bytes(textFormsBytes),
  });
  const surveyFrameForm = createSurveyFrameFormDefinition();
  const roundOneFrameForm = createRoundOneFrameFormDefinition();
  const roundOneQuestionFramesForm =
    createRoundOneQuestionFramesFormDefinition();
  const futureForm = form("survey-future-unavailable-form");
  const forms = [
    surveyFrameForm,
    roundOneFrameForm,
    roundOneQuestionFramesForm,
    futureForm,
  ];
  const handlerBindings = protocol.spec.transitions.map(
    (transition) => ({
      id: `${transition.id.toLowerCase()}-handler-binding`,
      handler: bindings.handlers[transition.id],
    }),
  );
  const handlerBindingIds = new Map(
    protocol.spec.transitions.map((transition) => [
      transition.id,
      `${transition.id.toLowerCase()}-handler-binding`,
    ]),
  );
  const validatorSets = [
    validatorSet(
      "authoring-submission-validator-set",
      bindings.validators.authoringSubmissionSemantics,
    ),
    validatorSet(
      "survey-validator-set",
      bindings.validators.surveySemantics,
    ),
    validatorSet(
      "survey-round-validator-set",
      bindings.validators.surveyRoundSemantics,
    ),
    validatorSet(
      "context-frame-validator-set",
      bindings.validators.contextFrameSemantics,
    ),
    validatorSet(
      "generation-record-validator-set",
      bindings.validators.generationRecordSemantics,
    ),
    validatorSet(
      "question-frame-set-validator-set",
      bindings.validators.questionFrameSetSemantics,
    ),
  ];
  const phaseMachine = source.machines.find(
    (machine) => machine.id === "phase",
  );
  if (phaseMachine === undefined) {
    throw new Error("canonical Survey protocol lacks its phase machine");
  }
  const phaseProtocol = phaseAuthoringProtocol(phaseMachine);
  const profile = {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "AuthoringProfileManifest",
    metadata: { name: SURVEY_PROFILE_NAME },
    spec: {
      profileDigest: zeroDigest,
      kernel,
      protocol: resourceReferenceFrom(protocol),
      schemaBindings: [
        schemaBinding(
          "authoring-submission-schema-binding",
          concreteTypes.authoringSubmission,
          bindings.validators.authoringSubmissionSchema,
          bindings.validators.authoringSubmissionSemantics,
        ),
        schemaBinding(
          "survey-schema-binding",
          concreteTypes.survey,
          bindings.validators.surveySchema,
          bindings.validators.surveySemantics,
        ),
        schemaBinding(
          "survey-round-schema-binding",
          concreteTypes.surveyRound,
          bindings.validators.surveyRoundSchema,
          bindings.validators.surveyRoundSemantics,
        ),
        schemaBinding(
          "context-frame-schema-binding",
          concreteTypes.contextFrame,
          bindings.validators.contextFrameSchema,
          bindings.validators.contextFrameSemantics,
        ),
        schemaBinding(
          "generation-record-schema-binding",
          concreteTypes.generationRecord,
          bindings.validators.generationRecordSchema,
          bindings.validators.generationRecordSemantics,
        ),
        schemaBinding(
          "question-frame-set-schema-binding",
          concreteTypes.questionFrameSet,
          bindings.validators.questionFrameSetSchema,
          bindings.validators.questionFrameSetSemantics,
        ),
      ],
      formBindings: [
        {
          id: "survey-frame-form-binding",
          definition: resourceReferenceFrom(surveyFrameForm),
          formDigest: surveyFrameForm.spec.formDigest,
          renderer: bindings.renderer,
          parser: bindings.parser,
        },
        {
          id: "round-one-frame-form-binding",
          definition: resourceReferenceFrom(roundOneFrameForm),
          formDigest: roundOneFrameForm.spec.formDigest,
          renderer: bindings.renderer,
          parser: bindings.parser,
        },
        {
          id: "round-one-question-frames-form-binding",
          definition: resourceReferenceFrom(
            roundOneQuestionFramesForm,
          ),
          formDigest:
            roundOneQuestionFramesForm.spec.formDigest,
          renderer: bindings.renderer,
          parser: bindings.parser,
        },
        {
          id: "survey-future-form-binding",
          definition: resourceReferenceFrom(futureForm),
          formDigest: futureForm.spec.formDigest,
          renderer: bindings.renderer,
          parser: bindings.parser,
        },
      ],
      handlerBindings,
      guardBindings: protocol.spec.guards.map(({ id }) => ({
        guardId: id,
        handler: bindings.guards[id],
      })),
      projectionBindings: [
        {
          id: "survey-frame-projection-binding",
          definitionDigest: sha256Value({
            domain: "mission-kit:survey-v2:survey-frame-projection/v1",
            format: "mission-kit-authoring-text/v1",
          }),
          engine: bindings.projectors.surveyFrame,
        },
        {
          id: "round-one-frame-projection-binding",
          definitionDigest: sha256Value({
            domain: "mission-kit:survey-v2:round-one-frame-projection/v1",
            format: "mission-kit-authoring-text/v1",
          }),
          engine: bindings.projectors.roundOneFrame,
        },
        {
          id: "round-one-question-frames-projection-binding",
          definitionDigest: sha256Value({
            domain:
              "mission-kit:survey-v2:round-one-question-frames-projection/v1",
            format: "mission-kit-authoring-text/v1",
          }),
          engine: bindings.projectors.roundOneQuestionFrames,
        },
        {
          id: "survey-future-projection-binding",
          definitionDigest: sha256Value({
            domain: "mission-kit:survey-v2:future-projection/v1",
            status: "fail-closed",
          }),
          engine: bindings.projectors.future,
        },
      ],
      validatorSets,
      machineBindings: [{
        machineId: "phase",
        protocol: {
          id: phaseProtocol.metadata.name,
          digest: resourceSemanticDigest(phaseProtocol),
        },
      }],
      tasks: buildTasks({ protocol, handlerBindingIds }),
      transitionBindings: transitionBindings({
        protocol,
        source,
        handlerBindingIds,
      }),
      revisionUnits: [],
      commitSidecarBindings: [{
        id: SURVEY_GENERATION_SIDECAR_BINDING_ID,
        executable: bindings.sidecars.generationRecord,
        targets: [{
          resourceType: stableValue(concreteTypes.generationRecord),
          cardinality: { min: 1, max: 1 },
        }],
      }],
      eventCommandAdmission: {
        id: SURVEY_EVENT_COMMAND_ADMISSION_ID,
        digest: sha256Value({
          domain:
            "mission-kit:survey-v2:event-command-admission/v1",
          id: SURVEY_EVENT_COMMAND_ADMISSION_ID,
          mode: "one-shot-host-capability",
        }),
      },
      executionClosure: {
        id: SURVEY_EXECUTION_CLOSURE_ID,
        transitionIds: ["AT01", "AT02", "AT03", "AT04"],
        revisionPlanIds: [],
      },
    },
  };
  profile.spec.profileDigest = profileManifestDigest(profile);
  assertProfile(profile, protocol, phaseProtocol, forms);
  return freezeValue(stableValue({
    bindings,
    forms,
    phaseProtocol,
    profile,
    protocol,
    resources: [protocol, phaseProtocol, ...forms],
    sourceDigest: sha256Bytes(protocolBytes),
    schemaId: profileSchemaId,
  }));
}

/**
 * Load the exact canonical Survey AuthoringProtocol and its complete,
 * digest-pinned R10 profile. Every call returns a detached immutable value.
 */
export async function loadSurveyProfileAuthority() {
  authorityPromise ??= buildAuthority();
  return freezeValue(stableValue(await authorityPromise));
}

/**
 * Explicit host-facing identity for the post-commit GenerationRecord sidecar.
 * The same values are present in the profile; this projection prevents a host
 * from hand-authoring binding names.
 */
export function surveyGenerationSidecarAugmentation(authority) {
  const profile = authority?.profile;
  const sidecar = profile?.spec?.commitSidecarBindings?.find(
    (binding) => binding.id === SURVEY_GENERATION_SIDECAR_BINDING_ID,
  );
  if (
    sidecar === undefined ||
    profile.spec.profileDigest !== profileManifestDigest(profile)
  ) {
    throw new TypeError(
      "GenerationRecord sidecar augmentation requires the exact Survey profile authority",
    );
  }
  return freezeValue(stableValue({
    profile: {
      name: profile.metadata.name,
      digest: profile.spec.profileDigest,
    },
    binding: sidecar,
    transitionIds: profile.spec.transitionBindings
      .filter((transition) =>
        transition.triggerClass === "task-submission")
      .map((transition) => transition.transitionId),
  }));
}
