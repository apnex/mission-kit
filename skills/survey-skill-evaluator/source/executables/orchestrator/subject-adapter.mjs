import {
  canonicalize,
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import {
  IntegrityError,
  ValidationError,
} from "../engine/errors.mjs";
import {
  HASH_PROFILE_ID,
} from "../engine/hash.mjs";
import { stageCapturedCandidate } from "./candidate-capture.mjs";
import {
  surveySubjectAdapterDescriptor,
  verifySurveySubjectAdapterDescriptor,
} from "./subject-adapter-contract.mjs";

export {
  SURVEY_SUBJECT_ADAPTER_INTERFACE_VERSION,
  surveySubjectAdapterDescriptor,
  verifySurveySubjectAdapterDescriptor,
} from "./subject-adapter-contract.mjs";

const DIGEST = /^[a-f0-9]{64}$/u;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u;
const TERMINAL_CLASSES = new Set([
  "nonterminal",
  "completed",
  "aborted",
  "failed",
  "quarantined",
]);

function assertPlainObject(value, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  ) {
    throw new ValidationError(`${label} must be a plain object`);
  }
}

function assertExactKeys(value, expected, label) {
  assertPlainObject(value, label);
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (canonicalize(actual) !== canonicalize(required)) {
    throw new ValidationError(`${label} has an unauthorized field set`, {
      expected: required,
      actual,
    });
  }
}

function assertIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    throw new ValidationError(`${label} must be an identifier`);
  }
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !DIGEST.test(value)) {
    throw new ValidationError(`${label} must be a lowercase SHA-256 digest`);
  }
}

function assertString(value, label) {
  if (typeof value !== "string" || value.length === 0) {
    throw new ValidationError(`${label} must be a non-empty string`);
  }
}

function assertCanonicalObject(value, label) {
  assertPlainObject(value, label);
  return deepCloneCanonical(value);
}

function validateObservation(value, descriptor, expectedSessionRef = null) {
  assertExactKeys(
    value,
    [
      "schemaVersion",
      "hashProfileId",
      "adapterId",
      "adapterInterfaceVersion",
      "sessionRef",
      "phase",
      "revision",
      "subjectStateRoot",
      "eventRoots",
      "terminalClass",
      "directorView",
      "envelopeRef",
    ],
    "Survey subject observation",
  );
  if (
    value.schemaVersion !== "1.0.0" ||
    value.hashProfileId !== HASH_PROFILE_ID ||
    value.adapterId !== descriptor.adapterId ||
    value.adapterInterfaceVersion !== descriptor.adapterInterfaceVersion
  ) {
    throw new IntegrityError("Survey observation is bound to another adapter");
  }
  assertIdentifier(value.sessionRef, "session reference");
  if (expectedSessionRef !== null && value.sessionRef !== expectedSessionRef) {
    throw new IntegrityError("Survey observation changed session identity");
  }
  assertString(value.phase, "Survey phase");
  if (!Number.isSafeInteger(value.revision) || value.revision < 0) {
    throw new ValidationError("Survey observation revision is invalid");
  }
  assertDigest(value.subjectStateRoot, "subject state root");
  if (
    !Array.isArray(value.eventRoots) ||
    new Set(value.eventRoots).size !== value.eventRoots.length
  ) {
    throw new ValidationError("Survey observation event roots are invalid");
  }
  value.eventRoots.forEach((entry) => assertDigest(entry, "event root"));
  if (!TERMINAL_CLASSES.has(value.terminalClass)) {
    throw new ValidationError("Survey observation terminal class is invalid");
  }
  if (value.directorView !== null) {
    assertCanonicalObject(value.directorView, "Director view");
  }
  if (value.envelopeRef !== null) {
    assertDigest(value.envelopeRef, "envelope reference");
    if (value.terminalClass !== "completed") {
      throw new IntegrityError(
        "Only a completed Survey observation may expose an envelope",
      );
    }
  }
  return deepFreeze(deepCloneCanonical(value));
}

function validateInitializationRequest(value) {
  assertExactKeys(
    value,
    [
      "attemptId",
      "stagedSkillRoot",
      "publicScenario",
      "artifactDestination",
    ],
    "Survey initialization request",
  );
  assertIdentifier(value.attemptId, "attempt ID");
  assertString(value.stagedSkillRoot, "staged skill root");
  assertCanonicalObject(value.publicScenario, "public scenario");
  assertString(value.artifactDestination, "artifact destination");
}

function validateObserveRequest(value) {
  assertExactKeys(
    value,
    ["sessionRef"],
    "Survey observation request",
  );
  assertIdentifier(value.sessionRef, "session reference");
}

function validateActionRequest(value, descriptor) {
  assertExactKeys(
    value,
    [
      "sessionRef",
      "actionId",
      "expectedStateRoot",
      "directorAction",
    ],
    "Survey action request",
  );
  assertIdentifier(value.sessionRef, "session reference");
  assertIdentifier(value.actionId, "action ID");
  assertDigest(value.expectedStateRoot, "expected state root");
  assertExactKeys(
    value.directorAction,
    ["actionClass", "payload"],
    "Director action",
  );
  if (!descriptor.publicActionClasses.includes(
    value.directorAction.actionClass,
  )) {
    throw new ValidationError("Director action class is not public for adapter", {
      actionClass: value.directorAction.actionClass,
      adapterId: descriptor.adapterId,
    });
  }
  assertCanonicalObject(value.directorAction.payload, "Director action payload");
}

function validateActionReceipt(value, descriptor, request) {
  assertExactKeys(
    value,
    ["actionId", "accepted", "eventRoot", "observation"],
    "Survey action receipt",
  );
  if (
    value.actionId !== request.actionId ||
    typeof value.accepted !== "boolean"
  ) {
    throw new IntegrityError("Survey action receipt identity is invalid");
  }
  assertDigest(value.eventRoot, "action event root");
  const observation = validateObservation(
    value.observation,
    descriptor,
    request.sessionRef,
  );
  if (
    observation.eventRoots.length === 0 ||
    observation.eventRoots.at(-1) !== value.eventRoot
  ) {
    throw new IntegrityError(
      "Survey action receipt is not the terminal observed event",
    );
  }
  return deepFreeze({
    actionId: value.actionId,
    accepted: value.accepted,
    eventRoot: value.eventRoot,
    observation,
  });
}

function validateColdResumeRequest(value) {
  assertExactKeys(
    value,
    ["sessionRef", "expectedStateRoot"],
    "Survey cold-resume request",
  );
  assertIdentifier(value.sessionRef, "session reference");
  assertDigest(value.expectedStateRoot, "expected state root");
}

class SurveySubjectAdapter {
  #descriptor;
  #binding;

  constructor(descriptor, binding) {
    this.#descriptor = verifySurveySubjectAdapterDescriptor(descriptor);
    this.#binding = Object.freeze({ ...binding });
  }

  describe() {
    return this.#descriptor;
  }

  async stage(request) {
    assertExactKeys(
      request,
      ["candidateBundle", "attemptRoot"],
      "Survey stage request",
    );
    return stageCapturedCandidate({
      ...request,
      adapterDescriptor: this.#descriptor,
    });
  }

  async initialize(request) {
    const input = deepCloneCanonical(request);
    validateInitializationRequest(input);
    return validateObservation(
      await this.#binding.initialize(input),
      this.#descriptor,
    );
  }

  async observe(request) {
    const input = deepCloneCanonical(request);
    validateObserveRequest(input);
    return validateObservation(
      await this.#binding.observe(input),
      this.#descriptor,
      input.sessionRef,
    );
  }

  async action(request) {
    const input = deepCloneCanonical(request);
    validateActionRequest(input, this.#descriptor);
    return validateActionReceipt(
      await this.#binding.action(input),
      this.#descriptor,
      input,
    );
  }

  async coldResume(request) {
    const input = deepCloneCanonical(request);
    validateColdResumeRequest(input);
    const observation = validateObservation(
      await this.#binding.coldResume(input),
      this.#descriptor,
      input.sessionRef,
    );
    if (observation.subjectStateRoot !== input.expectedStateRoot) {
      throw new IntegrityError(
        "Cold resume did not rehydrate the exact requested Survey state",
      );
    }
    return observation;
  }
}

function assertBinding(binding, methodMap, label) {
  assertExactKeys(binding, Object.keys(methodMap), `${label} host binding`);
  for (const [publicName, privateName] of Object.entries(methodMap)) {
    if (typeof binding[publicName] !== "function") {
      throw new ValidationError(
        `${label} host binding is missing ${privateName}`,
      );
    }
  }
}

export function createSurveyV1SubjectAdapter(binding) {
  const methods = {
    initializeClassicSurvey: "initialize",
    inspectClassicSurvey: "observe",
    submitClassicDirectorAction: "action",
    rehydrateClassicSurvey: "coldResume",
  };
  assertBinding(binding, methods, "Survey v1");
  return new SurveySubjectAdapter(surveySubjectAdapterDescriptor("survey-v1"), {
    initialize: binding.initializeClassicSurvey,
    observe: binding.inspectClassicSurvey,
    action: binding.submitClassicDirectorAction,
    coldResume: binding.rehydrateClassicSurvey,
  });
}

export function createSurveyV2SubjectAdapter(binding) {
  const methods = {
    initializeProtocolSession: "initialize",
    queryProtocolSession: "observe",
    dispatchProtocolDirectorAction: "action",
    coldResumeProtocolSession: "coldResume",
  };
  assertBinding(binding, methods, "Survey v2");
  return new SurveySubjectAdapter(surveySubjectAdapterDescriptor("survey-v2"), {
    initialize: binding.initializeProtocolSession,
    observe: binding.queryProtocolSession,
    action: binding.dispatchProtocolDirectorAction,
    coldResume: binding.coldResumeProtocolSession,
  });
}
