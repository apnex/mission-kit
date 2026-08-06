import {
  createHash,
  createHmac,
} from "node:crypto";
import {
  canonicalize,
  sha256Value,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  detachCanonicalStoreValue,
} from "../runtime/store-port.mjs";
import {
  compileJournalIdentityPort,
  journalIdentityScopeDigest,
} from "../runtime/journal-replay.mjs";
import {
  workspaceRevisionState,
} from "../runtime/workspace-application.mjs";
import {
  CANDIDATE_V2_SELECTOR,
  selectSessionContract,
  sessionGenesisRevisionState,
  sessionGenesisSealDigest,
  sessionMachineStateDigest,
} from "./session-semantics.mjs";
import {
  createSurveySessionAdapterScope,
  rederiveSurveySessionAdapterScope,
} from "./session-bootstrap-boundary.mjs";

const identityId = "survey-session-journal-identity";
const recordAuthenticationDomain =
  "mission-kit:survey-v2:session-journal-record-authentication/v1\0";
const identityAlgorithmDescriptor = Object.freeze({
  id: identityId,
  version: "v4",
  genesis: "survey-v2/sessionGenesisSealDigest",
  machineOccurrence: "survey-v2/sessionMachineStateDigest",
  recordAuthentication: "hmac-sha256",
  recordAuthenticationDomain,
  canonicalization: "mission-kit-canonical-json",
  digest: "sha256",
});

export const SURVEY_SESSION_JOURNAL_IDENTITY_ID = identityId;
export const SURVEY_SESSION_JOURNAL_IDENTITY_DIGEST =
  sha256Value(identityAlgorithmDescriptor);
export const SURVEY_SESSION_AUTHORING_MACHINE_ID = "authoring";

const canonicalGenesisMachines = Object.freeze({
  "protocol-start": Object.freeze([
    Object.freeze({ machineId: "authoring", state: "new" }),
    Object.freeze({ machineId: "phase", state: "new" }),
    Object.freeze({ machineId: "runtime", state: "rehydrating" }),
  ]),
  "post-bootstrap": Object.freeze([
    Object.freeze({ machineId: "authoring", state: "new" }),
    Object.freeze({ machineId: "phase", state: "initialized" }),
    Object.freeze({ machineId: "runtime", state: "active" }),
  ]),
});

export class SurveySessionJournalIdentityError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SurveySessionJournalIdentityError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new SurveySessionJournalIdentityError(code, message);
}

function exactKeys(value, required, optional = []) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }
  const allowed = new Set([...required, ...optional]);
  const keys = Object.keys(value);
  return (
    required.every((key) => Object.hasOwn(value, key)) &&
    keys.every((key) => allowed.has(key))
  );
}

function sameValue(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function copyAuthenticationKey(value) {
  if (!(value instanceof Uint8Array) || value.byteLength !== 32) {
    fail(
      "SURVEY_SESSION_AUTHENTICATION_KEY_INVALID",
      "Survey session journal authentication requires exactly 32 externally managed bytes",
    );
  }
  return Buffer.from(value);
}

function authenticationKeyDigest(key) {
  return `sha256:${
    createHash("sha256").update(key).digest("hex")
  }`;
}

function normalizeOptions(options) {
  let normalized;
  try {
    normalized = stableValue(options ?? {});
  } catch (error) {
    fail(
      "SURVEY_SESSION_IDENTITY_OPTIONS_INVALID",
      `Survey session identity options must be canonical JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (
    !exactKeys(normalized, [], [
      "genesisRevisionState",
      "genesisWorkspaceIntegrityDigest",
      "genesisMachines",
      "genesisBoundary",
    ])
  ) {
    fail(
      "SURVEY_SESSION_IDENTITY_OPTIONS_INVALID",
      "Survey session identity options contain an unsupported field",
    );
  }
  return normalized;
}

function adapterScopeFor(session, genesisBoundary) {
  return detachCanonicalStoreValue(
    createSurveySessionAdapterScope(
      session,
      genesisBoundary,
    ),
    "Survey session journal adapter scope",
  );
}

function identitySessionFromScope(scope) {
  const adapterScope = scope.adapterScope;
  return {
    $schema: adapterScope.sessionSchema,
    sessionId: adapterScope.sessionId,
    package: {
      id: adapterScope.packageId,
      version: adapterScope.packageVersion,
      projectionDigest: adapterScope.projectionDigest,
    },
    protocol: {
      id: adapterScope.protocolId,
      version: adapterScope.protocolVersion,
      digest: adapterScope.protocolDigest,
    },
    authoring: {
      persistence: {
        identityScope: scope,
      },
    },
  };
}

function normalizeGenesisMachines(value, genesisBoundary) {
  const expected = canonicalGenesisMachines[genesisBoundary];
  if (!expected) {
    fail(
      "SURVEY_SESSION_GENESIS_BOUNDARY_INVALID",
      "genesisBoundary must be protocol-start or post-bootstrap",
    );
  }
  let machines;
  try {
    machines = detachCanonicalStoreValue(
      value ?? expected,
      "Survey session genesis machines",
    );
  } catch (error) {
    fail(
      "SURVEY_SESSION_GENESIS_MACHINES_INVALID",
      error instanceof Error ? error.message : String(error),
    );
  }
  if (
    !Array.isArray(machines) ||
    machines.length !== expected.length ||
    machines.some(
      (machine) =>
        !exactKeys(machine, ["machineId", "state"]),
    )
  ) {
    fail(
      "SURVEY_SESSION_GENESIS_MACHINES_INVALID",
      "genesisMachines must contain exactly three {machineId,state} values",
    );
  }
  const ordered = [...machines].sort((left, right) =>
    Buffer.from(left.machineId, "utf8").compare(
      Buffer.from(right.machineId, "utf8"),
    ));
  if (!sameValue(ordered, expected)) {
    fail(
      "SURVEY_SESSION_GENESIS_MACHINES_INVALID",
      `genesisMachines must equal the canonical ${genesisBoundary} Survey machine states`,
    );
  }
  return ordered;
}

function bindingFor(scope, authenticationKey) {
  const scopeDigest = journalIdentityScopeDigest(scope);
  return Object.freeze({
    id: identityId,
    digest: sha256Value({
      domain:
        "mission-kit:survey-v2:session-journal-identity-binding/v4",
      algorithmDigest: SURVEY_SESSION_JOURNAL_IDENTITY_DIGEST,
      authenticationKeyDigest:
        authenticationKeyDigest(authenticationKey),
      scopeDigest,
    }),
    scopeDigest,
  });
}

function assertIdentityInvocationScope(actual, expected, operation) {
  if (!sameValue(actual, expected)) {
    fail(
      "SURVEY_SESSION_IDENTITY_SCOPE_MISMATCH",
      `${operation} received an adapter scope other than the pinned Survey session scope`,
    );
  }
}

function rawIdentityConfiguration({
  identityScope,
  authenticationKey,
  persistedBinding,
}) {
  const scope = detachCanonicalStoreValue(
    identityScope,
    "Survey session journal identity scope",
  );
  const key = copyAuthenticationKey(authenticationKey);
  const computedBinding = bindingFor(scope, key);
  if (
    persistedBinding !== undefined &&
    !sameValue(persistedBinding, computedBinding)
  ) {
    fail(
      "SURVEY_SESSION_IDENTITY_BINDING_MISMATCH",
      "The external authentication key does not reproduce the persisted Survey session identity binding",
    );
  }
  const identityBinding = persistedBinding === undefined
    ? computedBinding
    : detachCanonicalStoreValue(
      persistedBinding,
      "persisted Survey session identity binding",
    );
  const identitySession = identitySessionFromScope(scope);
  const identityPort = Object.freeze({
    ...identityBinding,
    genesisChainDigest(adapterScope, genesisRevisionState) {
      assertIdentityInvocationScope(
        adapterScope,
        scope.adapterScope,
        "genesisChainDigest",
      );
      if (
        !sameValue(
          genesisRevisionState,
          scope.genesisRevisionState,
        )
      ) {
        fail(
          "SURVEY_SESSION_GENESIS_REVISION_MISMATCH",
          "genesisChainDigest received a revision state other than the pinned Survey session genesis",
        );
      }
      return sessionGenesisSealDigest(identitySession);
    },
    machineStateDigest(adapterScope, occurrence) {
      assertIdentityInvocationScope(
        adapterScope,
        scope.adapterScope,
        "machineStateDigest",
      );
      return sessionMachineStateDigest(identitySession, occurrence);
    },
    recordAuthenticationDigest(adapterScope, recordCore) {
      assertIdentityInvocationScope(
        adapterScope,
        scope.adapterScope,
        "recordAuthenticationDigest",
      );
      return `sha256:${
        createHmac("sha256", key)
          .update(recordAuthenticationDomain, "utf8")
          .update(canonicalize({
            identityBinding,
            adapterScope,
            recordCore,
          }), "utf8")
          .digest("hex")
      }`;
    },
  });
  const configuration = Object.freeze({
    identityBinding,
    identityScope: scope,
    identityPort,
  });
  // Compilation proves the raw capability and every genesis head before this
  // configuration can reach initialization or persistence.
  compileJournalIdentityPort(configuration);
  return configuration;
}

/**
 * Create the persisted binding/scope and private raw identity capability for
 * one new candidate session. The returned key-bearing capability is runtime
 * only; persist only identityBinding and identityScope.
 */
export function createSurveySessionJournalIdentityConfiguration(
  session,
  authenticationKey,
  options = {},
) {
  selectSessionContract(session, CANDIDATE_V2_SELECTOR);
  const normalized = normalizeOptions(options);
  const genesisBoundary =
    normalized.genesisBoundary ?? "post-bootstrap";
  const genesisMachines = normalizeGenesisMachines(
    normalized.genesisMachines,
    genesisBoundary,
  );
  const genesisRevisionState =
    normalized.genesisRevisionState ??
    (
      genesisBoundary === "post-bootstrap"
        ? workspaceRevisionState(
          session?.authoring?.workspace,
        )
        : sessionGenesisRevisionState(session)
    );
  const genesisWorkspaceIntegrityDigest =
    normalized.genesisWorkspaceIntegrityDigest ??
    session?.authoring?.workspace?.spec?.integrity
      ?.workspaceIntegrityDigest;
  const adapterScope = adapterScopeFor(
    session,
    genesisBoundary,
  );
  const identityForOccurrences = identitySessionFromScope({
    adapterScope,
    genesisRevisionState,
  });
  const genesisMachineHeads = genesisMachines.map(
    ({ machineId, state }) => ({
      machineId,
      state,
      stateDigest: sessionMachineStateDigest(
        identityForOccurrences,
        {
          machineId,
          state,
          journalOrdinal: 0,
        },
      ),
    }),
  );
  const identityScope = detachCanonicalStoreValue({
    genesisRevisionState,
    genesisWorkspaceIntegrityDigest,
    genesisMachineHeads,
    adapterScope,
  }, "new Survey session journal identity scope");
  return rawIdentityConfiguration({
    identityScope,
    authenticationKey,
  });
}

/**
 * Reconstruct and authenticate the exact persisted identity configuration.
 * A wrong key is rejected by its binding commitment even for an empty journal.
 */
export function reconstructSurveySessionJournalIdentity(
  session,
  authenticationKey,
) {
  selectSessionContract(session, CANDIDATE_V2_SELECTOR);
  const persistence = session?.authoring?.persistence;
  if (
    persistence === null ||
    typeof persistence !== "object" ||
    Array.isArray(persistence) ||
    persistence.identityBinding === undefined ||
    persistence.identityScope === undefined
  ) {
    fail(
      "SURVEY_SESSION_IDENTITY_PERSISTENCE_REQUIRED",
      "Candidate session persistence must contain identityBinding and identityScope",
    );
  }
  const scope = detachCanonicalStoreValue(
    persistence.identityScope,
    "persisted Survey session journal identity scope",
  );
  const expectedAdapterScope = rederiveSurveySessionAdapterScope(
    session,
    scope.adapterScope,
  );
  if (!sameValue(scope.adapterScope, expectedAdapterScope)) {
    fail(
      "SURVEY_SESSION_IDENTITY_SCOPE_MISMATCH",
      "The persisted identity scope does not bind this exact Survey session",
    );
  }
  return rawIdentityConfiguration({
    identityScope: scope,
    authenticationKey,
    persistedBinding: persistence.identityBinding,
  });
}

export function compileSurveySessionJournalIdentity(
  session,
  authenticationKey,
) {
  return compileJournalIdentityPort(
    reconstructSurveySessionJournalIdentity(
      session,
      authenticationKey,
    ),
  );
}
