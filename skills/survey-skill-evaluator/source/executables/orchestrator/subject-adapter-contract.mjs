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
  hashCanonical,
} from "../engine/hash.mjs";

export const SURVEY_SUBJECT_ADAPTER_INTERFACE_VERSION = "1.0.0";

const DIGEST = /^[a-f0-9]{64}$/u;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u;
const COMMON_CAPABILITIES = Object.freeze([
  "action",
  "cold-resume",
  "describe",
  "initialize",
  "observe",
  "stage",
]);

const PROFILE_CORES = Object.freeze({
  "survey-v1": Object.freeze({
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    adapterKind: "survey-subject",
    adapterId: "mission-kit-survey-v1",
    adapterInterfaceVersion: SURVEY_SUBJECT_ADAPTER_INTERFACE_VERSION,
    subjectProtocolId: "mission-kit/survey",
    subjectProtocolVersion: "1.0.0",
    skillIdentity: "survey",
    runtimeSemanticsAuthority: "supplied-host-binding",
    nativeRuntimeSemanticsClaimed: false,
    capabilities: COMMON_CAPABILITIES,
    publicActionClasses: Object.freeze([
      "abort",
      "acknowledge_interpretation",
      "ratify",
      "request_clarification",
      "submit_answer",
    ]),
    compiledProjectionSelectors: Object.freeze([
      Object.freeze({ kind: "file", path: "SKILL.md" }),
    ]),
  }),
  "survey-v2": Object.freeze({
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    adapterKind: "survey-subject",
    adapterId: "mission-kit-survey-v2",
    adapterInterfaceVersion: SURVEY_SUBJECT_ADAPTER_INTERFACE_VERSION,
    subjectProtocolId: "mission-kit/survey",
    subjectProtocolVersion: "2.0.0",
    skillIdentity: "survey",
    runtimeSemanticsAuthority: "supplied-host-binding",
    nativeRuntimeSemanticsClaimed: false,
    capabilities: COMMON_CAPABILITIES,
    publicActionClasses: Object.freeze([
      "abort",
      "acknowledge_walkthrough",
      "correct_answer",
      "ratify",
      "request_clarification",
      "return_candidate",
      "submit_answer",
      "withhold",
      "withdraw_withholding",
    ]),
    compiledProjectionSelectors: Object.freeze([
      Object.freeze({ kind: "file", path: "SKILL.md" }),
      Object.freeze({ kind: "tree", path: "agents" }),
      Object.freeze({ kind: "tree", path: "assets" }),
      Object.freeze({ kind: "tree", path: "generated" }),
      Object.freeze({ kind: "tree", path: "references" }),
      Object.freeze({ kind: "tree", path: "schemas" }),
      Object.freeze({ kind: "tree", path: "scripts" }),
      Object.freeze({ kind: "file", path: "survey-v2.package.json" }),
    ]),
  }),
});

function sealedDescriptor(core) {
  return deepFreeze({
    ...deepCloneCanonical(core),
    adapterDescriptorDigest: hashCanonical(
      "survey-subject-adapter-descriptor/v1",
      core,
    ),
  });
}

const PROFILES = Object.freeze(
  Object.fromEntries(
    Object.entries(PROFILE_CORES).map(([profileId, core]) => [
      profileId,
      sealedDescriptor(core),
    ]),
  ),
);

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

function descriptorProfile(value) {
  return Object.values(PROFILES).find((descriptor) =>
    descriptor.adapterId === value.adapterId
  );
}

export function verifySurveySubjectAdapterDescriptor(value) {
  assertExactKeys(
    value,
    [
      "schemaVersion",
      "hashProfileId",
      "adapterKind",
      "adapterId",
      "adapterInterfaceVersion",
      "subjectProtocolId",
      "subjectProtocolVersion",
      "skillIdentity",
      "runtimeSemanticsAuthority",
      "nativeRuntimeSemanticsClaimed",
      "capabilities",
      "publicActionClasses",
      "compiledProjectionSelectors",
      "adapterDescriptorDigest",
    ],
    "Survey subject adapter descriptor",
  );
  const core = { ...value };
  const observedDigest = core.adapterDescriptorDigest;
  delete core.adapterDescriptorDigest;
  if (
    value.schemaVersion !== "1.0.0" ||
    value.hashProfileId !== HASH_PROFILE_ID ||
    value.adapterKind !== "survey-subject" ||
    value.adapterInterfaceVersion !==
      SURVEY_SUBJECT_ADAPTER_INTERFACE_VERSION ||
    value.subjectProtocolId !== "mission-kit/survey"
  ) {
    throw new ValidationError("Unsupported Survey subject adapter descriptor");
  }
  if (
    value.runtimeSemanticsAuthority !== "supplied-host-binding" ||
    value.nativeRuntimeSemanticsClaimed !== false
  ) {
    throw new ValidationError(
      "Survey adapter may describe only supplied host-binding semantics",
    );
  }
  assertIdentifier(value.adapterId, "adapter ID");
  assertIdentifier(value.skillIdentity, "skill identity");
  if (
    !Array.isArray(value.capabilities) ||
    canonicalize([...value.capabilities].sort()) !==
      canonicalize([...COMMON_CAPABILITIES].sort())
  ) {
    throw new ValidationError(
      "Survey adapter must expose the complete sovereign capability surface",
    );
  }
  if (
    !Array.isArray(value.publicActionClasses) ||
    value.publicActionClasses.length === 0 ||
    new Set(value.publicActionClasses).size !== value.publicActionClasses.length
  ) {
    throw new ValidationError("Survey adapter action classes are invalid");
  }
  value.publicActionClasses.forEach((entry) =>
    assertIdentifier(entry, "public action class")
  );
  if (
    !Array.isArray(value.compiledProjectionSelectors) ||
    value.compiledProjectionSelectors.length === 0
  ) {
    throw new ValidationError(
      "Survey adapter must declare compiled projection selectors",
    );
  }
  for (const selector of value.compiledProjectionSelectors) {
    assertExactKeys(selector, ["kind", "path"], "projection selector");
    if (!["file", "tree"].includes(selector.kind)) {
      throw new ValidationError("Unknown compiled projection selector kind");
    }
    if (
      typeof selector.path !== "string" ||
      selector.path.length === 0 ||
      selector.path.startsWith("/") ||
      selector.path.includes("\\") ||
      selector.path.split("/").some((segment) =>
        ["", ".", ".."].includes(segment)
      )
    ) {
      throw new ValidationError("Compiled projection selector path is unsafe");
    }
  }
  if (
    !DIGEST.test(observedDigest) ||
    hashCanonical("survey-subject-adapter-descriptor/v1", core) !==
      observedDigest
  ) {
    throw new IntegrityError("Survey subject adapter descriptor is not sealed");
  }
  const supported = descriptorProfile(value);
  if (!supported || canonicalize(value) !== canonicalize(supported)) {
    throw new ValidationError(
      "Survey subject adapter descriptor is not in the evaluator registry",
      { adapterId: value.adapterId },
    );
  }
  return supported;
}

export function surveySubjectAdapterDescriptor(profileId) {
  const descriptor = PROFILES[profileId];
  if (!descriptor) {
    throw new ValidationError("Unknown Survey subject adapter profile", {
      profileId,
    });
  }
  return descriptor;
}
