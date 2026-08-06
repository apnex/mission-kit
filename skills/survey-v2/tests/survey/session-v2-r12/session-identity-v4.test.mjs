import assert from "node:assert/strict";
import test from "node:test";
import {
  SURVEY_SESSION_ADAPTER_SCOPE_SCHEMA_VERSION,
  SURVEY_SESSION_INITIALIZATION_BOUNDARY_FIELDS,
  assertR12InitializationDependencyBoundary,
  rederiveSurveySessionAdapterScope,
} from "../../../source/authoring/survey/session-bootstrap-boundary.mjs";
import {
  SURVEY_SESSION_JOURNAL_IDENTITY_DIGEST,
  reconstructSurveySessionJournalIdentity,
} from "../../../source/authoring/survey/session-journal-identity.mjs";
import {
  authenticationKey,
  createCandidate,
  initializationBoundaryFromScope,
} from "./session-provenance-support.mjs";

const v4KnownIdentityDigest =
  "sha256:d7d42346b60cc6f970d7d2ef155bf06023e433cfe583e122afa649ae2834b456";

test("session identity v4 is cold-reconstructable, runtime-stable, and prefix-frozen", async (context) => {
await context.test("journal identity v4 cold reconstruction reproduces its exact immutable scope", async () => {
  const { session, identityConfiguration } =
    await createCandidate();
  const cold = reconstructSurveySessionJournalIdentity(
    structuredClone(session),
    authenticationKey,
  );
  const scope = session.authoring.persistence.identityScope
    .adapterScope;

  assert.equal(
    SURVEY_SESSION_JOURNAL_IDENTITY_DIGEST,
    v4KnownIdentityDigest,
  );
  assert.equal(
    scope.schemaVersion,
    SURVEY_SESSION_ADAPTER_SCOPE_SCHEMA_VERSION,
  );
  assert.deepEqual(
    Object.keys(initializationBoundaryFromScope(scope)).sort(),
    [...SURVEY_SESSION_INITIALIZATION_BOUNDARY_FIELDS].sort(),
  );
  assert.deepEqual(
    cold.identityScope,
    identityConfiguration.identityScope,
  );
  assert.deepEqual(
    cold.identityBinding,
    identityConfiguration.identityBinding,
  );
  assert.deepEqual(
    rederiveSurveySessionAdapterScope(
      session,
      scope,
      { requireNoSuffix: true },
    ),
    scope,
  );
});

await context.test("legitimate runtime projections do not change the v4 keyed identity", async () => {
  const { session } = await createCandidate();
  const beforeBinding = structuredClone(
    session.authoring.persistence.identityBinding,
  );
  const beforeScope = structuredClone(
    session.authoring.persistence.identityScope,
  );
  const runtimeProjection = structuredClone(session);
  runtimeProjection.commitRevision = 3;
  runtimeProjection.phase = "round_1_q1_ready";
  runtimeProjection.runtimeStatus = "active";
  runtimeProjection.pendingProjection = {
    deliberately: "not semantically admitted here",
  };
  runtimeProjection.authoring.persistence.machineHeads[0].state =
    "waiting_for_round_1_responses";

  const reconstructed =
    reconstructSurveySessionJournalIdentity(
      runtimeProjection,
      authenticationKey,
    );
  assert.deepEqual(
    reconstructed.identityBinding,
    beforeBinding,
  );
  assert.deepEqual(
    reconstructed.identityScope,
    beforeScope,
  );
});

await context.test("every initialization prefix rejects same-length changes, suffixes, or initResolve replacement", async () => {
  const { session } = await createCandidate();
  const scope =
    session.authoring.persistence.identityScope.adapterScope;
  const boundary = initializationBoundaryFromScope(scope);

  assert.deepEqual(
    assertR12InitializationDependencyBoundary(
      session,
      boundary,
      { genesisBoundary: "post-bootstrap" },
    ),
    boundary,
  );

  for (const field of [
    "plan",
    "resolverAttempts",
    "resolverReceipts",
    "rehydrationOutputs",
  ]) {
    const suffix = structuredClone(session);
    suffix.dependencies[field].push({
      forbiddenR12Suffix: field,
    });
    assert.throws(
      () => assertR12InitializationDependencyBoundary(
        suffix,
        boundary,
        { genesisBoundary: "post-bootstrap" },
      ),
      {
        code: "SURVEY_SESSION_INITIALIZATION_PREFIX_LENGTH_INVALID",
      },
      `${field} suffix was accepted`,
    );

    if (session.dependencies[field].length > 0) {
      const changed = structuredClone(session);
      changed.dependencies[field][0] = {
        ...changed.dependencies[field][0],
        forbiddenR12PrefixChange: field,
      };
      assert.throws(
        () => assertR12InitializationDependencyBoundary(
          changed,
          boundary,
          { genesisBoundary: "post-bootstrap" },
        ),
        {
          code: "SURVEY_SESSION_INITIALIZATION_BOUNDARY_MISMATCH",
        },
        `${field} same-length prefix change was accepted`,
      );
    }
  }

  const replaced = structuredClone(session);
  replaced.dependencies.outputs.initResolve.resultDigest =
    `sha256:${"f".repeat(64)}`;
  assert.throws(
    () => assertR12InitializationDependencyBoundary(
      replaced,
      boundary,
      { genesisBoundary: "post-bootstrap" },
    ),
    {
      code: "SURVEY_SESSION_INITIALIZATION_BOUNDARY_MISMATCH",
    },
  );
});
});
