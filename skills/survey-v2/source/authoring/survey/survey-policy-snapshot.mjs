import { types } from "node:util";
import { validateById } from "../../../generated/validators.mjs";
import {
  stableValue
} from "../kernel/canonical.mjs";
import {
  resourceReferenceFrom,
  resourceSemanticDigest
} from "../kernel/digests.mjs";
import {
  validateContractSemantics
} from "../kernel/contract-semantics.mjs";
import {
  validateSurveyResourceSemantics
} from "./resource-semantics.mjs";

const PROFILE_SCHEMA_ID =
  "urn:mission-kit:authoring:schema:authoring-profile-manifest:v1alpha1";
const POLICY_SCHEMA_ID =
  "urn:mission-kit:survey:schema:survey-policy-snapshot:v1alpha1";
const SEMANTIC_ID_PATTERN =
  /^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/;
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;

function dataDescriptor(object, key, label) {
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  if (
    !descriptor?.enumerable ||
    !Object.prototype.hasOwnProperty.call(descriptor, "value")
  ) {
    throw new TypeError(`${label} must be an enumerable data property`);
  }
  return descriptor.value;
}

function exactRecord(value, keys, label) {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    types.isProxy(value)
  ) {
    throw new TypeError(`${label} must be a plain record`);
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new TypeError(`${label} must be a plain record`);
  }
  const ownKeys = Reflect.ownKeys(value);
  if (
    ownKeys.length !== keys.length ||
    ownKeys.some((key) => typeof key !== "string" || !keys.includes(key))
  ) {
    throw new TypeError(`${label} must contain exactly ${keys.join(", ")}`);
  }
  return Object.fromEntries(
    keys.map((key) => [key, dataDescriptor(value, key, `${label}.${key}`)])
  );
}

function exactBindings(value, label) {
  if (
    !Array.isArray(value) ||
    types.isProxy(value) ||
    value.length < 1 ||
    value.length > 64
  ) {
    throw new TypeError(`${label} must contain 1..64 ordered bindings`);
  }
  const ownKeys = Reflect.ownKeys(value);
  if (
    ownKeys.some((key) => (
      key !== "length" &&
      (
        typeof key !== "string" ||
        !/^(?:0|[1-9][0-9]*)$/.test(key) ||
        Number(key) >= value.length
      )
    ))
  ) {
    throw new TypeError(`${label} must not carry ambient fields`);
  }
  const seen = new Set();
  return Array.from({ length: value.length }, (_, index) => {
    const binding = exactRecord(
      dataDescriptor(value, String(index), `${label}[${index}]`),
      ["id", "digest"],
      `${label}[${index}]`
    );
    if (
      typeof binding.id !== "string" ||
      binding.id.length > 160 ||
      !SEMANTIC_ID_PATTERN.test(binding.id)
    ) {
      throw new TypeError(`${label}[${index}].id is not a semantic ID`);
    }
    if (
      typeof binding.digest !== "string" ||
      !DIGEST_PATTERN.test(binding.digest)
    ) {
      throw new TypeError(`${label}[${index}].digest is not a sha256 digest`);
    }
    if (seen.has(binding.id)) {
      throw new TypeError(`${label} duplicates binding ID ${binding.id}`);
    }
    seen.add(binding.id);
    return {
      id: binding.id,
      digest: binding.digest
    };
  });
}

function trustedProfile(value) {
  let profile;
  try {
    profile = stableValue(value);
  } catch {
    throw new TypeError("profile must be a canonical plain resource");
  }
  const structural = validateById(PROFILE_SCHEMA_ID, profile);
  if (!structural.valid) {
    throw new TypeError(
      `profile is structurally invalid: ${structural.errors.join("; ")}`
    );
  }
  const semanticIssues = validateContractSemantics(profile);
  if (semanticIssues.length > 0) {
    throw new TypeError(
      `profile is semantically invalid: ${semanticIssues
        .map((item) => item.code)
        .join(", ")}`
    );
  }
  return profile;
}

function freezeResource(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) freezeResource(item);
    Object.freeze(value);
  }
  return value;
}

function assertValidPolicy(resource, profile) {
  const structural = validateById(POLICY_SCHEMA_ID, resource);
  if (!structural.valid) {
    throw new Error(
      `constructed SurveyPolicySnapshot is structurally invalid: ${structural.errors.join("; ")}`
    );
  }
  const profileReference = resource.spec.profileRef;
  const semanticIssues = validateSurveyResourceSemantics(resource, {
    resolveReference(reference) {
      return (
        reference.apiVersion === profileReference.apiVersion &&
        reference.kind === profileReference.kind &&
        reference.name === profileReference.name &&
        reference.semanticDigest === profileReference.semanticDigest
      )
        ? profile
        : undefined;
    }
  });
  if (semanticIssues.length > 0) {
    throw new Error(
      `constructed SurveyPolicySnapshot is semantically invalid: ${semanticIssues
        .map((item) => item.code)
        .join(", ")}`
    );
  }
}

/**
 * Freeze the fixed Survey policy around explicit host-trusted identity pins.
 * No policy value, resource name, or binding can arrive through ambient state.
 */
export function buildSurveyPolicySnapshot(input) {
  const supplied = exactRecord(
    input,
    [
      "profile",
      "schemaBindings",
      "validatorBindings",
      "selectorBindings"
    ],
    "Survey policy input"
  );
  const profile = trustedProfile(supplied.profile);
  const schemaBindings = exactBindings(
    supplied.schemaBindings,
    "schemaBindings"
  );
  const validatorBindings = exactBindings(
    supplied.validatorBindings,
    "validatorBindings"
  );
  const selectorBindings = exactBindings(
    supplied.selectorBindings,
    "selectorBindings"
  );
  const resource = {
    apiVersion: "survey.mission-kit/v1alpha1",
    kind: "SurveyPolicySnapshot",
    metadata: {
      name: "pending-survey-policy"
    },
    spec: {
      profileRef: resourceReferenceFrom(profile),
      geometry: {
        rounds: 2,
        questionsPerRound: 3,
        totalQuestions: 6,
        choiceOptions: {
          minimum: 3,
          maximum: 4
        }
      },
      disclosure: {
        mode: "single-current-question",
        siblingQuestionFramesVisible: false,
        futureQuestionsVisible: false,
        interimInterpretationVisible: false
      },
      generation: {
        questionFrameSetSize: 3,
        questionSetSize: 3,
        questionResourceType: {
          apiVersion: "schemas.mission-kit/v1alpha1",
          kind: "Question"
        },
        contextFrameResourceType: {
          apiVersion: "schemas.mission-kit/v1alpha1",
          kind: "ContextFrame"
        },
        roundTwoRelations: [
          "refines",
          "challenges",
          "disambiguates",
          "deepens"
        ]
      },
      validation: {
        rationaleRequired: true,
        authority: "mechanical-only",
        schemaBindings,
        validatorBindings
      },
      contextSelection: {
        preserveLayerRoles: true,
        allowInlineRuntimeState: false,
        selectors: selectorBindings
      }
    }
  };
  resource.metadata.name =
    `survey-policy-${resourceSemanticDigest(resource).slice("sha256:".length)}`;
  assertValidPolicy(resource, profile);
  return freezeResource(resource);
}
