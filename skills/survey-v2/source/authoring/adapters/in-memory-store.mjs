import { createHash, createHmac } from "node:crypto";
import { types } from "node:util";
import {
  canonicalize,
  sha256Value,
} from "../kernel/canonical.mjs";
import {
  AUTHORING_STORE_POST_IMAGE_FIELDS,
  AuthoringStorePortError,
  assertAuthoringStorePostImage,
  assertAuthoringStoreSnapshot,
  assertAuthoringStoreExpectedToken,
  detachCanonicalStoreValue,
  identityScopeDigest,
  snapshotExpectedToken,
  snapshotSealCore,
} from "../runtime/store-port.mjs";
import {
  isCompiledJournalIdentityPort,
  replayAuthoringJournal,
} from "../runtime/journal-replay.mjs";

const backingStates = new WeakMap();
const storeStates = new WeakMap();
const writerStates = new WeakMap();
const digestPattern = /^sha256:[0-9a-f]{64}$/u;

const rootSealDomain =
  "mission-kit:authoring:in-memory-store-root:v1\0";
const genesisDomain =
  "mission-kit:authoring:in-memory-journal-genesis:v1\0";
const machineOccurrenceDomain =
  "mission-kit:authoring:in-memory-machine-occurrence:v1\0";
const recordAuthenticationDomain =
  "mission-kit:authoring:in-memory-journal-record-authentication:v1\0";
const identityAlgorithmDescriptor = Object.freeze({
  id: "in-memory-journal-identity",
  version: "v2",
  genesisDomain,
  machineOccurrenceDomain,
  recordAuthenticationDomain,
  canonicalization: "mission-kit-canonical-json",
  digest: "sha256",
  authentication: "hmac-sha256",
});

export const IN_MEMORY_JOURNAL_IDENTITY_DIGEST =
  sha256Value(identityAlgorithmDescriptor);

export const IN_MEMORY_STORE_FAULT_POINTS = Object.freeze({
  BEFORE_ASSEMBLY: "before-assembly",
  DURING_ASSEMBLY: "during-assembly",
  AFTER_PREPARATION_BEFORE_PUBLISH:
    "after-preparation-before-publish",
  AFTER_PUBLISH_BEFORE_ACKNOWLEDGEMENT:
    "after-publish-before-acknowledgement",
});

const faultPointSet = new Set(
  Object.values(IN_MEMORY_STORE_FAULT_POINTS),
);

export class InMemoryAuthoringStoreError extends AuthoringStorePortError {
  constructor(code, message, details = {}) {
    super(code, message, details);
    this.name = "InMemoryAuthoringStoreError";
  }
}

function fail(code, message, details) {
  throw new InMemoryAuthoringStoreError(code, message, details);
}

function domainDigest(domain, value) {
  return `sha256:${
    createHash("sha256")
      .update(domain, "utf8")
      .update(canonicalize(value), "utf8")
      .digest("hex")
  }`;
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
        Object.prototype.hasOwnProperty.call(descriptor, "value")
      );
    })
  );
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !digestPattern.test(value)) {
    fail(
      "IN_MEMORY_DIGEST_INVALID",
      `${label} must be one canonical sha256 digest`,
    );
  }
}

function assertBacking(backing) {
  const state =
    backing !== null &&
    typeof backing === "object"
      ? backingStates.get(backing)
      : undefined;
  if (!state) {
    fail(
      "IN_MEMORY_BACKING_INVALID",
      "backing is not an in-memory authoring store backing",
    );
  }
  return state;
}

function rootSealDigest(snapshotValue) {
  const core = snapshotSealCore(snapshotValue);
  return domainDigest(rootSealDomain, core);
}

function sealSnapshot(postImage) {
  const detached = detachCanonicalStoreValue(
    postImage,
    "in-memory store post-image",
  );
  if (!exactKeys(detached, AUTHORING_STORE_POST_IMAGE_FIELDS)) {
    fail(
      "IN_MEMORY_POST_IMAGE_INVALID",
      "in-memory post-image must contain the exact neutral fields",
    );
  }
  return detachCanonicalStoreValue({
    ...detached,
    rootSealDigest: rootSealDigest(detached),
  }, "sealed in-memory store snapshot");
}

function assertRootSeal(snapshot) {
  const observed = rootSealDigest(snapshot);
  if (observed !== snapshot.rootSealDigest) {
    fail(
      "IN_MEMORY_ROOT_SEAL_MISMATCH",
      "stored root does not match rootSealDigest",
    );
  }
}

function authorityIdentity(authority) {
  return [
    authority.binding.id,
    authority.binding.digest,
    authority.binding.scopeDigest,
  ].join("\u0000");
}

function assertCompiledIdentityAuthority(authority) {
  if (
    !isCompiledJournalIdentityPort(authority) ||
    !exactKeys(authority.binding, ["id", "digest", "scopeDigest"]) ||
    typeof authority.genesisChainDigest !== "function" ||
    typeof authority.machineStateDigest !== "function" ||
    typeof authority.recordAuthenticationDigest !== "function"
  ) {
    fail(
      "IN_MEMORY_IDENTITY_AUTHORITY_INVALID",
      "identityAuthorities must contain compiled JournalIdentityPort values",
    );
  }
  assertDigest(authority.binding.digest, "identity authority digest");
  assertDigest(
    authority.binding.scopeDigest,
    "identity authority scopeDigest",
  );
  if (
    authority.binding.scopeDigest !==
      identityScopeDigest(authority.identityScope)
  ) {
    fail(
      "IN_MEMORY_IDENTITY_AUTHORITY_INVALID",
      "identity authority scope does not match its binding",
    );
  }
}

function normalizeAuthorities({ identityAuthority, identityAuthorities }) {
  if (
    identityAuthority !== undefined &&
    identityAuthorities !== undefined
  ) {
    fail(
      "IN_MEMORY_IDENTITY_AUTHORITY_INVALID",
      "provide identityAuthority or identityAuthorities, not both",
    );
  }
  const source = identityAuthorities ??
    (identityAuthority === undefined ? [] : [identityAuthority]);
  if (
    !Array.isArray(source) ||
    types.isProxy(source) ||
    source.length < 1 ||
    Reflect.ownKeys(source).length !== source.length + 1 ||
    Array.from(
      { length: source.length },
      (_, index) => index,
    ).some((index) => {
      const descriptor = Object.getOwnPropertyDescriptor(
        source,
        String(index),
      );
      return (
        descriptor?.enumerable !== true ||
        !Object.prototype.hasOwnProperty.call(
          descriptor,
          "value",
        )
      );
    })
  ) {
    fail(
      "IN_MEMORY_IDENTITY_AUTHORITY_REQUIRED",
      "at least one densely ordered compiled JournalIdentityPort is required",
    );
  }
  const index = new Map();
  for (const authority of source) {
    assertCompiledIdentityAuthority(authority);
    const identity = authorityIdentity(authority);
    if (index.has(identity)) {
      fail(
        "IN_MEMORY_IDENTITY_AUTHORITY_DUPLICATE",
        "identityAuthorities contains a duplicate binding",
      );
    }
    index.set(identity, authority);
  }
  return index;
}

function resolveAuthority(state, snapshot) {
  const identity = [
    snapshot.identityBinding.id,
    snapshot.identityBinding.digest,
    snapshot.identityBinding.scopeDigest,
  ].join("\u0000");
  const authority = state.authorities.get(identity);
  if (
    !authority ||
    !sameValue(authority.identityScope, snapshot.identityScope)
  ) {
    fail(
      "IN_MEMORY_IDENTITY_AUTHORITY_MISMATCH",
      "no configured JournalIdentityPort matches the stored binding and scope",
    );
  }
  return authority;
}

function assertStoredSnapshot(state, snapshot) {
  const detached = assertAuthoringStoreSnapshot(
    snapshot,
    { authoringMachineId: state.authoringMachineId },
  );
  assertRootSeal(detached);
  const identity = resolveAuthority(state, detached);
  replayAuthoringJournal({
    commitRevision: detached.commitRevision,
    workspace: detached.workspace,
    journal: detached.journal,
    machineHeads: detached.machineHeads,
    idempotencyOutcomeView: detached.idempotencyOutcomeView,
    authoringMachineId: state.authoringMachineId,
    identity,
  });
  return detached;
}

function createEntry(snapshot) {
  return {
    root: snapshot,
    queueTail: Promise.resolve(),
    fence: 0,
    active: false,
  };
}

function requireEntry(backingState, storeId) {
  if (typeof storeId !== "string" || !backingState.entries.has(storeId)) {
    fail(
      "IN_MEMORY_STORE_NOT_FOUND",
      `in-memory authoring store ${String(storeId)} does not exist`,
      { storeId },
    );
  }
  return backingState.entries.get(storeId);
}

function assertWriterCapability(capability) {
  const state =
    capability !== null &&
    typeof capability === "object"
      ? writerStates.get(capability)
      : undefined;
  if (!state) {
    fail(
      "IN_MEMORY_WRITER_INVALID",
      "writer capability is invalid",
    );
  }
  if (state.entry.fence !== state.fence) {
    fail(
      "IN_MEMORY_WRITER_FENCE_STALE",
      "writer capability has a stale private fence",
    );
  }
  if (!state.active || !state.entry.active) {
    fail(
      "IN_MEMORY_WRITER_EXPIRED",
      "writer capability is no longer active",
    );
  }
  return state;
}

async function runFault(state, point, snapshot) {
  if (!state.faultInjector) return;
  if (!faultPointSet.has(point)) {
    fail(
      "IN_MEMORY_FAULT_POINT_INVALID",
      `unknown in-memory fault point ${point}`,
    );
  }
  await state.faultInjector(
    detachCanonicalStoreValue({
      point,
      storeId: snapshot.storeId,
      snapshot,
    }, `fault context ${point}`),
  );
}

async function compareAndCommitOperation(
  capability,
  writerState,
  request,
) {
  const detachedRequest = detachCanonicalStoreValue(
    request,
    "compare-and-commit request",
  );
  if (!exactKeys(detachedRequest, ["expected", "next"])) {
    fail(
      "IN_MEMORY_COMPARE_REQUEST_INVALID",
      "compareAndCommit accepts exactly {expected,next}",
    );
  }
  const expected = assertAuthoringStoreExpectedToken(
    detachedRequest.expected,
  );
  const current = assertStoredSnapshot(
    writerState.storeState,
    writerState.entry.root,
  );
  const authority = resolveAuthority(
    writerState.storeState,
    current,
  );
  const actual = snapshotExpectedToken(current, authority);
  if (!sameValue(expected, actual)) {
    return Object.freeze({ status: "conflict" });
  }

  await runFault(
    writerState.storeState,
    IN_MEMORY_STORE_FAULT_POINTS.BEFORE_ASSEMBLY,
    current,
  );
  const next = assertAuthoringStorePostImage(
    current,
    detachedRequest.next,
    {
      authoringMachineId:
        writerState.storeState.authoringMachineId,
    },
  );
  await runFault(
    writerState.storeState,
    IN_MEMORY_STORE_FAULT_POINTS.DURING_ASSEMBLY,
    current,
  );
  const prepared = assertAuthoringStoreSnapshot(
    sealSnapshot(next),
    {
      authoringMachineId:
        writerState.storeState.authoringMachineId,
    },
  );
  assertStoredSnapshot(writerState.storeState, prepared);
  await runFault(
    writerState.storeState,
    IN_MEMORY_STORE_FAULT_POINTS
      .AFTER_PREPARATION_BEFORE_PUBLISH,
    current,
  );
  assertWriterCapability(capability);

  // This is the sole mutation of visible backing state: one complete-root
  // pointer swap after the full neutral post-image has been validated.
  writerState.entry.root = prepared;

  await runFault(
    writerState.storeState,
    IN_MEMORY_STORE_FAULT_POINTS
      .AFTER_PUBLISH_BEFORE_ACKNOWLEDGEMENT,
    prepared,
  );
  return Object.freeze({
    status: "committed",
    snapshot: detachCanonicalStoreValue(
      prepared,
      "committed in-memory snapshot",
    ),
  });
}

function makeWriter(storeState, entry, fence) {
  const capability = Object.freeze({
    async read() {
      const writerState = assertWriterCapability(capability);
      const current = assertStoredSnapshot(
        writerState.storeState,
        writerState.entry.root,
      );
      return detachCanonicalStoreValue(
        current,
        "writer snapshot read",
      );
    },

    compareAndCommit(request) {
      let writerState;
      try {
        writerState = assertWriterCapability(capability);
        if (writerState.used) {
          fail(
            "IN_MEMORY_WRITER_ALREADY_USED",
            "writer compareAndCommit capability is single-use",
          );
        }
        writerState.used = true;
      } catch (error) {
        return Promise.reject(error);
      }
      const operation = compareAndCommitOperation(
        capability,
        writerState,
        request,
      );
      writerState.pending.add(operation);
      const remove = () => writerState.pending.delete(operation);
      operation.then(remove, remove);
      return operation;
    },
  });
  writerStates.set(capability, {
    storeState,
    entry,
    fence,
    active: true,
    used: false,
    pending: new Set(),
  });
  return capability;
}

export function inMemoryRootSealDigest(snapshotValue) {
  return rootSealDigest(snapshotValue);
}

/**
 * Build the neutral identity scope shared by the in-memory fixture port and
 * the persisted snapshot. adapterScope is deliberately opaque to the kernel.
 */
export function createInMemoryJournalIdentityScope(value) {
  const scope = detachCanonicalStoreValue(
    value,
    "in-memory JournalIdentityPort scope",
  );
  if (
    !exactKeys(scope, [
      "genesisRevisionState",
      "genesisWorkspaceIntegrityDigest",
      "genesisMachineHeads",
      "adapterScope",
    ])
  ) {
    fail(
      "IN_MEMORY_IDENTITY_SCOPE_INVALID",
      "identity scope must be exactly {genesisRevisionState,genesisWorkspaceIntegrityDigest,genesisMachineHeads,adapterScope}",
    );
  }
  // Reuse the normative complete-scope validator and digest derivation.
  identityScopeDigest(scope);
  return scope;
}

export function inMemoryGenesisChainDigest(
  adapterScope,
  genesisRevisionState,
) {
  return domainDigest(genesisDomain, {
    adapterScope: detachCanonicalStoreValue(
      adapterScope,
      "in-memory identity adapterScope",
    ),
    genesisRevisionState: detachCanonicalStoreValue(
      genesisRevisionState,
      "in-memory identity genesisRevisionState",
    ),
  });
}

export function inMemoryMachineStateDigest(adapterScope, occurrence) {
  return domainDigest(machineOccurrenceDomain, {
    adapterScope: detachCanonicalStoreValue(
      adapterScope,
      "in-memory identity adapterScope",
    ),
    occurrence: detachCanonicalStoreValue(
      occurrence,
      "in-memory identity machine occurrence",
    ),
  });
}

function copyAuthenticationKey(value) {
  if (!(value instanceof Uint8Array) || value.byteLength !== 32) {
    fail(
      "IN_MEMORY_AUTHENTICATION_KEY_INVALID",
      "in-memory journal authentication key must be exactly 32 externally managed bytes",
    );
  }
  return Buffer.from(value);
}

function authenticationKeyDigest(key) {
  return `sha256:${
    createHash("sha256").update(key).digest("hex")
  }`;
}

export function inMemoryRecordAuthenticationDigest(
  authenticationKey,
  identityBinding,
  adapterScope,
  recordCore,
) {
  const key = copyAuthenticationKey(authenticationKey);
  return `sha256:${
    createHmac("sha256", key)
      .update(recordAuthenticationDomain, "utf8")
      .update(canonicalize({
        identityBinding: detachCanonicalStoreValue(
          identityBinding,
          "in-memory identity binding",
        ),
        adapterScope: detachCanonicalStoreValue(
          adapterScope,
          "in-memory identity adapterScope",
        ),
        recordCore: detachCanonicalStoreValue(
          recordCore,
          "in-memory JournalRecord authentication core",
        ),
      }), "utf8")
      .digest("hex")
  }`;
}

/**
 * Supply a path-independent, domain-separated raw JournalIdentityPort plus its
 * exact persisted binding/scope. Pass this triple through
 * compileJournalIdentityPort before configuring the store.
 */
export function createInMemoryJournalIdentityConfiguration(
  value,
  authenticationKey,
) {
  const key = copyAuthenticationKey(authenticationKey);
  const source = detachCanonicalStoreValue(
    value,
    "in-memory JournalIdentityPort configuration",
  );
  let identityScopeValue = source;
  if (
    exactKeys(source, [
      "genesisRevisionState",
      "genesisWorkspaceIntegrityDigest",
      "genesisMachines",
      "adapterScope",
    ])
  ) {
    if (!Array.isArray(source.genesisMachines)) {
      fail(
        "IN_MEMORY_IDENTITY_CONFIGURATION_INVALID",
        "genesisMachines must be an ordered array",
      );
    }
    const genesisMachineHeads = source.genesisMachines.map(
      (machine, index) => {
        if (!exactKeys(machine, ["machineId", "state"])) {
          fail(
            "IN_MEMORY_IDENTITY_CONFIGURATION_INVALID",
            `genesisMachines/${index} must be exactly {machineId,state}`,
          );
        }
        return {
          machineId: machine.machineId,
          state: machine.state,
          stateDigest: inMemoryMachineStateDigest(
            source.adapterScope,
            {
              machineId: machine.machineId,
              state: machine.state,
              journalOrdinal: 0,
            },
          ),
        };
      },
    );
    identityScopeValue = {
      genesisRevisionState: source.genesisRevisionState,
      genesisWorkspaceIntegrityDigest:
        source.genesisWorkspaceIntegrityDigest,
      genesisMachineHeads,
      adapterScope: source.adapterScope,
    };
  }
  const identityScope = createInMemoryJournalIdentityScope(
    identityScopeValue,
  );
  const binding = Object.freeze({
    id: identityAlgorithmDescriptor.id,
    digest: sha256Value({
      domain:
        "mission-kit:authoring:in-memory-journal-identity-binding/v2",
      algorithmDigest: IN_MEMORY_JOURNAL_IDENTITY_DIGEST,
      authenticationKeyDigest: authenticationKeyDigest(key),
    }),
    scopeDigest: identityScopeDigest(identityScope),
  });
  const identityPort = Object.freeze({
    ...binding,
    genesisChainDigest(adapterScope, genesisRevisionState) {
      return inMemoryGenesisChainDigest(
        adapterScope,
        genesisRevisionState,
      );
    },
    machineStateDigest(adapterScope, occurrence) {
      return inMemoryMachineStateDigest(adapterScope, occurrence);
    },
    recordAuthenticationDigest(adapterScope, recordCore) {
      return inMemoryRecordAuthenticationDigest(
        key,
        binding,
        adapterScope,
        recordCore,
      );
    },
  });
  return Object.freeze({
    identityBinding: binding,
    identityScope,
    identityPort,
  });
}

/**
 * An opaque backing carries only immutable complete-root pointers and
 * process-local lock/fence state. Call export/import for cold reconstruction.
 */
export function createInMemoryStoreBacking() {
  const backing = Object.freeze(Object.create(null));
  backingStates.set(backing, { entries: new Map() });
  return backing;
}

export function exportInMemoryStoreBacking(backing) {
  const state = assertBacking(backing);
  const snapshots = [...state.entries.values()]
    .map((entry) => entry.root)
    .sort((left, right) =>
      Buffer.from(left.storeId, "utf8").compare(
        Buffer.from(right.storeId, "utf8"),
      ));
  return detachCanonicalStoreValue({
    format: "mission-kit/authoring-in-memory-backing/v1",
    snapshots,
  }, "in-memory store backing export");
}

export function importInMemoryStoreBacking(value) {
  const exported = detachCanonicalStoreValue(
    value,
    "in-memory store backing import",
  );
  if (
    !exactKeys(exported, ["format", "snapshots"]) ||
    exported.format !==
      "mission-kit/authoring-in-memory-backing/v1" ||
    !Array.isArray(exported.snapshots)
  ) {
    fail(
      "IN_MEMORY_BACKING_IMPORT_INVALID",
      "in-memory backing export has an invalid closed envelope",
    );
  }
  const backing = createInMemoryStoreBacking();
  const state = assertBacking(backing);
  let previousStoreId = null;
  for (const snapshotValue of exported.snapshots) {
    const snapshot = assertAuthoringStoreSnapshot(snapshotValue);
    assertRootSeal(snapshot);
    if (
      previousStoreId !== null &&
      Buffer.from(previousStoreId, "utf8").compare(
        Buffer.from(snapshot.storeId, "utf8"),
      ) >= 0
    ) {
      fail(
        "IN_MEMORY_BACKING_ORDER_INVALID",
        "backing snapshots must be strictly UTF-8 store-id ordered",
      );
    }
    state.entries.set(snapshot.storeId, createEntry(snapshot));
    previousStoreId = snapshot.storeId;
  }
  return backing;
}

/**
 * Create the canonical logical adapter. `initialSnapshots` are unsealed
 * eight-field neutral post-images; the adapter, never the caller, creates the
 * initial root seal.
 */
export function createInMemoryAuthoringStore({
  backing = createInMemoryStoreBacking(),
  initialSnapshots = [],
  identityAuthority,
  identityAuthorities,
  authoringMachineId,
  faultInjector,
} = {}) {
  const backingState = assertBacking(backing);
  if (!Array.isArray(initialSnapshots)) {
    fail(
      "IN_MEMORY_INITIAL_SNAPSHOTS_INVALID",
      "initialSnapshots must be an array",
    );
  }
  const detachedInitialSnapshots = detachCanonicalStoreValue(
    initialSnapshots,
    "initialSnapshots",
  );
  if (
    typeof authoringMachineId !== "string" ||
    authoringMachineId.length === 0
  ) {
    fail(
      "IN_MEMORY_AUTHORING_MACHINE_REQUIRED",
      "authoringMachineId is required",
    );
  }
  if (
    faultInjector !== undefined &&
    typeof faultInjector !== "function"
  ) {
    fail(
      "IN_MEMORY_FAULT_INJECTOR_INVALID",
      "faultInjector must be a function",
    );
  }
  const authorities = normalizeAuthorities({
    identityAuthority,
    identityAuthorities,
  });
  const state = {
    backingState,
    authorities,
    authoringMachineId,
    faultInjector,
  };
  for (const entry of backingState.entries.values()) {
    assertStoredSnapshot(state, entry.root);
  }

  const stagedInitialEntries = [];
  const stagedStoreIds = new Set();
  for (const initialValue of detachedInitialSnapshots) {
    const initial = detachCanonicalStoreValue(
      initialValue,
      "initial in-memory store snapshot",
    );
    if (!exactKeys(initial, AUTHORING_STORE_POST_IMAGE_FIELDS)) {
      fail(
        "IN_MEMORY_INITIAL_SNAPSHOT_INVALID",
        "initial snapshot must omit adapter-owned rootSealDigest",
      );
    }
    if (
      backingState.entries.has(initial.storeId) ||
      stagedStoreIds.has(initial.storeId)
    ) {
      fail(
        "IN_MEMORY_STORE_ALREADY_EXISTS",
        `in-memory authoring store ${initial.storeId} already exists`,
      );
    }
    const sealed = assertStoredSnapshot(
      state,
      sealSnapshot(initial),
    );
    stagedInitialEntries.push([
      initial.storeId,
      createEntry(sealed),
    ]);
    stagedStoreIds.add(initial.storeId);
  }

  for (const [storeId, entry] of stagedInitialEntries) {
    backingState.entries.set(storeId, entry);
  }

  const store = Object.freeze({
    async read(storeId) {
      const storeState = storeStates.get(store);
      const entry = requireEntry(
        storeState.backingState,
        storeId,
      );
      const snapshot = assertStoredSnapshot(
        storeState,
        entry.root,
      );
      return detachCanonicalStoreValue(
        snapshot,
        "in-memory store read",
      );
    },

    async withWriter(storeId, callback) {
      if (typeof callback !== "function") {
        fail(
          "IN_MEMORY_WRITER_CALLBACK_INVALID",
          "withWriter requires one callback",
        );
      }
      const storeState = storeStates.get(store);
      const entry = requireEntry(
        storeState.backingState,
        storeId,
      );
      let release;
      const prior = entry.queueTail;
      entry.queueTail = new Promise((resolve) => {
        release = resolve;
      });
      await prior;
      entry.fence += 1;
      entry.active = true;
      const writer = makeWriter(storeState, entry, entry.fence);
      try {
        return await callback(writer);
      } finally {
        const writerState = writerStates.get(writer);
        if (writerState) {
          await Promise.allSettled([...writerState.pending]);
          writerState.active = false;
        }
        entry.active = false;
        release();
      }
    },
  });
  storeStates.set(store, state);
  return store;
}
