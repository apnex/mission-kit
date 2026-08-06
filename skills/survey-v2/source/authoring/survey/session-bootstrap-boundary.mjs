import {
  canonicalize,
  sha256Value,
  stableValue,
} from "../kernel/canonical.mjs";

const bootstrapClosureDomain =
  "mission-kit:survey-v2:session-bootstrap-closure/v2";
const prefixDomains = Object.freeze({
  dependencyPlan:
    "mission-kit:survey-v2:initial-dependency-plan-prefix/v1",
  resolverAttempts:
    "mission-kit:survey-v2:initial-resolver-attempt-prefix/v1",
  resolverReceipts:
    "mission-kit:survey-v2:initial-resolver-receipt-prefix/v1",
  rehydrationOutputs:
    "mission-kit:survey-v2:initial-rehydration-output-prefix/v1",
  initResolve:
    "mission-kit:survey-v2:initial-init-resolve-output/v1",
});

export const SURVEY_SESSION_ADAPTER_SCOPE_SCHEMA_VERSION = "2.0.0";
export const SURVEY_SESSION_BOOTSTRAP_CLOSURE_DOMAIN =
  bootstrapClosureDomain;
export const SURVEY_SESSION_INITIALIZATION_BOUNDARY_FIELDS =
  Object.freeze([
    "dependencyPlanCount",
    "dependencyPlanDigest",
    "resolverAttemptCount",
    "resolverAttemptPrefixDigest",
    "resolverReceiptCount",
    "resolverReceiptPrefixDigest",
    "rehydrationOutputCount",
    "rehydrationOutputPrefixDigest",
    "initResolveDigest",
  ]);

export class SurveySessionBootstrapBoundaryError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SurveySessionBootstrapBoundaryError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new SurveySessionBootstrapBoundaryError(code, message);
}

function record(value) {
  return value !== null &&
    typeof value === "object" &&
    !Array.isArray(value);
}

function exactKeys(value, fields) {
  return record(value) &&
    Object.keys(value).length === fields.length &&
    fields.every((field) => Object.hasOwn(value, field));
}

function sameValue(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function dependenciesFrom(session) {
  const dependencies = session?.dependencies;
  if (
    !record(dependencies) ||
    !Array.isArray(dependencies.plan) ||
    !Array.isArray(dependencies.resolverAttempts) ||
    !Array.isArray(dependencies.resolverReceipts) ||
    !Array.isArray(dependencies.rehydrationOutputs) ||
    !record(dependencies.outputs)
  ) {
    fail(
      "SURVEY_SESSION_INITIAL_DEPENDENCIES_INVALID",
      "candidate dependencies must expose the complete initialization boundary",
    );
  }
  return dependencies;
}

function prefixDigest(domain, values) {
  return sha256Value({
    domain,
    values,
  });
}

function initResolveDigest(value) {
  return value === undefined
    ? null
    : sha256Value({
      domain: prefixDomains.initResolve,
      value,
    });
}

function assertCount(value, field) {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail(
      "SURVEY_SESSION_INITIALIZATION_COUNT_INVALID",
      `${field} must be one nonnegative safe integer`,
    );
  }
  return value;
}

function boundaryFromPrefixes({
  plan,
  resolverAttempts,
  resolverReceipts,
  rehydrationOutputs,
  initResolve,
}) {
  return stableValue({
    dependencyPlanCount: plan.length,
    dependencyPlanDigest: prefixDigest(
      prefixDomains.dependencyPlan,
      plan,
    ),
    resolverAttemptCount: resolverAttempts.length,
    resolverAttemptPrefixDigest: prefixDigest(
      prefixDomains.resolverAttempts,
      resolverAttempts,
    ),
    resolverReceiptCount: resolverReceipts.length,
    resolverReceiptPrefixDigest: prefixDigest(
      prefixDomains.resolverReceipts,
      resolverReceipts,
    ),
    rehydrationOutputCount: rehydrationOutputs.length,
    rehydrationOutputPrefixDigest: prefixDigest(
      prefixDomains.rehydrationOutputs,
      rehydrationOutputs,
    ),
    initResolveDigest: initResolveDigest(initResolve),
  });
}

function selectedInitializationValues(
  session,
  boundary,
  {
    requireNoSuffix = false,
    genesisBoundary,
  } = {},
) {
  if (
    !exactKeys(
      boundary,
      SURVEY_SESSION_INITIALIZATION_BOUNDARY_FIELDS,
    )
  ) {
    fail(
      "SURVEY_SESSION_INITIALIZATION_BOUNDARY_SHAPE_INVALID",
      "adapter scope must contain the exact nine initialization boundary fields",
    );
  }
  const dependencies = dependenciesFrom(session);
  const selections = [
    [
      "dependencyPlanCount",
      "plan",
      dependencies.plan,
    ],
    [
      "resolverAttemptCount",
      "resolverAttempts",
      dependencies.resolverAttempts,
    ],
    [
      "resolverReceiptCount",
      "resolverReceipts",
      dependencies.resolverReceipts,
    ],
    [
      "rehydrationOutputCount",
      "rehydrationOutputs",
      dependencies.rehydrationOutputs,
    ],
  ];
  const selected = {};
  for (const [countField, targetField, values] of selections) {
    const count = assertCount(boundary[countField], countField);
    if (
      values.length < count ||
      (requireNoSuffix && values.length !== count)
    ) {
      fail(
        "SURVEY_SESSION_INITIALIZATION_PREFIX_LENGTH_INVALID",
        `${targetField} must equal the frozen initialization prefix`,
      );
    }
    selected[targetField] = stableValue(values.slice(0, count));
  }
  const outputKeys = Object.keys(dependencies.outputs);
  if (
    genesisBoundary === "post-bootstrap" &&
    !Object.hasOwn(dependencies.outputs, "initResolve")
  ) {
    fail(
      "SURVEY_SESSION_INITIALIZATION_OUTPUTS_INVALID",
      "post-bootstrap dependencies.outputs must retain initResolve",
    );
  }
  if (
    requireNoSuffix &&
    (
      boundary.initResolveDigest === null
        ? outputKeys.length !== 0
        : (
          outputKeys.length !== 1 ||
          outputKeys[0] !== "initResolve"
        )
    )
  ) {
    fail(
      "SURVEY_SESSION_INITIALIZATION_OUTPUTS_INVALID",
      "dependencies.outputs differs from the exact frozen initialization output",
    );
  }
  selected.initResolve = boundary.initResolveDigest === null
    ? undefined
    : dependencies.outputs.initResolve;
  return selected;
}

export function createSessionInitializationDependencyBoundary(
  session,
  { genesisBoundary = "post-bootstrap" } = {},
) {
  const dependencies = dependenciesFrom(session);
  if (
    genesisBoundary === "post-bootstrap" &&
    (
      Object.keys(dependencies.outputs).length !== 1 ||
      !Object.hasOwn(dependencies.outputs, "initResolve")
    )
  ) {
    fail(
      "SURVEY_SESSION_INITIALIZATION_OUTPUTS_INVALID",
      "post-bootstrap identity requires exactly one initResolve output",
    );
  }
  if (
    genesisBoundary === "protocol-start" &&
    Object.keys(dependencies.outputs).some(
      (key) => key !== "initResolve",
    )
  ) {
    fail(
      "SURVEY_SESSION_INITIALIZATION_OUTPUTS_INVALID",
      "protocol-start identity admits at most the initResolve output",
    );
  }
  return boundaryFromPrefixes({
    plan: dependencies.plan,
    resolverAttempts: dependencies.resolverAttempts,
    resolverReceipts: dependencies.resolverReceipts,
    rehydrationOutputs: dependencies.rehydrationOutputs,
    initResolve: dependencies.outputs.initResolve,
  });
}

export function rederiveSessionInitializationDependencyBoundary(
  session,
  persistedBoundary,
  {
    requireNoSuffix = false,
    genesisBoundary,
  } = {},
) {
  const selected = selectedInitializationValues(
    session,
    persistedBoundary,
    { requireNoSuffix, genesisBoundary },
  );
  const derived = boundaryFromPrefixes(selected);
  if (!sameValue(derived, persistedBoundary)) {
    fail(
      "SURVEY_SESSION_INITIALIZATION_BOUNDARY_MISMATCH",
      "session initialization prefixes do not reproduce the persisted adapter boundary",
    );
  }
  return derived;
}

export function assertR12InitializationDependencyBoundary(
  session,
  persistedBoundary,
  { genesisBoundary } = {},
) {
  return rederiveSessionInitializationDependencyBoundary(
    session,
    persistedBoundary,
    {
      requireNoSuffix: true,
      genesisBoundary,
    },
  );
}

function immutableBootstrapValue(session, boundary) {
  const selected = selectedInitializationValues(
    session,
    boundary,
  );
  return {
    schema: {
      id: session.$schema,
      version: session.schemaVersion,
    },
    sessionId: session.sessionId,
    slug: session.slug,
    package: session.package,
    protocol: session.protocol,
    lineage: session.lineage,
    inputs: session.inputs,
    authority: session.authority,
    initialization: {
      dependencyPlan: selected.plan,
      resolverAttemptPrefix: selected.resolverAttempts,
      resolverReceiptPrefix: selected.resolverReceipts,
      rehydrationOutputPrefix: selected.rehydrationOutputs,
      initResolve: selected.initResolve ?? null,
    },
  };
}

export function sessionBootstrapClosureDigest(
  session,
  boundary = undefined,
) {
  const persistedScope =
    session?.authoring?.persistence?.identityScope?.adapterScope;
  const selectedBoundary = boundary ??
    (
      record(persistedScope)
        ? rederiveSessionInitializationDependencyBoundary(
          session,
          Object.fromEntries(
            SURVEY_SESSION_INITIALIZATION_BOUNDARY_FIELDS.map(
              (field) => [field, persistedScope[field]],
            ),
          ),
          {
            genesisBoundary: persistedScope.genesisBoundary,
          },
        )
        : createSessionInitializationDependencyBoundary(
          session,
          { genesisBoundary: "post-bootstrap" },
        )
    );
  return sha256Value({
    domain: bootstrapClosureDomain,
    ...immutableBootstrapValue(session, selectedBoundary),
  });
}

function adapterScopeBase(session, genesisBoundary) {
  return {
    adapter: "survey-session",
    schemaVersion: SURVEY_SESSION_ADAPTER_SCOPE_SCHEMA_VERSION,
    genesisBoundary,
    sessionId: session.sessionId,
    sessionSchema: session.$schema,
    packageId: session.package.id,
    packageVersion: session.package.version,
    projectionDigest: session.package.projectionDigest,
    protocolId: session.protocol.id,
    protocolVersion: session.protocol.version,
    protocolDigest: session.protocol.digest,
    authorityDigest: sha256Value(session.authority),
    pendingInputDigest: session.inputs.pendingInputDigest,
  };
}

export function createSurveySessionAdapterScope(
  session,
  genesisBoundary,
) {
  const boundary = createSessionInitializationDependencyBoundary(
    session,
    { genesisBoundary },
  );
  return stableValue({
    ...adapterScopeBase(session, genesisBoundary),
    ...boundary,
    bootstrapClosureDigest:
      sessionBootstrapClosureDigest(session, boundary),
  });
}

export function rederiveSurveySessionAdapterScope(
  session,
  persistedScope,
  { requireNoSuffix = false } = {},
) {
  if (!record(persistedScope)) {
    fail(
      "SURVEY_SESSION_ADAPTER_SCOPE_REQUIRED",
      "persisted adapter scope is required",
    );
  }
  const boundary = Object.fromEntries(
    SURVEY_SESSION_INITIALIZATION_BOUNDARY_FIELDS.map(
      (field) => [field, persistedScope[field]],
    ),
  );
  const derivedBoundary =
    rederiveSessionInitializationDependencyBoundary(
      session,
      boundary,
      {
        requireNoSuffix,
        genesisBoundary: persistedScope.genesisBoundary,
      },
    );
  return stableValue({
    ...adapterScopeBase(
      session,
      persistedScope.genesisBoundary,
    ),
    ...derivedBoundary,
    bootstrapClosureDigest:
      sessionBootstrapClosureDigest(session, derivedBoundary),
  });
}
