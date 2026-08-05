import { types } from "node:util";
import {
  canonicalize,
  sha256Value,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  journalRecordDigest,
  workspaceIntegrityDigest,
} from "../kernel/digests.mjs";
import {
  validateAuthoringWorkspace,
} from "./workspace-application.mjs";

const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const maximumCanonicalNodes = 200_000;
const maximumCanonicalDepth = 256;

export const AUTHORING_STORE_SNAPSHOT_FIELDS = Object.freeze([
  "storeId",
  "commitRevision",
  "workspace",
  "journal",
  "machineHeads",
  "idempotencyOutcomeView",
  "identityBinding",
  "identityScope",
  "rootSealDigest",
]);

export const AUTHORING_STORE_POST_IMAGE_FIELDS = Object.freeze(
  AUTHORING_STORE_SNAPSHOT_FIELDS.filter(
    (field) => field !== "rootSealDigest",
  ),
);

export const AUTHORING_STORE_EXPECTED_FIELDS = Object.freeze([
  "commitRevision",
  "workspaceIntegrityDigest",
  "journalHeadDigest",
  "rootSealDigest",
]);

const identityBindingFields = Object.freeze([
  "id",
  "digest",
  "scopeDigest",
]);
const identityScopeFields = Object.freeze([
  "genesisRevisionState",
  "genesisWorkspaceIntegrityDigest",
  "genesisMachineHeads",
  "adapterScope",
]);
const revisionStateFields = Object.freeze([
  "semanticRevision",
  "evidenceRevision",
  "semanticStateDigest",
]);
const machineHeadFields = Object.freeze([
  "machineId",
  "state",
  "stateDigest",
]);
const outcomeEntryFields = Object.freeze([
  "machineId",
  "key",
  "recordDigest",
  "operationDigest",
  "commandDigest",
  "payloadDigest",
  "outcome",
]);

export class AuthoringStorePortError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "AuthoringStorePortError";
    this.code = code;
    for (const [key, value] of Object.entries(details)) this[key] = value;
  }
}

function fail(code, message, details) {
  throw new AuthoringStorePortError(code, message, details);
}

function isRecord(value) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    types.isProxy(value)
  ) {
    return false;
  }
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function exactKeys(value, expectedKeys) {
  if (!isRecord(value)) return false;
  const expected = new Set(expectedKeys);
  const keys = Reflect.ownKeys(value);
  if (
    keys.length !== expectedKeys.length ||
    keys.some((key) => typeof key !== "string" || !expected.has(key))
  ) {
    return false;
  }
  return keys.every((key) => {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    return (
      descriptor?.enumerable === true &&
      Object.prototype.hasOwnProperty.call(descriptor, "value")
    );
  });
}

function assertCanonicalGraph(value, label) {
  const seen = new WeakSet();
  const pending = [{ value, depth: 0 }];
  let nodes = 0;
  while (pending.length > 0) {
    const current = pending.pop();
    if (
      current.value === null ||
      typeof current.value !== "object"
    ) {
      continue;
    }
    nodes += 1;
    if (
      nodes > maximumCanonicalNodes ||
      current.depth > maximumCanonicalDepth
    ) {
      fail(
        "STORE_CANONICAL_BOUND_EXCEEDED",
        `${label} exceeds the canonical value traversal bound`,
      );
    }
    if (types.isProxy(current.value)) {
      fail(
        "STORE_CANONICAL_PROXY_FORBIDDEN",
        `${label} contains a proxy`,
      );
    }
    if (seen.has(current.value)) {
      fail(
        "STORE_CANONICAL_ALIAS_FORBIDDEN",
        `${label} contains an alias or cycle`,
      );
    }
    seen.add(current.value);

    if (Array.isArray(current.value)) {
      const keys = Reflect.ownKeys(current.value);
      if (
        keys.length !== current.value.length + 1 ||
        keys.some(
          (key) =>
            key !== "length" &&
            (
              typeof key !== "string" ||
              !/^(?:0|[1-9][0-9]*)$/u.test(key) ||
              Number(key) >= current.value.length
            ),
        )
      ) {
        fail(
          "STORE_CANONICAL_ARRAY_INVALID",
          `${label} contains a sparse or extended array`,
        );
      }
      for (let index = 0; index < current.value.length; index += 1) {
        const descriptor = Object.getOwnPropertyDescriptor(
          current.value,
          String(index),
        );
        if (
          descriptor?.enumerable !== true ||
          !Object.prototype.hasOwnProperty.call(descriptor, "value")
        ) {
          fail(
            "STORE_CANONICAL_ACCESSOR_FORBIDDEN",
            `${label} contains an accessor or hidden array value`,
          );
        }
        pending.push({
          value: descriptor.value,
          depth: current.depth + 1,
        });
      }
      continue;
    }

    const prototype = Object.getPrototypeOf(current.value);
    if (prototype !== Object.prototype && prototype !== null) {
      fail(
        "STORE_CANONICAL_PROTOTYPE_INVALID",
        `${label} contains a non-plain object`,
      );
    }
    const keys = Reflect.ownKeys(current.value);
    if (keys.some((key) => typeof key !== "string")) {
      fail(
        "STORE_CANONICAL_SYMBOL_FORBIDDEN",
        `${label} contains a symbol property`,
      );
    }
    for (const key of keys) {
      const descriptor = Object.getOwnPropertyDescriptor(current.value, key);
      if (
        descriptor?.enumerable !== true ||
        !Object.prototype.hasOwnProperty.call(descriptor, "value")
      ) {
        fail(
          "STORE_CANONICAL_ACCESSOR_FORBIDDEN",
          `${label} contains an accessor or hidden object value`,
        );
      }
      pending.push({
        value: descriptor.value,
        depth: current.depth + 1,
      });
    }
  }
  try {
    canonicalize(value);
  } catch (error) {
    fail(
      "STORE_CANONICAL_VALUE_INVALID",
      `${label} is not canonical JSON: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function deepFreeze(value) {
  const pending = [value];
  while (pending.length > 0) {
    const current = pending.pop();
    if (current === null || typeof current !== "object") continue;
    for (const key of Reflect.ownKeys(current)) {
      if (key === "length" && Array.isArray(current)) continue;
      const descriptor = Object.getOwnPropertyDescriptor(current, key);
      if (
        descriptor &&
        Object.prototype.hasOwnProperty.call(descriptor, "value") &&
        descriptor.value !== null &&
        typeof descriptor.value === "object"
      ) {
        pending.push(descriptor.value);
      }
    }
    Object.freeze(current);
  }
  return value;
}

/**
 * Reject non-canonical object graphs before making a detached, deeply frozen
 * canonical value. In particular, aliases are rejected rather than silently
 * copied because they are not part of the persisted JSON value model.
 */
export function detachCanonicalStoreValue(value, label = "store value") {
  assertCanonicalGraph(value, label);
  return deepFreeze(stableValue(value));
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !digestPattern.test(value)) {
    fail(
      "STORE_DIGEST_INVALID",
      `${label} must be one canonical sha256 digest`,
    );
  }
}

function assertText(value, label, maximum = 256) {
  if (
    typeof value !== "string" ||
    [...value].length < 1 ||
    [...value].length > maximum ||
    !value.isWellFormed() ||
    !/\S/u.test(value)
  ) {
    fail(
      "STORE_TEXT_INVALID",
      `${label} must be bounded non-whitespace Unicode scalar text`,
    );
  }
}

function assertRevision(value, label) {
  if (!Number.isSafeInteger(value) || value < 0) {
    fail(
      "STORE_REVISION_INVALID",
      `${label} must be a non-negative safe integer`,
    );
  }
}

function compareUtf8(left, right) {
  return Buffer.from(left, "utf8").compare(Buffer.from(right, "utf8"));
}

function assertRevisionState(value, label) {
  if (!exactKeys(value, revisionStateFields)) {
    fail(
      "STORE_REVISION_STATE_INVALID",
      `${label} must contain exactly the neutral revision-state fields`,
    );
  }
  assertRevision(value.semanticRevision, `${label}.semanticRevision`);
  assertRevision(value.evidenceRevision, `${label}.evidenceRevision`);
  assertDigest(
    value.semanticStateDigest,
    `${label}.semanticStateDigest`,
  );
}

function assertMachineHeads(value, label) {
  if (!Array.isArray(value)) {
    fail(
      "STORE_MACHINE_HEADS_INVALID",
      `${label} must be an array`,
    );
  }
  const seen = new Set();
  let previous = null;
  for (const [index, head] of value.entries()) {
    if (!exactKeys(head, machineHeadFields)) {
      fail(
        "STORE_MACHINE_HEAD_INVALID",
        `${label}/${index} must contain exactly machineId, state, and stateDigest`,
      );
    }
    assertText(head.machineId, `${label}/${index}/machineId`, 160);
    assertText(head.state, `${label}/${index}/state`, 160);
    assertDigest(head.stateDigest, `${label}/${index}/stateDigest`);
    if (seen.has(head.machineId)) {
      fail(
        "STORE_MACHINE_HEAD_DUPLICATE",
        `${label} contains duplicate machineId ${head.machineId}`,
      );
    }
    if (
      previous !== null &&
      compareUtf8(previous, head.machineId) >= 0
    ) {
      fail(
        "STORE_MACHINE_HEAD_ORDER_INVALID",
        `${label} must be strictly UTF-8 machine-id ordered`,
      );
    }
    seen.add(head.machineId);
    previous = head.machineId;
  }
}

function assertIdentity(value) {
  if (!exactKeys(value.identityBinding, identityBindingFields)) {
    fail(
      "STORE_IDENTITY_BINDING_INVALID",
      "identityBinding must be exactly {id,digest,scopeDigest}",
    );
  }
  assertText(value.identityBinding.id, "identityBinding.id", 160);
  assertDigest(value.identityBinding.digest, "identityBinding.digest");
  assertDigest(
    value.identityBinding.scopeDigest,
    "identityBinding.scopeDigest",
  );
  if (!exactKeys(value.identityScope, identityScopeFields)) {
    fail(
      "STORE_IDENTITY_SCOPE_INVALID",
      "identityScope must be exactly {genesisRevisionState,genesisWorkspaceIntegrityDigest,genesisMachineHeads,adapterScope}",
    );
  }
  assertRevisionState(
    value.identityScope.genesisRevisionState,
    "identityScope.genesisRevisionState",
  );
  assertDigest(
    value.identityScope.genesisWorkspaceIntegrityDigest,
    "identityScope.genesisWorkspaceIntegrityDigest",
  );
  assertMachineHeads(
    value.identityScope.genesisMachineHeads,
    "identityScope.genesisMachineHeads",
  );
  if (!isRecord(value.identityScope.adapterScope)) {
    fail(
      "STORE_IDENTITY_SCOPE_INVALID",
      "identityScope.adapterScope must be a canonical object",
    );
  }
  const observedScopeDigest = identityScopeDigest(
    value.identityScope,
  );
  if (observedScopeDigest !== value.identityBinding.scopeDigest) {
    fail(
      "STORE_IDENTITY_SCOPE_DIGEST_MISMATCH",
      "identityScope does not match identityBinding.scopeDigest",
    );
  }
}

function assertWorkspace(workspace) {
  const specFields = [
    "profile",
    "protocol",
    "authoringState",
    "semanticRevision",
    "evidenceRevision",
    "resourceVersions",
    "activeHeads",
    "dependencyEdges",
    "handoffProducts",
    "history",
    "openAssignment",
    "integrity",
  ];
  if (
    !isRecord(workspace) ||
    !exactKeys(
      workspace,
      ["apiVersion", "kind", "metadata", "spec"],
    ) ||
    workspace.apiVersion !== "authoring.mission-kit/v1alpha1" ||
    workspace.kind !== "AuthoringWorkspace" ||
    !isRecord(workspace.metadata) ||
    !isRecord(workspace.spec) ||
    !exactKeys(workspace.spec, specFields) ||
    !isRecord(workspace.spec.integrity) ||
    !exactKeys(
      workspace.spec.integrity,
      ["semanticStateDigest", "workspaceIntegrityDigest"],
    )
  ) {
    fail(
      "STORE_WORKSPACE_INVALID",
      "workspace must be one AuthoringWorkspace-shaped canonical object",
    );
  }
  assertText(
    workspace.spec.authoringState,
    "workspace.spec.authoringState",
    160,
  );
  assertRevision(
    workspace.spec.semanticRevision,
    "workspace.spec.semanticRevision",
  );
  assertRevision(
    workspace.spec.evidenceRevision,
    "workspace.spec.evidenceRevision",
  );
  assertDigest(
    workspace.spec.integrity.semanticStateDigest,
    "workspace.spec.integrity.semanticStateDigest",
  );
  assertDigest(
    workspace.spec.integrity.workspaceIntegrityDigest,
    "workspace.spec.integrity.workspaceIntegrityDigest",
  );
  let observed;
  try {
    observed = workspaceIntegrityDigest(workspace);
  } catch (error) {
    fail(
      "STORE_WORKSPACE_INTEGRITY_INVALID",
      `workspace integrity cannot be derived: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
  if (observed !== workspace.spec.integrity.workspaceIntegrityDigest) {
    fail(
      "STORE_WORKSPACE_INTEGRITY_MISMATCH",
      "workspace does not match its workspaceIntegrityDigest",
    );
  }
  try {
    validateAuthoringWorkspace(workspace);
  } catch (error) {
    fail(
      "STORE_WORKSPACE_INVALID",
      `workspace violates its closed runtime shape: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

function assertJournal(journal, commitRevision) {
  if (!Array.isArray(journal)) {
    fail("STORE_JOURNAL_INVALID", "journal must be an array");
  }
  if (journal.length !== commitRevision) {
    fail(
      "STORE_COMMIT_REVISION_MISMATCH",
      "commitRevision must equal journal length",
    );
  }
  const commitIds = new Set();
  const recordDigests = new Set();
  const idempotencyKeys = new Set();
  for (const [index, record] of journal.entries()) {
    if (!isRecord(record)) {
      fail(
        "STORE_JOURNAL_RECORD_INVALID",
        `journal/${index} must be a canonical object`,
      );
    }
    if (record.ordinal !== index + 1) {
      fail(
        "STORE_JOURNAL_ORDINAL_INVALID",
        `journal/${index} has a non-contiguous ordinal`,
      );
    }
    assertText(record.commitId, `journal/${index}/commitId`, 160);
    assertDigest(record.recordDigest, `journal/${index}/recordDigest`);
    assertDigest(
      record.operationDigest,
      `journal/${index}/operationDigest`,
    );
    if (
      !isRecord(record.idempotency) ||
      typeof record.idempotency.machineId !== "string" ||
      typeof record.idempotency.key !== "string"
    ) {
      fail(
        "STORE_JOURNAL_IDEMPOTENCY_INVALID",
        `journal/${index}/idempotency is invalid`,
      );
    }
    assertText(
      record.idempotency.machineId,
      `journal/${index}/idempotency/machineId`,
      160,
    );
    assertText(
      record.idempotency.key,
      `journal/${index}/idempotency/key`,
      512,
    );
    assertDigest(record.commandDigest, `journal/${index}/commandDigest`);
    assertDigest(record.payloadDigest, `journal/${index}/payloadDigest`);
    let observedRecordDigest;
    try {
      observedRecordDigest = journalRecordDigest(record);
    } catch (error) {
      fail(
        "STORE_JOURNAL_RECORD_INVALID",
        `journal/${index} identity cannot be derived: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
    if (observedRecordDigest !== record.recordDigest) {
      fail(
        "STORE_JOURNAL_RECORD_DIGEST_MISMATCH",
        `journal/${index} does not match recordDigest`,
      );
    }
    const idempotencyIdentity =
      `${record.idempotency.machineId}\u0000${record.idempotency.key}`;
    if (commitIds.has(record.commitId)) {
      fail(
        "STORE_JOURNAL_COMMIT_ID_DUPLICATE",
        `journal contains duplicate commitId ${record.commitId}`,
      );
    }
    if (recordDigests.has(record.recordDigest)) {
      fail(
        "STORE_JOURNAL_RECORD_DIGEST_DUPLICATE",
        `journal contains duplicate recordDigest ${record.recordDigest}`,
      );
    }
    if (idempotencyKeys.has(idempotencyIdentity)) {
      fail(
        "STORE_IDEMPOTENCY_KEY_DUPLICATE",
        "journal contains a duplicate machine-qualified idempotency key",
      );
    }
    commitIds.add(record.commitId);
    recordDigests.add(record.recordDigest);
    idempotencyKeys.add(idempotencyIdentity);
  }
}

function assertOutcomeView(view, journal) {
  if (!Array.isArray(view) || view.length !== journal.length) {
    fail(
      "STORE_OUTCOME_VIEW_LENGTH_INVALID",
      "idempotencyOutcomeView must contain one entry per journal record",
    );
  }
  const identities = new Set();
  for (const [index, entry] of view.entries()) {
    if (!exactKeys(entry, outcomeEntryFields)) {
      fail(
        "STORE_OUTCOME_ENTRY_INVALID",
        `idempotencyOutcomeView/${index} must contain exactly the seven outcome fields`,
      );
    }
    assertText(
      entry.machineId,
      `idempotencyOutcomeView/${index}/machineId`,
      160,
    );
    assertText(
      entry.key,
      `idempotencyOutcomeView/${index}/key`,
      512,
    );
    assertDigest(
      entry.recordDigest,
      `idempotencyOutcomeView/${index}/recordDigest`,
    );
    assertDigest(
      entry.operationDigest,
      `idempotencyOutcomeView/${index}/operationDigest`,
    );
    assertDigest(
      entry.commandDigest,
      `idempotencyOutcomeView/${index}/commandDigest`,
    );
    assertDigest(
      entry.payloadDigest,
      `idempotencyOutcomeView/${index}/payloadDigest`,
    );
    if (!isRecord(entry.outcome)) {
      fail(
        "STORE_OUTCOME_INVALID",
        `idempotencyOutcomeView/${index}/outcome must be one closed canonical object`,
      );
    }
    const identity = `${entry.machineId}\u0000${entry.key}`;
    if (identities.has(identity)) {
      fail(
        "STORE_IDEMPOTENCY_KEY_DUPLICATE",
        "idempotencyOutcomeView contains a duplicate machine-qualified key",
      );
    }
    identities.add(identity);
    const record = journal[index];
    if (
      entry.machineId !== record.idempotency.machineId ||
      entry.key !== record.idempotency.key ||
      entry.recordDigest !== record.recordDigest ||
      entry.operationDigest !== record.operationDigest ||
      entry.commandDigest !== record.commandDigest ||
      entry.payloadDigest !== record.payloadDigest
    ) {
      fail(
        "STORE_OUTCOME_JOURNAL_MISMATCH",
        `idempotencyOutcomeView/${index} does not bind journal/${index}`,
      );
    }
  }
}

function assertAuthoringHead(snapshot, authoringMachineId) {
  if (authoringMachineId === undefined) return;
  assertText(authoringMachineId, "authoringMachineId", 160);
  const head = snapshot.machineHeads.find(
    (entry) => entry.machineId === authoringMachineId,
  );
  if (!head) {
    fail(
      "STORE_AUTHORING_HEAD_MISSING",
      `machineHeads does not contain authoring machine ${authoringMachineId}`,
    );
  }
  if (head.state !== snapshot.workspace.spec.authoringState) {
    fail(
      "STORE_AUTHORING_HEAD_STATE_MISMATCH",
      "the authoring machine head does not equal workspace authoringState",
    );
  }
}

/**
 * Validate and return a detached, deeply frozen private store snapshot.
 * Journal machine-edge replay remains the coordinator's responsibility; this
 * boundary verifies the closed physical projection and its direct identities.
 */
export function assertAuthoringStoreSnapshot(
  value,
  { authoringMachineId } = {},
) {
  const snapshot = detachCanonicalStoreValue(
    value,
    "AuthoringStoreSnapshot",
  );
  if (!exactKeys(snapshot, AUTHORING_STORE_SNAPSHOT_FIELDS)) {
    fail(
      "STORE_SNAPSHOT_FIELDS_INVALID",
      "AuthoringStoreSnapshot contains missing or additional fields",
    );
  }
  assertText(snapshot.storeId, "storeId", 256);
  assertRevision(snapshot.commitRevision, "commitRevision");
  assertWorkspace(snapshot.workspace);
  assertJournal(snapshot.journal, snapshot.commitRevision);
  assertMachineHeads(snapshot.machineHeads, "machineHeads");
  assertOutcomeView(snapshot.idempotencyOutcomeView, snapshot.journal);
  assertIdentity(snapshot);
  assertDigest(snapshot.rootSealDigest, "rootSealDigest");
  assertAuthoringHead(snapshot, authoringMachineId);
  return snapshot;
}

function assertExpected(value) {
  const expected = detachCanonicalStoreValue(
    value,
    "compare-and-commit expected token",
  );
  if (!exactKeys(expected, AUTHORING_STORE_EXPECTED_FIELDS)) {
    fail(
      "STORE_EXPECTED_TOKEN_FIELDS_INVALID",
      "expected token must contain exactly four fields",
    );
  }
  assertRevision(expected.commitRevision, "expected.commitRevision");
  assertDigest(
    expected.workspaceIntegrityDigest,
    "expected.workspaceIntegrityDigest",
  );
  assertDigest(
    expected.journalHeadDigest,
    "expected.journalHeadDigest",
  );
  assertDigest(expected.rootSealDigest, "expected.rootSealDigest");
  return expected;
}

function assertIdentityAuthority(snapshot, identityAuthority) {
  if (
    !identityAuthority ||
    typeof identityAuthority !== "object" ||
    !exactKeys(identityAuthority.binding, identityBindingFields) ||
    typeof identityAuthority.genesisChainDigest !== "function"
  ) {
    fail(
      "STORE_IDENTITY_AUTHORITY_INVALID",
      "a compiled identity authority is required",
    );
  }
  if (
    canonicalize(identityAuthority.binding) !==
      canonicalize(snapshot.identityBinding) ||
    canonicalize(identityAuthority.identityScope) !==
      canonicalize(snapshot.identityScope)
  ) {
    fail(
      "STORE_IDENTITY_AUTHORITY_MISMATCH",
      "configured identity authority does not match the snapshot binding and scope",
    );
  }
}

/**
 * Derive the exact four-field compare-and-commit token. A compiled,
 * scope-bound JournalIdentityPort supplies the empty-journal chain head.
 */
export function snapshotExpectedToken(snapshotValue, identityAuthority) {
  const snapshot = assertAuthoringStoreSnapshot(snapshotValue);
  assertIdentityAuthority(snapshot, identityAuthority);
  let journalHeadDigest;
  if (snapshot.journal.length === 0) {
    journalHeadDigest = identityAuthority.genesisChainDigest();
    assertDigest(journalHeadDigest, "identity genesis chain digest");
  } else {
    journalHeadDigest =
      snapshot.journal[snapshot.journal.length - 1].recordDigest;
  }
  return detachCanonicalStoreValue({
    commitRevision: snapshot.commitRevision,
    workspaceIntegrityDigest:
      snapshot.workspace.spec.integrity.workspaceIntegrityDigest,
    journalHeadDigest,
    rootSealDigest: snapshot.rootSealDigest,
  }, "derived compare-and-commit expected token");
}

export function assertAuthoringStoreExpectedToken(value) {
  return assertExpected(value);
}

function sameValue(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function assertJournalAppend(current, next) {
  if (next.length !== current.length + 1) {
    fail(
      "STORE_JOURNAL_APPEND_REQUIRED",
      "next journal must append exactly one record",
    );
  }
  for (let index = 0; index < current.length; index += 1) {
    if (!sameValue(current[index], next[index])) {
      fail(
        "STORE_JOURNAL_PREFIX_CHANGED",
        "next journal must preserve the exact prior prefix",
      );
    }
  }
}

function assertOutcomeAppend(current, next) {
  if (next.length !== current.length + 1) {
    fail(
      "STORE_OUTCOME_APPEND_REQUIRED",
      "next idempotencyOutcomeView must append exactly one outcome",
    );
  }
  for (let index = 0; index < current.length; index += 1) {
    if (!sameValue(current[index], next[index])) {
      fail(
        "STORE_OUTCOME_PREFIX_CHANGED",
        "next idempotencyOutcomeView must preserve the exact prior prefix",
      );
    }
  }
}

/**
 * Validate a complete neutral post-image. rootSealDigest is deliberately
 * absent: only the physical adapter may seal and publish the resulting root.
 */
export function assertAuthoringStorePostImage(
  currentValue,
  nextValue,
  { authoringMachineId } = {},
) {
  const current = assertAuthoringStoreSnapshot(
    currentValue,
    { authoringMachineId },
  );
  const next = detachCanonicalStoreValue(
    nextValue,
    "AuthoringStoreSnapshot post-image",
  );
  if (!exactKeys(next, AUTHORING_STORE_POST_IMAGE_FIELDS)) {
    fail(
      "STORE_POST_IMAGE_FIELDS_INVALID",
      "next post-image contains missing or additional fields",
    );
  }
  if (next.storeId !== current.storeId) {
    fail(
      "STORE_ID_CHANGED",
      "next post-image cannot change storeId",
    );
  }
  if (next.commitRevision !== current.commitRevision + 1) {
    fail(
      "STORE_COMMIT_REVISION_INVALID",
      "next commitRevision must increment exactly once",
    );
  }
  if (
    !sameValue(next.identityBinding, current.identityBinding) ||
    !sameValue(next.identityScope, current.identityScope)
  ) {
    fail(
      "STORE_IDENTITY_CHANGED",
      "next post-image cannot change identity binding or scope",
    );
  }
  assertJournalAppend(current.journal, next.journal);
  assertOutcomeAppend(
    current.idempotencyOutcomeView,
    next.idempotencyOutcomeView,
  );
  const provisional = {
    ...next,
    rootSealDigest: "sha256:".padEnd(71, "0"),
  };
  assertAuthoringStoreSnapshot(
    provisional,
    { authoringMachineId },
  );
  return next;
}

export function snapshotSealCore(snapshotValue) {
  const snapshot = detachCanonicalStoreValue(
    snapshotValue,
    "AuthoringStoreSnapshot seal input",
  );
  const keys = Reflect.ownKeys(snapshot);
  const hasSeal = keys.includes("rootSealDigest");
  const expectedFields = hasSeal
    ? AUTHORING_STORE_SNAPSHOT_FIELDS
    : AUTHORING_STORE_POST_IMAGE_FIELDS;
  if (!exactKeys(snapshot, expectedFields)) {
    fail(
      "STORE_SEAL_CORE_FIELDS_INVALID",
      "store seal input is not one complete neutral snapshot projection",
    );
  }
  if (!hasSeal) return snapshot;
  return detachCanonicalStoreValue(
    Object.fromEntries(
      Object.entries(snapshot).filter(
        ([field]) => field !== "rootSealDigest",
      ),
    ),
    "AuthoringStoreSnapshot seal core",
  );
}

export function identityScopeDigest(identityScope) {
  const detached = detachCanonicalStoreValue(
    identityScope,
    "JournalIdentityPort scope",
  );
  if (!exactKeys(detached, identityScopeFields)) {
    fail(
      "STORE_IDENTITY_SCOPE_INVALID",
      "identity scope must contain the exact neutral genesis envelope",
    );
  }
  assertRevisionState(
    detached.genesisRevisionState,
    "identityScope.genesisRevisionState",
  );
  assertDigest(
    detached.genesisWorkspaceIntegrityDigest,
    "identityScope.genesisWorkspaceIntegrityDigest",
  );
  assertMachineHeads(
    detached.genesisMachineHeads,
    "identityScope.genesisMachineHeads",
  );
  if (!isRecord(detached.adapterScope)) {
    fail(
      "STORE_IDENTITY_SCOPE_INVALID",
      "identityScope.adapterScope must be a canonical object",
    );
  }
  return sha256Value({
    domain: "mission-kit:authoring:journal-identity-scope/v1",
    identityScope: detached,
  });
}
