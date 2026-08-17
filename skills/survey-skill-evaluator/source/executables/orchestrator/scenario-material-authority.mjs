import {
  canonicalBytes,
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import {
  HASH_PROFILE_ID,
  hashCanonical,
} from "../engine/hash.mjs";
import {
  IntegrityError,
  ValidationError,
} from "../engine/errors.mjs";

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u;
const DIGEST = /^[a-f0-9]{64}$/u;
const SAFE_REFERENCE =
  /^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[^\\\u0000]+$/u;

export const SCENARIO_MATERIAL_PRE_EXECUTION_STATES = Object.freeze([
  "EC0_DRAFT",
  "EC1_INPUTS_VALIDATED",
  "EC2_PREREGISTERED",
  "EC3_ASSIGNED",
]);

function compareUtf8(left, right) {
  return Buffer.from(left, "utf8").compare(Buffer.from(right, "utf8"));
}

function assertExactKeys(value, expected, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError(`${label} must be an object`);
  }
  const actual = Object.keys(value).sort(compareUtf8);
  const wanted = [...expected].sort(compareUtf8);
  if (canonicalBytes(actual).compare(canonicalBytes(wanted)) !== 0) {
    throw new ValidationError(`${label} has an undeclared or missing field`, {
      actual,
      expected: wanted,
    });
  }
  return value;
}

function assertIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    throw new ValidationError(`${label} is invalid`);
  }
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !DIGEST.test(value)) {
    throw new ValidationError(`${label} is invalid`);
  }
}

function assertPreExecutionBoundary({
  lifecycleState,
  lifecycleRevision,
  authoritativeStateRoot,
  executionStarted,
}) {
  if (
    !SCENARIO_MATERIAL_PRE_EXECUTION_STATES.includes(lifecycleState) ||
    !Number.isInteger(lifecycleRevision) ||
    lifecycleRevision < 0 ||
    executionStarted !== false
  ) {
    throw new ValidationError(
      "Scenario material may only be requested from a sealed pre-execution campaign state",
      { lifecycleState, lifecycleRevision, executionStarted },
    );
  }
  assertDigest(authoritativeStateRoot, "Campaign authoritative state root");
}

export function scenarioMaterialScenarioDigest(scenario) {
  return hashCanonical("scenario-material-scenario/v1", scenario);
}

export function scenarioMaterialPersonaBriefDigest(personaBrief) {
  return hashCanonical("scenario-material-persona-brief/v1", personaBrief);
}

// Semantic-key and rubric identities intentionally omit only their reciprocal
// digest fields. This preserves a non-cyclic, byte-stable cross-binding.
export function scenarioMaterialSemanticKeyDigest(semanticKey) {
  const inert = deepCloneCanonical(semanticKey);
  if (
    !inert.key ||
    typeof inert.key !== "object" ||
    Array.isArray(inert.key)
  ) {
    throw new ValidationError("Semantic key has no key projection");
  }
  const {
    rubricDigest: _rubricDigest,
    ...keyWithoutRubricBinding
  } = inert.key;
  return hashCanonical("scenario-material-semantic-key/v1", {
    ...inert,
    key: keyWithoutRubricBinding,
  });
}

export function scenarioMaterialRubricDigest(rubric) {
  const inert = deepCloneCanonical(rubric);
  const {
    semanticKeyDigest: _semanticKeyDigest,
    ...rubricWithoutSemanticKeyBinding
  } = inert;
  return hashCanonical(
    "scenario-material-rubric/v1",
    rubricWithoutSemanticKeyBinding,
  );
}

export function scenarioMaterialReviewDigest(scenarioReview) {
  return hashCanonical(
    "scenario-material-scenario-review/v1",
    scenarioReview,
  );
}

function requestCore(request) {
  return Object.fromEntries(
    Object.entries(request).filter(([key]) => key !== "requestDigest"),
  );
}

function responseCore(response) {
  return Object.fromEntries(
    Object.entries(response).filter(([key]) => key !== "responseDigest"),
  );
}

export function sealScenarioMaterialAuthorityResponse(core) {
  assertExactKeys(
    core,
    [
      "schemaVersion",
      "hashProfileId",
      "authorityId",
      "requestId",
      "requestDigest",
      "campaignId",
      "campaignSealDigest",
      "constructionLifecycleState",
      "constructionLifecycleRevision",
      "constructionStateRoot",
      "constructedBeforeExecution",
      "materials",
    ],
    "Scenario material authority response core",
  );
  const inert = deepCloneCanonical(core);
  return deepFreeze({
    ...inert,
    responseDigest: hashCanonical(
      "scenario-material-authority-response/v1",
      inert,
    ),
  });
}

function validateScenarioBindings(scenarioBindings, schemaValidator) {
  if (!Array.isArray(scenarioBindings) || scenarioBindings.length === 0) {
    throw new ValidationError(
      "Scenario material request requires at least one sealed scenario",
    );
  }
  const scenarioIds = new Set();
  const scenarioRefs = new Set();
  const normalized = [];
  for (const binding of scenarioBindings) {
    assertExactKeys(
      binding,
      ["scenarioRef", "scenario", "scenarioDigest"],
      "Sealed scenario binding",
    );
    if (
      typeof binding.scenarioRef !== "string" ||
      !SAFE_REFERENCE.test(binding.scenarioRef)
    ) {
      throw new ValidationError("Sealed scenario reference is unsafe");
    }
    schemaValidator.assert("scenario", binding.scenario);
    if (
      scenarioRefs.has(binding.scenarioRef) ||
      scenarioIds.has(binding.scenario.scenarioId)
    ) {
      throw new ValidationError(
        "Scenario material request repeats a scenario identity",
      );
    }
    const expectedDigest = scenarioMaterialScenarioDigest(binding.scenario);
    if (binding.scenarioDigest !== expectedDigest) {
      throw new IntegrityError("Sealed scenario digest does not match content", {
        scenarioId: binding.scenario.scenarioId,
      });
    }
    scenarioRefs.add(binding.scenarioRef);
    scenarioIds.add(binding.scenario.scenarioId);
    normalized.push(deepCloneCanonical(binding));
  }
  return normalized.sort((left, right) =>
    compareUtf8(left.scenarioRef, right.scenarioRef),
  );
}

export function createScenarioMaterialRequest({
  campaignId,
  campaignSealDigest,
  lifecycleState,
  lifecycleRevision,
  authoritativeStateRoot,
  executionStarted,
  claimRequiresDownstream = false,
  sealedScenarios,
  schemaValidator,
}) {
  if (!schemaValidator || typeof schemaValidator.assert !== "function") {
    throw new ValidationError(
      "Scenario material request requires the evaluator schema validator",
    );
  }
  assertIdentifier(campaignId, "Campaign ID");
  assertDigest(campaignSealDigest, "Campaign seal digest");
  if (typeof claimRequiresDownstream !== "boolean") {
    throw new ValidationError(
      "Downstream-claim requirement must be an explicit boolean",
    );
  }
  assertPreExecutionBoundary({
    lifecycleState,
    lifecycleRevision,
    authoritativeStateRoot,
    executionStarted,
  });
  const scenarioBindings = validateScenarioBindings(
    sealedScenarios,
    schemaValidator,
  );
  const requestIdentity = hashCanonical("scenario-material-request-id/v1", {
    campaignId,
    campaignSealDigest,
    lifecycleState,
    lifecycleRevision,
    authoritativeStateRoot,
    claimRequiresDownstream,
    scenarioBindings: scenarioBindings.map(
      ({ scenarioRef, scenarioDigest, scenario }) => ({
        scenarioRef,
        scenarioId: scenario.scenarioId,
        scenarioDigest,
      }),
    ),
  });
  const core = {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    requestId: `scenario-material-${requestIdentity.slice(0, 24)}`,
    campaignId,
    campaignSealDigest,
    lifecycleState,
    lifecycleRevision,
    authoritativeStateRoot,
    executionStarted: false,
    claimRequiresDownstream,
    scenarioBindings,
  };
  return deepFreeze({
    ...core,
    requestDigest: hashCanonical("scenario-material-request/v1", core),
  });
}

export function verifyScenarioMaterialRequest(request, schemaValidator) {
  assertExactKeys(
    request,
    [
      "schemaVersion",
      "hashProfileId",
      "requestId",
      "campaignId",
      "campaignSealDigest",
      "lifecycleState",
      "lifecycleRevision",
      "authoritativeStateRoot",
      "executionStarted",
      "claimRequiresDownstream",
      "scenarioBindings",
      "requestDigest",
    ],
    "Scenario material request",
  );
  if (
    request.schemaVersion !== "1.0.0" ||
    request.hashProfileId !== HASH_PROFILE_ID
  ) {
    throw new ValidationError("Scenario material request version is invalid");
  }
  assertIdentifier(request.requestId, "Scenario material request ID");
  assertIdentifier(request.campaignId, "Campaign ID");
  assertDigest(request.campaignSealDigest, "Campaign seal digest");
  assertDigest(request.requestDigest, "Scenario material request digest");
  if (typeof request.claimRequiresDownstream !== "boolean") {
    throw new ValidationError(
      "Scenario material request has no downstream-claim classification",
    );
  }
  assertPreExecutionBoundary(request);
  const normalized = validateScenarioBindings(
    request.scenarioBindings,
    schemaValidator,
  );
  if (
    canonicalBytes(normalized).compare(
      canonicalBytes(request.scenarioBindings),
    ) !== 0 ||
    hashCanonical("scenario-material-request/v1", requestCore(request)) !==
      request.requestDigest
  ) {
    throw new IntegrityError("Scenario material request is not canonical or sealed");
  }
  return request;
}

function validateReviewDisposition(review, claimRequiresDownstream) {
  const downstream = review.downstreamParity;
  if (
    (claimRequiresDownstream &&
      (downstream.applicability !== "required" ||
        downstream.claimRequiresDownstream !== true)) ||
    (!claimRequiresDownstream &&
      (downstream.applicability !== "not_required" ||
        downstream.claimRequiresDownstream !== false))
  ) {
    throw new IntegrityError(
      "Scenario review downstream disposition contradicts the sealed campaign claim",
    );
  }
  if (
    review.verdict !== "pass" ||
    review.noScriptPassed !== true ||
    review.feasibilityPassed !== true ||
    review.privacyPassed !== true ||
    review.conflictPassed !== true
  ) {
    throw new ValidationError(
      "Scenario material authority did not return an admissible passing review",
      { scenarioReviewId: review.scenarioReviewId },
    );
  }
}

function validateMaterialBundle({
  bundle,
  binding,
  request,
  schemaValidator,
}) {
  assertExactKeys(
    bundle,
    [
      "scenarioRef",
      "scenarioId",
      "scenarioDigest",
      "semanticKey",
      "personaBrief",
      "rubric",
      "scenarioReview",
    ],
    "Scenario material bundle",
  );
  if (
    bundle.scenarioRef !== binding.scenarioRef ||
    bundle.scenarioId !== binding.scenario.scenarioId ||
    bundle.scenarioDigest !== binding.scenarioDigest
  ) {
    throw new IntegrityError(
      "Scenario material bundle does not match its sealed scenario",
      { scenarioRef: bundle.scenarioRef },
    );
  }
  schemaValidator.assert("semantic-key", bundle.semanticKey);
  schemaValidator.assert("persona-brief", bundle.personaBrief);
  schemaValidator.assert("rubric", bundle.rubric);
  schemaValidator.assert("scenario-review", bundle.scenarioReview);

  const semanticKeyDigest = scenarioMaterialSemanticKeyDigest(
    bundle.semanticKey,
  );
  const personaBriefDigest = scenarioMaterialPersonaBriefDigest(
    bundle.personaBrief,
  );
  const rubricDigest = scenarioMaterialRubricDigest(bundle.rubric);
  const scenarioReviewDigest = scenarioMaterialReviewDigest(
    bundle.scenarioReview,
  );
  if (
    bundle.semanticKey.scenarioId !== binding.scenario.scenarioId ||
    bundle.personaBrief.scenarioId !== binding.scenario.scenarioId ||
    bundle.semanticKey.latentIntentDigest !==
      bundle.personaBrief.latentIntentDigest ||
    bundle.semanticKey.key.purpose !== "survey" ||
    bundle.semanticKey.key.rubricDigest !== rubricDigest ||
    bundle.rubric.purpose !== "survey_semantic" ||
    bundle.rubric.semanticKeyDigest !== semanticKeyDigest ||
    bundle.scenarioReview.scenarioDigest !== binding.scenarioDigest ||
    bundle.scenarioReview.personaBriefDigest !== personaBriefDigest ||
    bundle.scenarioReview.surveySemanticKeyDigest !== semanticKeyDigest
  ) {
    throw new IntegrityError(
      "Scenario material cross-digest or scenario binding is invalid",
      { scenarioId: binding.scenario.scenarioId },
    );
  }
  validateReviewDisposition(
    bundle.scenarioReview,
    request.claimRequiresDownstream,
  );
  return deepFreeze({
    ...deepCloneCanonical(bundle),
    semanticKeyDigest,
    personaBriefDigest,
    rubricDigest,
    scenarioReviewDigest,
    materialBundleDigest: hashCanonical(
      "scenario-material-bundle/v1",
      bundle,
    ),
  });
}

export function validateScenarioMaterialResponse({
  request,
  response,
  schemaValidator,
}) {
  verifyScenarioMaterialRequest(request, schemaValidator);
  assertExactKeys(
    response,
    [
      "schemaVersion",
      "hashProfileId",
      "authorityId",
      "requestId",
      "requestDigest",
      "campaignId",
      "campaignSealDigest",
      "constructionLifecycleState",
      "constructionLifecycleRevision",
      "constructionStateRoot",
      "constructedBeforeExecution",
      "materials",
      "responseDigest",
    ],
    "Scenario material authority response",
  );
  if (
    response.schemaVersion !== "1.0.0" ||
    response.hashProfileId !== HASH_PROFILE_ID ||
    response.requestId !== request.requestId ||
    response.requestDigest !== request.requestDigest ||
    response.campaignId !== request.campaignId ||
    response.campaignSealDigest !== request.campaignSealDigest ||
    response.constructionLifecycleState !== request.lifecycleState ||
    response.constructionLifecycleRevision !== request.lifecycleRevision ||
    response.constructionStateRoot !== request.authoritativeStateRoot ||
    response.constructedBeforeExecution !== true
  ) {
    throw new IntegrityError(
      "Scenario material authority response is not bound to the pre-execution request",
    );
  }
  assertIdentifier(response.authorityId, "Scenario material authority ID");
  assertDigest(response.responseDigest, "Scenario material response digest");
  if (
    hashCanonical(
      "scenario-material-authority-response/v1",
      responseCore(response),
    ) !== response.responseDigest
  ) {
    throw new IntegrityError(
      "Scenario material authority response digest is invalid",
    );
  }
  if (
    !Array.isArray(response.materials) ||
    response.materials.length !== request.scenarioBindings.length
  ) {
    throw new IntegrityError(
      "Scenario material authority response does not cover every sealed scenario",
    );
  }
  const materialByReference = new Map();
  for (const material of response.materials) {
    if (
      typeof material?.scenarioRef !== "string" ||
      materialByReference.has(material.scenarioRef)
    ) {
      throw new IntegrityError(
        "Scenario material authority response repeats a scenario",
      );
    }
    materialByReference.set(material.scenarioRef, material);
  }
  const admitted = request.scenarioBindings.map((binding) => {
    const bundle = materialByReference.get(binding.scenarioRef);
    if (!bundle) {
      throw new IntegrityError(
        "Scenario material authority omitted a sealed scenario",
        { scenarioRef: binding.scenarioRef },
      );
    }
    return validateMaterialBundle({
      bundle,
      binding,
      request,
      schemaValidator,
    });
  });
  return deepFreeze({
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    authorityId: response.authorityId,
    requestId: request.requestId,
    requestDigest: request.requestDigest,
    responseDigest: response.responseDigest,
    campaignId: request.campaignId,
    campaignSealDigest: request.campaignSealDigest,
    constructionStateRoot: request.authoritativeStateRoot,
    materials: admitted,
    authorityEnvelopeDigest: hashCanonical(
      "admitted-scenario-material-authority-envelope/v1",
      {
        requestDigest: request.requestDigest,
        responseDigest: response.responseDigest,
        authorityId: response.authorityId,
        materialBundleDigests: admitted.map(
          (material) => material.materialBundleDigest,
        ),
      },
    ),
  });
}

export async function requestScenarioMaterials({
  request,
  provider,
  schemaValidator,
}) {
  verifyScenarioMaterialRequest(request, schemaValidator);
  const invoke =
    typeof provider === "function"
      ? provider
      : typeof provider?.provideScenarioMaterials === "function"
        ? provider.provideScenarioMaterials.bind(provider)
        : null;
  if (!invoke) {
    throw new ValidationError(
      "Embedding host did not supply an external scenario-material authority provider",
    );
  }
  const response = await invoke(
    deepFreeze(deepCloneCanonical(request)),
  );
  if (!response) {
    throw new ValidationError(
      "External scenario-material authority provider returned no response",
    );
  }
  return validateScenarioMaterialResponse({
    request,
    response,
    schemaValidator,
  });
}

export class ScenarioMaterialAuthorityClient {
  constructor({ schemaValidator, provider }) {
    if (!schemaValidator || typeof schemaValidator.assert !== "function") {
      throw new ValidationError(
        "ScenarioMaterialAuthorityClient requires a schema validator",
      );
    }
    this.schemaValidator = schemaValidator;
    this.provider = provider;
  }

  createRequest(input) {
    return createScenarioMaterialRequest({
      ...input,
      schemaValidator: this.schemaValidator,
    });
  }

  validate(request, response) {
    return validateScenarioMaterialResponse({
      request,
      response,
      schemaValidator: this.schemaValidator,
    });
  }

  async request(input) {
    const request = this.createRequest(input);
    return requestScenarioMaterials({
      request,
      provider: this.provider,
      schemaValidator: this.schemaValidator,
    });
  }
}
