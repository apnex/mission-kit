import {
  lstat,
} from "node:fs/promises";
import path from "node:path";
import {
  canonicalize,
  isUtf8RoundTrip,
  sha256Value,
  stableValue,
  withoutKey,
} from "../kernel/canonical.mjs";
import {
  AuthoringStorePortError,
  assertAuthoringStoreExpectedToken,
  assertAuthoringStorePostImage,
  assertAuthoringStoreSnapshot,
  detachCanonicalStoreValue,
  snapshotExpectedToken,
} from "../runtime/store-port.mjs";
import {
  compileJournalIdentityPort,
  isCompiledJournalIdentityPort,
  replayAuthoringJournal,
} from "../runtime/journal-replay.mjs";
import {
  atomicWriteJson,
  readNoFollowBytes,
  sealSession,
  withSessionLockOptions,
} from "../../executables/runtime/lib/storage.mjs";
import {
  validateById as validateGeneratedById,
} from "../../../generated/validators.mjs";
import {
  CANDIDATE_V2_SELECTOR,
  SESSION_SCHEMA_V2,
  SessionContractSelectionError,
  assertSessionSemantics,
  selectSessionContract,
} from "./session-semantics.mjs";
import {
  SURVEY_SESSION_AUTHORING_MACHINE_ID,
  reconstructSurveySessionJournalIdentity,
} from "./session-journal-identity.mjs";

const sessionFileName = "session.json";
const requiredMachineIds = Object.freeze([
  "authoring",
  "phase",
  "runtime",
]);

export class SurveySessionStoreError extends AuthoringStorePortError {
  constructor(code, message, details = {}) {
    super(code, message, details);
    this.name = "SurveySessionStoreError";
  }
}

function fail(code, message, details) {
  throw new SurveySessionStoreError(code, message, details);
}

function sameValue(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function exactKeys(value, fields) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }
  const expected = new Set(fields);
  const keys = Reflect.ownKeys(value);
  return (
    keys.length === fields.length &&
    keys.every(
      (key) => typeof key === "string" && expected.has(key),
    ) &&
    keys.every((key) => {
      const descriptor = Object.getOwnPropertyDescriptor(value, key);
      return (
        descriptor?.enumerable === true &&
        Object.prototype.hasOwnProperty.call(
          descriptor,
          "value",
        )
      );
    })
  );
}

function assertCandidateSelector(selector) {
  if (selector !== CANDIDATE_V2_SELECTOR) {
    throw new SessionContractSelectionError(
      "EXPLICIT_CANDIDATE_SELECTOR_REQUIRED",
      "The Survey session store requires the explicit v2-authoring-candidate selector",
    );
  }
}

function captureAuthenticationKey(value) {
  if (!(value instanceof Uint8Array) || value.byteLength !== 32) {
    fail(
      "SURVEY_SESSION_AUTHENTICATION_KEY_INVALID",
      "Survey session storage requires exactly 32 externally managed authentication bytes",
    );
  }
  return Buffer.from(value);
}

function resolveRuntimeIdentity(
  session,
  {
    authenticationKey,
    identity,
  },
) {
  if (
    (authenticationKey === undefined) ===
      (identity === undefined)
  ) {
    fail(
      "SURVEY_SESSION_IDENTITY_AUTHORITY_INVALID",
      "exactly one authenticationKey or compiled identity is required",
    );
  }
  const resolved = authenticationKey === undefined
    ? identity
    : compileJournalIdentityPort(
      reconstructSurveySessionJournalIdentity(
        session,
        authenticationKey,
      ),
    );
  if (!isCompiledJournalIdentityPort(resolved)) {
    fail(
      "SURVEY_SESSION_IDENTITY_AUTHORITY_INVALID",
      "identity must be one compiled JournalIdentityPort",
    );
  }
  const persistence = session.authoring.persistence;
  if (
    !sameValue(
      resolved.binding,
      persistence.identityBinding,
    ) ||
    !sameValue(
      resolved.identityScope,
      persistence.identityScope,
    )
  ) {
    fail(
      "SURVEY_SESSION_IDENTITY_BINDING_MISMATCH",
      "runtime identity authority differs from the persisted Survey session binding or scope",
    );
  }
  return resolved;
}

function normalizeRunDirectory(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.includes("\0")
  ) {
    fail(
      "SURVEY_SESSION_RUN_DIRECTORY_INVALID",
      "runDirectory must be one nonempty filesystem path",
    );
  }
  return path.resolve(value);
}

async function assertExistingDirectoryNoFollow(directory) {
  const parsed = path.parse(directory);
  let current = parsed.root;
  const segments = directory
    .slice(parsed.root.length)
    .split(path.sep)
    .filter(Boolean);
  for (const segment of segments) {
    current = path.join(current, segment);
    const stat = await lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) {
      fail(
        "SURVEY_SESSION_DIRECTORY_UNSAFE",
        `Survey session path contains a non-directory or symlink: ${current}`,
      );
    }
  }
}

function assertCanonicalAuthoringMachineId(value) {
  const machineId =
    value ?? SURVEY_SESSION_AUTHORING_MACHINE_ID;
  if (machineId !== SURVEY_SESSION_AUTHORING_MACHINE_ID) {
    fail(
      "SURVEY_SESSION_AUTHORING_MACHINE_INVALID",
      "Survey session persistence uses the canonical authoring machine id authoring",
    );
  }
  return machineId;
}

/**
 * Project one complete Survey session root into K13's closed neutral snapshot.
 * snapshotDigest is the sole root seal; it is not copied into a second
 * persisted field.
 */
export function projectSessionAuthoringSnapshot(
  session,
  {
    authoringMachineId =
      SURVEY_SESSION_AUTHORING_MACHINE_ID,
  } = {},
) {
  const machineId =
    assertCanonicalAuthoringMachineId(authoringMachineId);
  const persistence = session?.authoring?.persistence;
  const projected = {
    storeId: session?.sessionId,
    commitRevision: session?.commitRevision,
    workspace: session?.authoring?.workspace,
    journal: session?.journal,
    machineHeads: persistence?.machineHeads,
    idempotencyOutcomeView:
      persistence?.idempotencyOutcomeView,
    identityBinding: persistence?.identityBinding,
    identityScope: persistence?.identityScope,
    rootSealDigest: session?.snapshotDigest,
  };
  return assertAuthoringStoreSnapshot(projected, {
    authoringMachineId: machineId,
  });
}

export function verifySurveySessionSnapshotDigest(session) {
  const observed = sha256Value(
    withoutKey(session, "snapshotDigest"),
  );
  if (session?.snapshotDigest !== observed) {
    fail(
      "SURVEY_SESSION_ROOT_SEAL_MISMATCH",
      "Candidate session bytes do not match snapshotDigest",
      {
        expected: session?.snapshotDigest,
        observed,
      },
    );
  }
  return observed;
}

function validateSurveySessionPublicRoot(
  sessionValue,
  { selector },
) {
  assertCandidateSelector(selector);
  const session = detachCanonicalStoreValue(
    sessionValue,
    "candidate Survey session root",
  );
  selectSessionContract(session, selector);
  const structure = validateGeneratedById(
    SESSION_SCHEMA_V2,
    session,
  );
  if (!structure.valid) {
    fail(
      "SURVEY_SESSION_SCHEMA_INVALID",
      `Candidate session violates its generated schema: ${
        structure.errors.slice(0, 8).join("; ")
      }`,
      { errors: structure.errors },
    );
  }
  verifySurveySessionSnapshotDigest(session);
  assertSessionSemantics(session);
  return session;
}

/**
 * Validate one in-memory candidate root through every production boundary:
 * explicit selection, generated schema, complete-root seal, Survey semantics,
 * external-key identity reconstruction, neutral snapshot validation, and K13
 * authenticated replay.
 */
export function validateSurveySessionStoreRoot(
  sessionValue,
  {
    selector,
    authenticationKey,
    identity,
    authoringMachineId =
      SURVEY_SESSION_AUTHORING_MACHINE_ID,
  },
) {
  assertCandidateSelector(selector);
  const machineId =
    assertCanonicalAuthoringMachineId(authoringMachineId);
  const session = validateSurveySessionPublicRoot(
    sessionValue,
    { selector },
  );
  const runtimeIdentity = resolveRuntimeIdentity(
    session,
    { authenticationKey, identity },
  );
  const snapshot = projectSessionAuthoringSnapshot(
    session,
    { authoringMachineId: machineId },
  );
  const replay = replayAuthoringJournal({
    commitRevision: snapshot.commitRevision,
    workspace: snapshot.workspace,
    journal: snapshot.journal,
    machineHeads: snapshot.machineHeads,
    idempotencyOutcomeView:
      snapshot.idempotencyOutcomeView,
    authoringMachineId: machineId,
    identity: runtimeIdentity,
  });
  return Object.freeze({
    session,
    snapshot,
    identity: runtimeIdentity,
    replay,
  });
}

async function readCandidateRootValue({
  runDirectory,
  selector,
}) {
  assertCandidateSelector(selector);
  const directory = normalizeRunDirectory(runDirectory);
  await assertExistingDirectoryNoFollow(directory);
  const target = path.join(directory, sessionFileName);
  const bytes = await readNoFollowBytes(target);
  if (!isUtf8RoundTrip(bytes)) {
    fail(
      "SURVEY_SESSION_UTF8_INVALID",
      "Candidate session.json is not exact UTF-8",
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(bytes.toString("utf8"));
  } catch (error) {
    fail(
      "SURVEY_SESSION_JSON_INVALID",
      `Candidate session.json is not valid JSON: ${
      error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  return validateSurveySessionPublicRoot(parsed, {
    selector,
  });
}

async function readVerifiedCandidateRoot({
  runDirectory,
  selector,
  authenticationKey,
  identity,
  authoringMachineId,
}) {
  const session = await readCandidateRootValue({
    runDirectory,
    selector,
  });
  return validateSurveySessionStoreRoot(session, {
    selector,
    authenticationKey,
    identity,
    authoringMachineId,
  });
}

/**
 * Resolve only the authenticated-key lookup material after the complete
 * public candidate contract, root seal, and Survey semantics have passed.
 * This operation neither accepts a key nor creates filesystem state.
 */
export async function readCandidateSessionIdentityBinding({
  runDirectory,
  selector,
}) {
  const session = await readCandidateSessionPublicRoot({
    runDirectory,
    selector,
  });
  return detachCanonicalStoreValue({
    sessionId: session.sessionId,
    slug: session.slug,
    identityBinding:
      session.authoring.persistence.identityBinding,
  }, "candidate Survey session identity lookup");
}

export async function readCandidateSessionPublicRoot({
  runDirectory,
  selector,
}) {
  return readCandidateRootValue({
    runDirectory,
    selector,
  });
}

export async function readVerifiedCandidateSession({
  runDirectory,
  selector,
  authenticationKey,
  identity,
}) {
  assertCandidateSelector(selector);
  const key = authenticationKey === undefined
    ? undefined
    : captureAuthenticationKey(authenticationKey);
  const verified = await readVerifiedCandidateRoot({
    runDirectory,
    selector,
    authenticationKey: key,
    identity,
    authoringMachineId:
      SURVEY_SESSION_AUTHORING_MACHINE_ID,
  });
  return verified.session;
}

/**
 * Return a detached sealed root without mutating the caller's object.
 */
export function sealSurveySessionRoot(session) {
  const root = stableValue(session);
  sealSession(root);
  return detachCanonicalStoreValue(
    root,
    "sealed Survey session root",
  );
}

function synchronizedSessionPostImage(
  currentSession,
  nextSnapshot,
) {
  const heads = new Map(
    nextSnapshot.machineHeads.map((head) => [
      head.machineId,
      head,
    ]),
  );
  for (const machineId of requiredMachineIds) {
    if (!heads.has(machineId)) {
      fail(
        "SURVEY_SESSION_MACHINE_HEAD_REQUIRED",
        `Survey session post-image has no ${machineId} machine head`,
      );
    }
  }
  const root = stableValue(currentSession);
  root.commitRevision = nextSnapshot.commitRevision;
  root.authoring.workspace =
    stableValue(nextSnapshot.workspace);
  root.journal = stableValue(nextSnapshot.journal);
  root.authoring.persistence = {
    machineHeads: stableValue(nextSnapshot.machineHeads),
    idempotencyOutcomeView:
      stableValue(nextSnapshot.idempotencyOutcomeView),
    identityBinding:
      stableValue(nextSnapshot.identityBinding),
    identityScope: stableValue(nextSnapshot.identityScope),
  };
  root.phase = heads.get("phase").state;
  root.runtimeStatus = heads.get("runtime").state;
  return sealSurveySessionRoot(root);
}

function assertStoreId(storeId, sessionId) {
  if (
    typeof storeId !== "string" ||
    storeId.length === 0
  ) {
    fail(
      "SURVEY_SESSION_STORE_ID_INVALID",
      "storeId must be one nonempty string",
    );
  }
  if (storeId !== sessionId) {
    fail(
      "SURVEY_SESSION_STORE_NOT_FOUND",
      `Survey session store ${storeId} does not match the session root`,
      { storeId },
    );
  }
}

function createWriter({
  initial,
  runDirectory,
  selector,
  authenticationKey,
  identity,
  authoringMachineId,
  storeId,
}) {
  let active = true;
  let used = false;
  let current = initial;
  const pending = new Set();

  const assertActive = () => {
    if (!active) {
      fail(
        "SURVEY_SESSION_WRITER_EXPIRED",
        "Survey session writer capability is no longer active",
      );
    }
  };

  const compareAndCommitOperation = async (requestValue) => {
    const request = detachCanonicalStoreValue(
      requestValue,
      "Survey session compare-and-commit request",
    );
    if (!exactKeys(request, ["expected", "next"])) {
      fail(
        "SURVEY_SESSION_COMPARE_REQUEST_INVALID",
        "compareAndCommit accepts exactly {expected,next}",
      );
    }
    const expected = assertAuthoringStoreExpectedToken(
      request.expected,
    );

    // Re-read while holding the physical lock so every lock-cooperating
    // Survey session writer compares the four-field token against the latest
    // complete root before it prepares a publication.
    current = await readVerifiedCandidateRoot({
      runDirectory,
      selector,
      authenticationKey,
      identity,
      authoringMachineId,
    });
    assertStoreId(storeId, current.session.sessionId);
    const actual = snapshotExpectedToken(
      current.snapshot,
      current.identity,
    );
    if (!sameValue(expected, actual)) {
      return Object.freeze({ status: "conflict" });
    }
    const next = assertAuthoringStorePostImage(
      current.snapshot,
      request.next,
      { authoringMachineId },
    );
    const root = synchronizedSessionPostImage(
      current.session,
      next,
    );

    // Re-run the entire read-side proof against the assembled root before
    // atomic publication. No invalid partial state can reach session.json.
    const prepared = validateSurveySessionStoreRoot(root, {
      selector,
      authenticationKey,
      identity,
      authoringMachineId,
    });
    assertActive();
    await atomicWriteJson(
      path.join(runDirectory, sessionFileName),
      prepared.session,
    );
    current = prepared;
    return Object.freeze({
      status: "committed",
      snapshot: detachCanonicalStoreValue(
        prepared.snapshot,
        "committed Survey session authoring snapshot",
      ),
    });
  };

  const writer = Object.freeze({
    async read() {
      assertActive();
      return detachCanonicalStoreValue(
        current.snapshot,
        "Survey session writer read",
      );
    },

    compareAndCommit(request) {
      try {
        assertActive();
        if (used) {
          fail(
            "SURVEY_SESSION_WRITER_ALREADY_USED",
            "Survey session compareAndCommit capability is single-use",
          );
        }
        used = true;
      } catch (error) {
        return Promise.reject(error);
      }
      const operation = compareAndCommitOperation(request);
      pending.add(operation);
      const remove = () => pending.delete(operation);
      operation.then(remove, remove);
      return operation;
    },
  });

  return Object.freeze({
    writer,
    async close() {
      await Promise.allSettled([...pending]);
      active = false;
    },
  });
}

/**
 * Bind K13's neutral store port to one physical candidate session.json root.
 * A read-only preflight authenticates the root before lock acquisition, then
 * the locked path repeats verification before granting a writer capability.
 */
export function createSurveySessionStore({
  runDirectory,
  selector,
  authenticationKey,
  identity,
  authoringMachineId =
    SURVEY_SESSION_AUTHORING_MACHINE_ID,
}) {
  assertCandidateSelector(selector);
  const directory = normalizeRunDirectory(runDirectory);
  const key = authenticationKey === undefined
    ? undefined
    : captureAuthenticationKey(authenticationKey);
  if (
    (key === undefined) === (identity === undefined)
  ) {
    fail(
      "SURVEY_SESSION_IDENTITY_AUTHORITY_INVALID",
      "session store requires exactly one authenticationKey or compiled identity",
    );
  }
  if (
    identity !== undefined &&
    !isCompiledJournalIdentityPort(identity)
  ) {
    fail(
      "SURVEY_SESSION_IDENTITY_AUTHORITY_INVALID",
      "session store identity must be one compiled JournalIdentityPort",
    );
  }
  const machineId =
    assertCanonicalAuthoringMachineId(authoringMachineId);

  return Object.freeze({
    async read(storeId) {
      const verified = await readVerifiedCandidateRoot({
        runDirectory: directory,
        selector,
        authenticationKey: key,
        identity,
        authoringMachineId: machineId,
      });
      assertStoreId(storeId, verified.session.sessionId);
      return detachCanonicalStoreValue(
        verified.snapshot,
        "Survey session store read",
      );
    },

    async withWriter(storeId, callback) {
      if (typeof callback !== "function") {
        fail(
          "SURVEY_SESSION_WRITER_CALLBACK_INVALID",
          "withWriter requires one callback",
        );
      }

      // This read-only proof ensures a bad selector, root, or key cannot even
      // create the lock file. The locked verification remains authoritative.
      const preflight = await readVerifiedCandidateRoot({
        runDirectory: directory,
        selector,
        authenticationKey: key,
        identity,
        authoringMachineId: machineId,
      });
      assertStoreId(storeId, preflight.session.sessionId);

      return withSessionLockOptions(
        directory,
        async () => {
          const locked = await readVerifiedCandidateRoot({
            runDirectory: directory,
            selector,
            authenticationKey: key,
            identity,
            authoringMachineId: machineId,
          });
          assertStoreId(storeId, locked.session.sessionId);
          const capability = createWriter({
            initial: locked,
            runDirectory: directory,
            selector,
            authenticationKey: key,
            identity,
            authoringMachineId: machineId,
            storeId,
          });
          try {
            return await callback(capability.writer);
          } finally {
            await capability.close();
          }
        },
      );
    },
  });
}
