import { createHash, createHmac } from "node:crypto";
import { types } from "node:util";
import {
  canonicalize,
  sha256Value,
  stableValue,
} from "../kernel/canonical.mjs";
import {
  assignmentDigest,
  commitReceiptDigest,
  contextClosureDigest,
  mutationDigest,
  normalizedSubmissionDigest,
  projectJournalRecordAuthenticationCore,
  projectionArtifactDigest,
  requestCoreDigest,
  resourceIntegrityDigest,
  resourceReferenceFrom,
  workspaceIntegrityDigest,
  workspaceSemanticStateDigest,
} from "../kernel/digests.mjs";
import {
  assertCommitOutcome,
  assertEvidenceCommitPlan,
  assertJournalRecord,
  deriveSupersededDescendants,
} from "./commit-records.mjs";
import {
  applyEvidenceWorkspace,
  applyTransitionWorkspace,
  workspaceRevisionState,
} from "./workspace-application.mjs";

const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const semanticIdPattern =
  /^[a-z][a-z0-9]*(?:[._:/-][a-z0-9]+)*$/u;
const stateIdPattern = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/u;
const compiledIdentityPorts = new WeakSet();

export class AuthoringJournalReplayError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "AuthoringJournalReplayError";
    this.code = code;
    for (const [key, value] of Object.entries(details)) this[key] = value;
  }
}

function fail(code, message, details) {
  throw new AuthoringJournalReplayError(code, message, details);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function exactKeys(value, required, optional = []) {
  if (!isRecord(value)) return false;
  const allowed = new Set([...required, ...optional]);
  return (
    required.every((key) => Object.hasOwn(value, key)) &&
    Object.keys(value).every((key) => allowed.has(key))
  );
}

function compareUtf8(left, right) {
  return Buffer.compare(
    Buffer.from(left, "utf8"),
    Buffer.from(right, "utf8"),
  );
}

function assertCanonicalTree(value, label) {
  const seen = new WeakSet();
  const pending = [{ value, path: label }];
  while (pending.length > 0) {
    const current = pending.pop();
    const candidate = current.value;
    if (candidate === null || typeof candidate !== "object") continue;
    if (types.isProxy(candidate)) {
      fail(
        "JOURNAL_INPUT_NON_CANONICAL",
        `${current.path} cannot contain a Proxy`,
      );
    }
    if (seen.has(candidate)) {
      fail(
        "JOURNAL_INPUT_ALIAS_REJECTED",
        `${current.path} aliases another canonical-tree node`,
      );
    }
    seen.add(candidate);
    const prototype = Object.getPrototypeOf(candidate);
    if (
      !Array.isArray(candidate) &&
      prototype !== Object.prototype &&
      prototype !== null
    ) {
      fail(
        "JOURNAL_INPUT_NON_CANONICAL",
        `${current.path} must contain only plain canonical objects`,
      );
    }
    const enumerableKeys = Object.keys(candidate);
    const ownKeys = Reflect.ownKeys(candidate);
    if (
      ownKeys.some((key) => typeof key !== "string") ||
      ownKeys.filter((key) => key !== "length").length !==
        enumerableKeys.length
    ) {
      fail(
        "JOURNAL_INPUT_NON_CANONICAL",
        `${current.path} contains a symbol or non-enumerable property`,
      );
    }
    if (Array.isArray(candidate)) {
      if (
        enumerableKeys.length !== candidate.length ||
        Array.from(
          { length: candidate.length },
          (_, index) => index,
        ).some((index) => !Object.hasOwn(candidate, index))
      ) {
        fail(
          "JOURNAL_INPUT_NON_CANONICAL",
          `${current.path} cannot contain a sparse array`,
        );
      }
    }
    for (const key of enumerableKeys) {
      const descriptor = Object.getOwnPropertyDescriptor(candidate, key);
      if (
        !descriptor?.enumerable ||
        !Object.hasOwn(descriptor, "value")
      ) {
        fail(
          "JOURNAL_INPUT_NON_CANONICAL",
          `${current.path}.${key} cannot be an accessor`,
        );
      }
      pending.push({
        value: descriptor.value,
        path: `${current.path}.${key}`,
      });
    }
  }
}

function detached(value, label, { rejectAliases = true } = {}) {
  if (rejectAliases) assertCanonicalTree(value, label);
  try {
    return stableValue(value);
  } catch (error) {
    fail(
      "JOURNAL_INPUT_NON_CANONICAL",
      `${label} must be one canonical JSON value: ${error.message}`,
    );
  }
}

function deepFreeze(value) {
  if (value === null || typeof value !== "object") return value;
  const pending = [value];
  while (pending.length > 0) {
    const current = pending.pop();
    if (Object.isFrozen(current)) continue;
    for (const child of Object.values(current)) {
      if (
        child !== null &&
        typeof child === "object" &&
        !Object.isFrozen(child)
      ) {
        pending.push(child);
      }
    }
    Object.freeze(current);
  }
  return value;
}

function frozen(value, label = "journal result") {
  return deepFreeze(detached(value, label));
}

function same(left, right) {
  return canonicalize(left) === canonicalize(right);
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !digestPattern.test(value)) {
    fail(
      "JOURNAL_DIGEST_INVALID",
      `${label} must be one canonical sha256 digest`,
    );
  }
}

function assertSemanticId(value, label) {
  if (
    typeof value !== "string" ||
    value.length > 160 ||
    !semanticIdPattern.test(value)
  ) {
    fail(
      "JOURNAL_ID_INVALID",
      `${label} must be one semantic identifier`,
    );
  }
}

function assertStateId(value, label) {
  if (
    typeof value !== "string" ||
    value.length > 80 ||
    !stateIdPattern.test(value)
  ) {
    fail(
      "JOURNAL_MACHINE_HEAD_INVALID",
      `${label} must be one state identifier`,
    );
  }
}

function assertRevisionState(value, label) {
  if (
    !exactKeys(
      value,
      ["semanticRevision", "evidenceRevision", "semanticStateDigest"],
    ) ||
    !Number.isInteger(value.semanticRevision) ||
    value.semanticRevision < 0 ||
    !Number.isInteger(value.evidenceRevision) ||
    value.evidenceRevision < 0
  ) {
    fail(
      "JOURNAL_REVISION_STATE_INVALID",
      `${label} must be one closed non-negative revision state`,
    );
  }
  assertDigest(value.semanticStateDigest, `${label}.semanticStateDigest`);
}

function assertMachineHead(head, label) {
  if (
    !exactKeys(head, ["machineId", "state", "stateDigest"]) ||
    typeof head.state !== "string"
  ) {
    fail(
      "JOURNAL_MACHINE_HEAD_INVALID",
      `${label} must be exactly {machineId,state,stateDigest}`,
    );
  }
  assertSemanticId(head.machineId, `${label}.machineId`);
  assertStateId(head.state, `${label}.state`);
  assertDigest(head.stateDigest, `${label}.stateDigest`);
}

function assertMachineHeads(heads, label) {
  if (!Array.isArray(heads) || heads.length === 0) {
    fail(
      "JOURNAL_MACHINE_HEAD_INVALID",
      `${label} must be a non-empty ordered machine-head array`,
    );
  }
  let prior;
  heads.forEach((head, index) => {
    assertMachineHead(head, `${label}[${index}]`);
    if (
      prior !== undefined &&
      compareUtf8(prior, head.machineId) >= 0
    ) {
      fail(
        "JOURNAL_MACHINE_HEAD_ORDER_INVALID",
        `${label} must be unique and UTF-8 machine-id ordered`,
      );
    }
    prior = head.machineId;
  });
}

function assertIdentityScope(scope) {
  if (
    !exactKeys(
      scope,
      [
        "genesisRevisionState",
        "genesisWorkspaceIntegrityDigest",
        "genesisMachineHeads",
        "adapterScope",
      ],
    )
  ) {
    fail(
      "JOURNAL_IDENTITY_SCOPE_INVALID",
      "identityScope must be exactly {genesisRevisionState,genesisWorkspaceIntegrityDigest,genesisMachineHeads,adapterScope}",
    );
  }
  assertRevisionState(
    scope.genesisRevisionState,
    "identityScope.genesisRevisionState",
  );
  assertDigest(
    scope.genesisWorkspaceIntegrityDigest,
    "identityScope.genesisWorkspaceIntegrityDigest",
  );
  assertMachineHeads(
    scope.genesisMachineHeads,
    "identityScope.genesisMachineHeads",
  );
  if (!isRecord(scope.adapterScope)) {
    fail(
      "JOURNAL_IDENTITY_SCOPE_INVALID",
      "identityScope.adapterScope must be one canonical adapter-owned object",
    );
  }
}

export function journalIdentityScopeDigest(identityScope) {
  const stable = detached(identityScope, "identityScope");
  assertIdentityScope(stable);
  return sha256Value({
    domain: "mission-kit:authoring:journal-identity-scope/v1",
    identityScope: stable,
  });
}

function assertBinding(binding, label) {
  if (
    !exactKeys(binding, ["id", "digest", "scopeDigest"])
  ) {
    fail(
      "JOURNAL_IDENTITY_BINDING_INVALID",
      `${label} must be exactly {id,digest,scopeDigest}`,
    );
  }
  assertSemanticId(binding.id, `${label}.id`);
  assertDigest(binding.digest, `${label}.digest`);
  assertDigest(binding.scopeDigest, `${label}.scopeDigest`);
}

function assertRawIdentityPort(port) {
  if (
    !isRecord(port) ||
    types.isProxy(port) ||
    !exactKeys(port, [
      "id",
      "digest",
      "scopeDigest",
      "genesisChainDigest",
      "machineStateDigest",
      "recordAuthenticationDigest",
    ])
  ) {
    fail(
      "JOURNAL_IDENTITY_PORT_INVALID",
      "identityPort must carry only its exact binding and three operations",
    );
  }
  for (const key of Object.keys(port)) {
    const descriptor = Object.getOwnPropertyDescriptor(port, key);
    if (
      !descriptor?.enumerable ||
      !Object.hasOwn(descriptor, "value")
    ) {
      fail(
        "JOURNAL_IDENTITY_PORT_INVALID",
        `identityPort.${key} cannot be an accessor`,
      );
    }
  }
  assertBinding({
    id: port.id,
    digest: port.digest,
    scopeDigest: port.scopeDigest,
  }, "identityPort binding");
  for (const operation of [
    "genesisChainDigest",
    "machineStateDigest",
    "recordAuthenticationDigest",
  ]) {
    if (typeof port[operation] !== "function") {
      fail(
        "JOURNAL_IDENTITY_PORT_INVALID",
        `identityPort.${operation} must be a pinned function`,
      );
    }
  }
}

function invokeIdentityTwice(operation, adapterScope, input, label) {
  const invoke = () => {
    const scopeArgument = deepFreeze(
      detached(adapterScope, `${label} adapterScope`),
    );
    const inputArgument = deepFreeze(
      detached(input, `${label} input`),
    );
    let result;
    try {
      result = Reflect.apply(
        operation,
        undefined,
        [scopeArgument, inputArgument],
      );
    } catch (error) {
      fail(
        "JOURNAL_IDENTITY_EXECUTION_FAILED",
        `${label} threw: ${error.message}`,
      );
    }
    if (
      result !== null &&
      (
        typeof result === "object" ||
        typeof result === "function"
      )
    ) {
      fail(
        "JOURNAL_IDENTITY_ASYNC_FORBIDDEN",
        `${label} must return synchronously, never a Promise or thenable`,
      );
    }
    assertDigest(result, `${label} result`);
    return result;
  };
  const first = invoke();
  const second = invoke();
  if (first !== second) {
    fail(
      "JOURNAL_IDENTITY_NONDETERMINISTIC",
      `${label} returned different digests for detached identical inputs`,
    );
  }
  return first;
}

function identityCompilerOptions(options) {
  if (
    !isRecord(options) ||
    types.isProxy(options) ||
    !exactKeys(
      options,
      ["identityBinding", "identityScope", "identityPort"],
    )
  ) {
    fail(
      "JOURNAL_IDENTITY_OPTIONS_INVALID",
      "identity compilation requires exactly identityBinding, identityScope, and identityPort",
    );
  }
  const values = {};
  for (const key of [
    "identityBinding",
    "identityScope",
    "identityPort",
  ]) {
    const descriptor = Object.getOwnPropertyDescriptor(options, key);
    if (
      !descriptor?.enumerable ||
      !Object.hasOwn(descriptor, "value")
    ) {
      fail(
        "JOURNAL_IDENTITY_OPTIONS_INVALID",
        `identity compilation option ${key} cannot be an accessor`,
      );
    }
    values[key] = descriptor.value;
  }
  return values;
}

export function compileJournalIdentityPort(options) {
  const {
    identityBinding,
    identityScope,
    identityPort,
  } = identityCompilerOptions(options);
  const binding = detached(identityBinding, "identityBinding");
  const scope = deepFreeze(detached(identityScope, "identityScope"));
  assertBinding(binding, "identityBinding");
  assertIdentityScope(scope);
  assertRawIdentityPort(identityPort);
  const portBinding = {
    id: identityPort.id,
    digest: identityPort.digest,
    scopeDigest: identityPort.scopeDigest,
  };
  if (!same(binding, portBinding)) {
    fail(
      "JOURNAL_IDENTITY_BINDING_MISMATCH",
      "runtime identity binding differs from the stored exact binding",
    );
  }
  const expectedScopeDigest = journalIdentityScopeDigest(scope);
  if (
    binding.scopeDigest !== expectedScopeDigest ||
    identityPort.scopeDigest !== expectedScopeDigest
  ) {
    fail(
      "JOURNAL_IDENTITY_SCOPE_DIGEST_MISMATCH",
      "identityScope differs from its pinned complete scope digest",
    );
  }
  const genesisChainOperation = identityPort.genesisChainDigest;
  const machineStateOperation = identityPort.machineStateDigest;
  const recordAuthenticationOperation =
    identityPort.recordAuthenticationDigest;
  let observedGenesisChainDigest;
  const observedMachineStateDigests = new Map();
  const observedRecordAuthenticationDigests = new Map();
  const remember = (observed, result, label) => {
    if (observed !== undefined && observed !== result) {
      fail(
        "JOURNAL_IDENTITY_NONDETERMINISTIC",
        `${label} changed for one previously observed exact input`,
      );
    }
    return result;
  };
  const genesisChainDigest = () => {
    const result = invokeIdentityTwice(
      genesisChainOperation,
      scope.adapterScope,
      scope.genesisRevisionState,
      "genesisChainDigest",
    );
    observedGenesisChainDigest = remember(
      observedGenesisChainDigest,
      result,
      "genesisChainDigest",
    );
    return result;
  };
  const machineStateDigest = (occurrence) => {
    const stable = detached(occurrence, "machine-state occurrence");
    if (
      !exactKeys(
        stable,
        ["machineId", "state", "journalOrdinal"],
      ) ||
      !Number.isInteger(stable.journalOrdinal) ||
      stable.journalOrdinal < 0
    ) {
      fail(
        "JOURNAL_MACHINE_OCCURRENCE_INVALID",
        "machine-state occurrence must be exactly {machineId,state,journalOrdinal}",
      );
    }
    assertSemanticId(stable.machineId, "machine-state occurrence.machineId");
    assertStateId(stable.state, "machine-state occurrence.state");
    const result = invokeIdentityTwice(
      machineStateOperation,
      scope.adapterScope,
      stable,
      "machineStateDigest",
    );
    const key = canonicalize(stable);
    const observed = observedMachineStateDigests.get(key);
    observedMachineStateDigests.set(
      key,
      remember(observed, result, "machineStateDigest"),
    );
    return result;
  };
  const recordAuthenticationDigest = (recordCore) => {
    const stable = detached(
      recordCore,
      "journal-record authentication core",
    );
    let projected;
    try {
      projected = projectJournalRecordAuthenticationCore(stable);
    } catch (error) {
      fail(
        "JOURNAL_AUTHENTICATION_CORE_INVALID",
        `journal-record authentication core is invalid: ${error.message}`,
      );
    }
    if (!same(stable, projected)) {
      fail(
        "JOURNAL_AUTHENTICATION_CORE_INVALID",
        "journal-record authentication core has ambient or missing fields",
      );
    }
    const result = invokeIdentityTwice(
      recordAuthenticationOperation,
      scope.adapterScope,
      stable,
      "recordAuthenticationDigest",
    );
    const key = canonicalize(stable);
    const observed = observedRecordAuthenticationDigests.get(key);
    observedRecordAuthenticationDigests.set(
      key,
      remember(observed, result, "recordAuthenticationDigest"),
    );
    return result;
  };
  const initialChainDigest = genesisChainDigest();
  for (const head of scope.genesisMachineHeads) {
    const expected = machineStateDigest({
      machineId: head.machineId,
      state: head.state,
      journalOrdinal: 0,
    });
    if (head.stateDigest !== expected) {
      fail(
        "JOURNAL_IDENTITY_GENESIS_HEAD_MISMATCH",
        `genesis head ${head.machineId} is not identity-bound at ordinal zero`,
      );
    }
  }
  const compiled = Object.freeze({
    binding: deepFreeze(detached(binding, "identity binding")),
    identityScope: scope,
    genesisRevisionState: scope.genesisRevisionState,
    genesisWorkspaceIntegrityDigest:
      scope.genesisWorkspaceIntegrityDigest,
    genesisMachineHeads: scope.genesisMachineHeads,
    genesisChainDigest,
    initialChainDigest,
    machineStateDigest,
    recordAuthenticationDigest,
  });
  compiledIdentityPorts.add(compiled);
  return compiled;
}

export const validateJournalIdentityPort = compileJournalIdentityPort;

export function isCompiledJournalIdentityPort(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    compiledIdentityPorts.has(value)
  );
}

const neutralIdentityId = "authoring-neutral-journal-identity";
const neutralIdentityAlgorithmDigest = sha256Value({
  domain: "mission-kit:authoring:neutral-journal-identity-code/v1",
  operations: [
    "genesis-chain-digest",
    "machine-state-occurrence-digest",
    "record-authentication-digest",
  ],
});
const neutralRecordAuthenticationDomain =
  "mission-kit:authoring:neutral-journal-record-authentication/v1\0";

function copyAuthenticationKey(value, label) {
  if (!(value instanceof Uint8Array) || value.byteLength !== 32) {
    fail(
      "JOURNAL_AUTHENTICATION_KEY_INVALID",
      `${label} must be exactly 32 externally managed bytes`,
    );
  }
  return Buffer.from(value);
}

function authenticationKeyDigest(key) {
  return `sha256:${
    createHash("sha256").update(key).digest("hex")
  }`;
}

function keyedRecordAuthenticationDigest(
  key,
  identityBinding,
  adapterScope,
  recordCore,
) {
  return `sha256:${
    createHmac("sha256", key)
      .update(neutralRecordAuthenticationDomain, "utf8")
      .update(canonicalize({
        identityBinding,
        adapterScope,
        recordCore,
      }), "utf8")
      .digest("hex")
  }`;
}

export function createNeutralJournalIdentityConfiguration(
  identityScope,
  authenticationKey,
) {
  const scope = deepFreeze(detached(identityScope, "identityScope"));
  assertIdentityScope(scope);
  const key = copyAuthenticationKey(
    authenticationKey,
    "neutral journal authentication key",
  );
  const scopeDigest = journalIdentityScopeDigest(scope);
  const identityDigest = sha256Value({
    domain:
      "mission-kit:authoring:neutral-journal-identity-binding/v2",
    algorithmDigest: neutralIdentityAlgorithmDigest,
    authenticationKeyDigest: authenticationKeyDigest(key),
  });
  const identityBinding = Object.freeze({
    id: neutralIdentityId,
    digest: identityDigest,
    scopeDigest,
  });
  const identityPort = Object.freeze({
    ...identityBinding,
    genesisChainDigest: (adapterScope, genesisRevisionState) =>
      sha256Value({
        domain: "mission-kit:authoring:neutral-journal-genesis/v1",
        adapterScope,
        genesisRevisionState,
      }),
    machineStateDigest: (adapterScope, occurrence) =>
      sha256Value({
        domain: "mission-kit:authoring:neutral-machine-state/v1",
        adapterScope,
        occurrence,
      }),
    recordAuthenticationDigest: (adapterScope, recordCore) =>
      keyedRecordAuthenticationDigest(
        key,
        identityBinding,
        adapterScope,
        recordCore,
      ),
  });
  return Object.freeze({
    identityBinding,
    identityScope: scope,
    identityPort,
    identity: compileJournalIdentityPort({
      identityBinding,
      identityScope: scope,
      identityPort,
    }),
  });
}

function assertCompiledIdentity(identity) {
  if (!isCompiledJournalIdentityPort(identity)) {
    fail(
      "JOURNAL_IDENTITY_PORT_UNCOMPILED",
      "journal operation requires a validated compiled JournalIdentityPort",
    );
  }
}

export function journalHeadDigest({ journal, identity }) {
  assertCompiledIdentity(identity);
  const stableJournal = detached(journal, "journal");
  if (!Array.isArray(stableJournal)) {
    fail("JOURNAL_INVALID", "journal must be an ordered array");
  }
  if (stableJournal.length === 0) return identity.genesisChainDigest();
  const finalRecord = assertJournalRecord(
    stableJournal[stableJournal.length - 1],
  );
  assertRecordAuthentication(finalRecord, identity);
  return finalRecord.recordDigest;
}

function assertRecordAuthentication(record, identity) {
  const expected = identity.recordAuthenticationDigest(
    projectJournalRecordAuthenticationCore(record),
  );
  if (record.authenticationDigest !== expected) {
    fail(
      "JOURNAL_AUTHENTICATION_MISMATCH",
      "JournalRecord authentication differs from the configured identity authority",
    );
  }
}

function buildResourceInventory(workspace) {
  if (
    !Array.isArray(workspace.spec.resourceVersions)
  ) {
    fail(
      "JOURNAL_WORKSPACE_INVALID",
      "Workspace resourceVersions must be an array",
    );
  }
  const inventory = new Map();
  workspace.spec.resourceVersions.forEach((stored, index) => {
    if (
      !exactKeys(stored, ["reference", "integrityDigest", "resource"]) ||
      !isRecord(stored.resource)
    ) {
      fail(
        "JOURNAL_WORKSPACE_RESOURCE_INVALID",
        `resourceVersions[${index}] is invalid`,
      );
    }
    let expectedReference;
    let expectedIntegrity;
    try {
      expectedReference = resourceReferenceFrom(stored.resource);
      expectedIntegrity = resourceIntegrityDigest(stored.resource);
    } catch (error) {
      fail(
        "JOURNAL_WORKSPACE_RESOURCE_INVALID",
        `resourceVersions[${index}] cannot be verified: ${error.message}`,
      );
    }
    if (
      !same(stored.reference, expectedReference) ||
      stored.integrityDigest !== expectedIntegrity
    ) {
      fail(
        "JOURNAL_WORKSPACE_RESOURCE_TAMPERED",
        `resourceVersions[${index}] differs from its exact identity`,
      );
    }
    const key = canonicalize(stored.reference);
    if (inventory.has(key)) {
      fail(
        "JOURNAL_WORKSPACE_RESOURCE_DUPLICATE",
        `resourceVersions repeats ${stored.reference.name}`,
      );
    }
    inventory.set(key, stored.resource);
  });
  return inventory;
}

function resolveBinding(
  binding,
  inventory,
  kind,
  digestField,
  label,
) {
  if (
    !exactKeys(binding, ["reference", digestField]) ||
    !isRecord(binding.reference)
  ) {
    fail(
      "JOURNAL_OUTCOME_ANCESTRY_UNRESOLVED",
      `${label} is not one closed ${kind} binding`,
    );
  }
  const resource = inventory.get(canonicalize(binding.reference));
  if (
    !resource ||
    resource.kind !== kind ||
    resource.spec?.[digestField] !== binding[digestField]
  ) {
    fail(
      "JOURNAL_OUTCOME_ANCESTRY_UNRESOLVED",
      `${label} does not resolve to its exact retained ${kind}`,
    );
  }
  const derivations = {
    AuthoringAssignment: assignmentDigest,
    AuthoringCommitReceipt: commitReceiptDigest,
    AuthoringSubmission: normalizedSubmissionDigest,
    ContextClosure: contextClosureDigest,
    ProjectionArtifact: projectionArtifactDigest,
    AuthoringRequest: requestCoreDigest,
    AuthoringMutation: mutationDigest,
  };
  const derive = derivations[kind];
  if (derive !== undefined) {
    let observed;
    try {
      observed = derive(resource);
    } catch {
      fail(
        "JOURNAL_OUTCOME_ANCESTRY_TAMPERED",
        `${label} ${kind} self-digest cannot be derived`,
      );
    }
    if (observed !== binding[digestField]) {
      fail(
        "JOURNAL_OUTCOME_ANCESTRY_TAMPERED",
        `${label} ${kind} self-digest is invalid`,
      );
    }
  }
  let exactReference;
  try {
    exactReference = resourceReferenceFrom(resource);
  } catch {
    fail(
      "JOURNAL_OUTCOME_ANCESTRY_TAMPERED",
      `${label} ${kind} exact reference cannot be derived`,
    );
  }
  if (!same(exactReference, binding.reference)) {
    fail(
      "JOURNAL_OUTCOME_ANCESTRY_TAMPERED",
      `${label} differs from the retained ${kind} identity`,
    );
  }
  return resource;
}

function resolveReference(
  reference,
  inventory,
  label,
  {
    kind,
    integrityDigest,
  } = {},
) {
  if (!isRecord(reference)) {
    fail(
      "JOURNAL_OUTCOME_ANCESTRY_UNRESOLVED",
      `${label} is not one ResourceReference`,
    );
  }
  const resource = inventory.get(canonicalize(reference));
  if (!resource || (kind !== undefined && resource.kind !== kind)) {
    fail(
      "JOURNAL_OUTCOME_ANCESTRY_UNRESOLVED",
      `${label} does not resolve to one exact retained resource`,
    );
  }
  let exactReference;
  let exactIntegrityDigest;
  try {
    exactReference = resourceReferenceFrom(resource);
    exactIntegrityDigest = resourceIntegrityDigest(resource);
  } catch {
    fail(
      "JOURNAL_OUTCOME_ANCESTRY_TAMPERED",
      `${label} retained resource identity cannot be derived`,
    );
  }
  if (
    !same(reference, exactReference) ||
    (
      integrityDigest !== undefined &&
      integrityDigest !== exactIntegrityDigest
    )
  ) {
    fail(
      "JOURNAL_OUTCOME_ANCESTRY_TAMPERED",
      `${label} differs from its retained resource bytes`,
    );
  }
  return resource;
}

function validateRequestResourceReferences(request, inventory) {
  const operation = request.spec?.operation;
  if (!isRecord(operation) || !isRecord(operation.inputs)) {
    fail(
      "JOURNAL_ASSIGNMENT_DAG_MISMATCH",
      "retained AuthoringRequest has no closed operation inputs",
    );
  }
  Object.entries(operation.inputs).forEach(([role, reference]) => {
    resolveReference(
      reference,
      inventory,
      `AuthoringRequest operation input ${role}`,
    );
  });
  if (operation.class === "revision") {
    if (!Array.isArray(operation.expectedHeads)) {
      fail(
        "JOURNAL_ASSIGNMENT_DAG_MISMATCH",
        "revision AuthoringRequest has no expected-head closure",
      );
    }
    operation.expectedHeads.forEach((head, index) =>
      resolveReference(
        head?.reference,
        inventory,
        `AuthoringRequest expectedHeads[${index}]`,
      ));
  }
}

function validateAssignmentClosure(binding, inventory, label) {
  const assignment = resolveBinding(
    binding,
    inventory,
    "AuthoringAssignment",
    "assignmentDigest",
    label,
  );
  const request = resolveBinding(
    assignment.spec?.request,
    inventory,
    "AuthoringRequest",
    "requestDigest",
    `${label}.request`,
  );
  const contextClosure = resolveBinding(
    request.spec?.contextClosure,
    inventory,
    "ContextClosure",
    "closureDigest",
    `${label}.request.contextClosure`,
  );
  const projectionArtifact = resolveBinding(
    assignment.spec?.projectionArtifact,
    inventory,
    "ProjectionArtifact",
    "projectionArtifactDigest",
    `${label}.projectionArtifact`,
  );
  if (
    assignment.spec.baseSemanticRevision !==
      request.spec?.base?.semanticRevision ||
    assignment.spec.baseSemanticStateDigest !==
      request.spec?.base?.semanticStateDigest
  ) {
    fail(
      "JOURNAL_ASSIGNMENT_DAG_MISMATCH",
      `${label} semantic base differs from its retained AuthoringRequest`,
    );
  }
  const expectedSources = [
    {
      role: "request",
      reference: resourceReferenceFrom(request),
      integrityDigest: resourceIntegrityDigest(request),
    },
    {
      role: "context",
      reference: resourceReferenceFrom(contextClosure),
      integrityDigest: resourceIntegrityDigest(contextClosure),
    },
  ];
  if (!same(projectionArtifact.spec?.sources, expectedSources)) {
    fail(
      "JOURNAL_ASSIGNMENT_DAG_MISMATCH",
      `${label} ProjectionArtifact sources do not bind exact Request and ContextClosure bytes`,
    );
  }
  expectedSources.forEach((source, index) =>
    resolveReference(
      source.reference,
      inventory,
      `${label}.projectionArtifact.sources[${index}]`,
      { integrityDigest: source.integrityDigest },
    ));
  validateRequestResourceReferences(request, inventory);
  return {
    assignment,
    request,
    contextClosure,
    projectionArtifact,
  };
}

function validateSubmissionClosure(
  binding,
  assignmentBinding,
  inventory,
  label,
) {
  const submission = resolveBinding(
    binding,
    inventory,
    "AuthoringSubmission",
    "normalizedSubmissionDigest",
    label,
  );
  if (!same(submission.spec?.assignment, assignmentBinding)) {
    fail(
      "JOURNAL_SUBMISSION_ANCESTRY_MISMATCH",
      `${label} does not bind the exact retained Assignment ancestry`,
    );
  }
  validateAssignmentClosure(
    assignmentBinding,
    inventory,
    `${label}.assignment`,
  );
  return submission;
}

function validateMutationResourceClosure(mutation, receipt, inventory) {
  mutation.spec.createdResources.forEach((created, index) => {
    const resource = resolveReference(
      created.reference,
      inventory,
      `AuthoringMutation createdResources[${index}]`,
      { integrityDigest: created.integrityDigest },
    );
    if (!same(resource, created.resource)) {
      fail(
        "JOURNAL_OUTCOME_ANCESTRY_TAMPERED",
        `AuthoringMutation createdResources[${index}] differs from retained bytes`,
      );
    }
  });
  mutation.spec.activeHeadChanges.forEach((change, index) => {
    for (const field of ["before", "after"]) {
      if (change[field] !== null) {
        resolveReference(
          change[field],
          inventory,
          `AuthoringMutation activeHeadChanges[${index}].${field}`,
        );
      }
    }
  });
  mutation.spec.supersededResources.forEach((reference, index) =>
    resolveReference(
      reference,
      inventory,
      `AuthoringMutation supersededResources[${index}]`,
    ));
  for (const [className, edges] of Object.entries(
    mutation.spec.dependencyEdges,
  )) {
    edges.forEach((edge, index) => {
      resolveReference(
        edge.from,
        inventory,
        `AuthoringMutation dependencyEdges.${className}[${index}].from`,
      );
      resolveReference(
        edge.to,
        inventory,
        `AuthoringMutation dependencyEdges.${className}[${index}].to`,
      );
    });
  }
  mutation.spec.handoffProducts.forEach((handoff, index) =>
    resolveReference(
      handoff.reference,
      inventory,
      `AuthoringMutation handoffProducts[${index}]`,
    ));
  receipt.spec.supersededDescendants.forEach((descendant, index) => {
    resolveReference(
      descendant.reference,
      inventory,
      `AuthoringCommitReceipt supersededDescendants[${index}].reference`,
    );
    if (descendant.supersededBy !== undefined) {
      resolveReference(
        descendant.supersededBy,
        inventory,
        `AuthoringCommitReceipt supersededDescendants[${index}].supersededBy`,
      );
    }
  });
  if (mutation.spec.cause.class === "task-submission") {
    validateSubmissionClosure(
      mutation.spec.cause.submission,
      mutation.spec.cause.assignment,
      inventory,
      "AuthoringMutation cause.submission",
    );
  } else {
    mutation.spec.cause.inputs.forEach((input, index) =>
      resolveReference(
        input.reference,
        inventory,
        `AuthoringMutation cause.inputs[${index}]`,
        { integrityDigest: input.integrityDigest },
      ));
  }
}

function validateTransitionClosure(
  record,
  receipt,
  inventory,
  authoringMachineId,
) {
  if (
    !exactKeys(receipt.spec, [
      "receiptDigest",
      "idempotencyKey",
      "cause",
      "mutation",
      "before",
      "after",
      "createdResources",
      "supersededDescendants",
      "handoffProducts",
      "externalCouplings",
    ])
  ) {
    fail(
      "JOURNAL_OUTCOME_TRANSITION_MISMATCH",
      "transition outcome Receipt is not one closed ancestry record",
    );
  }
  if (receipt.spec?.receiptDigest !== commitReceiptDigest(receipt)) {
    fail(
      "JOURNAL_OUTCOME_RECEIPT_TAMPERED",
      "transition outcome Receipt does not match receiptDigest",
    );
  }
  const mutationBinding = receipt.spec?.mutation;
  if (
    !isRecord(mutationBinding) ||
    !isRecord(mutationBinding.reference)
  ) {
    fail(
      "JOURNAL_OUTCOME_MUTATION_UNRESOLVED",
      "transition Receipt has no closed Mutation binding",
    );
  }
  const mutation = inventory.get(
    canonicalize(mutationBinding.reference),
  );
  if (
    !mutation ||
    mutation.kind !== "AuthoringMutation" ||
    mutation.spec?.mutationDigest !== mutationBinding.mutationDigest ||
    mutation.spec.mutationDigest !== mutationDigest(mutation) ||
    record.mutationDigest !== mutation.spec.mutationDigest
  ) {
    fail(
      "JOURNAL_OUTCOME_MUTATION_UNRESOLVED",
      "transition record does not bind its exact retained AuthoringMutation",
    );
  }
  let exactMutationReference;
  try {
    exactMutationReference = resourceReferenceFrom(mutation);
  } catch {
    fail(
      "JOURNAL_OUTCOME_MUTATION_UNRESOLVED",
      "transition Mutation cannot be resolved to one exact retained identity",
    );
  }
  if (
    !same(mutationBinding.reference, exactMutationReference) ||
    !Array.isArray(mutation.spec.createdResources) ||
    mutation.spec.createdResources.some(
      (created) => !isRecord(created) || !isRecord(created.reference),
    ) ||
    !Array.isArray(mutation.spec.supersededResources) ||
    !Array.isArray(mutation.spec.handoffProducts) ||
    !Array.isArray(mutation.spec.externalCouplings) ||
    !Array.isArray(receipt.spec.createdResources) ||
    !Array.isArray(receipt.spec.supersededDescendants) ||
    receipt.spec.supersededDescendants.some(
      (descendant) =>
        !isRecord(descendant) || !isRecord(descendant.reference),
    ) ||
    !Array.isArray(receipt.spec.handoffProducts) ||
    !Array.isArray(receipt.spec.externalCouplings)
  ) {
    fail(
      "JOURNAL_OUTCOME_TRANSITION_MISMATCH",
      "transition Receipt and Mutation do not expose closed ordered ancestry",
    );
  }
  const createdResources = mutation.spec.createdResources.map(
    (created) => created.reference,
  );
  let supersededDescendants;
  try {
    supersededDescendants =
      deriveSupersededDescendants(mutation);
  } catch (error) {
    fail(
      "JOURNAL_OUTCOME_TRANSITION_MISMATCH",
      `transition Mutation supersession ancestry is invalid: ${error.message}`,
    );
  }
  if (
    receipt.spec.idempotencyKey !== record.idempotency.key ||
    !same(receipt.spec.before, record.before) ||
    !same(receipt.spec.after, record.after) ||
    !same(receipt.spec.cause, mutation.spec.cause) ||
    !same(record.authority, mutation.spec.cause?.authority) ||
    !same(receipt.spec.createdResources, createdResources) ||
    !same(
      receipt.spec.supersededDescendants,
      supersededDescendants,
    ) ||
    !same(receipt.spec.handoffProducts, mutation.spec.handoffProducts) ||
    !same(
      receipt.spec.externalCouplings,
      mutation.spec.externalCouplings,
    )
  ) {
    fail(
      "JOURNAL_OUTCOME_TRANSITION_MISMATCH",
      "transition Receipt, Mutation, and JournalRecord ancestry disagree",
    );
  }
  const causeEdge = mutation.spec.cause?.edge;
  const authoringEdge = record.machineEdges[0];
  if (
    !isRecord(causeEdge) ||
    !authoringEdge ||
    authoringEdge.machineId !== authoringMachineId ||
    authoringEdge.transitionId !== causeEdge.transitionId ||
    authoringEdge.fromState !== causeEdge.fromState ||
    authoringEdge.eventId !== causeEdge.eventId ||
    authoringEdge.toState !== causeEdge.toState ||
    !same(
      record.machineEdges.slice(1),
      mutation.spec.externalCouplings,
    )
  ) {
    fail(
      "JOURNAL_OUTCOME_EDGE_BUNDLE_MISMATCH",
      "JournalRecord edges are not the authoring cause followed by every exact coupling",
    );
  }
  if (
    !same(mutation.spec.expected, {
      authoringState: authoringEdge.fromState,
      semanticRevision: record.before.semanticRevision,
      semanticStateDigest: record.before.semanticStateDigest,
    }) ||
    mutation.spec.nextAuthoringState !== authoringEdge.toState
  ) {
    fail(
      "JOURNAL_OUTCOME_TRANSITION_MISMATCH",
      "Mutation expected and next state do not bind the JournalRecord boundary",
    );
  }
  if (mutation.spec.cause.class === "task-submission") {
    if (
      record.commandDigest !==
        mutation.spec.cause.assignment.assignmentDigest ||
      record.payloadDigest !==
        mutation.spec.cause.submission.normalizedSubmissionDigest
    ) {
      fail(
        "JOURNAL_OUTCOME_COMMAND_MISMATCH",
        "submission record command and payload differ from Mutation ancestry",
      );
    }
  } else if (
    mutation.spec.cause.class === "event" &&
    (
      record.commandDigest !== mutation.spec.cause.commandDigest ||
      record.payloadDigest !== mutation.spec.cause.payloadDigest
    )
  ) {
    fail(
      "JOURNAL_OUTCOME_COMMAND_MISMATCH",
      "event record command and payload differ from Mutation ancestry",
    );
  }
  validateMutationResourceClosure(mutation, receipt, inventory);
  return { mutation, receipt };
}

function expectedWorkspaceEffect({
  beforeWorkspace,
  resources,
  historyReferences,
}) {
  const storedBefore = new Map(
    beforeWorkspace.spec.resourceVersions.map(
      (stored) => [canonicalize(stored.reference), stored],
    ),
  );
  const retainedResources = [];
  for (const resource of resources) {
    const reference = resourceReferenceFrom(resource);
    const integrityDigest = resourceIntegrityDigest(resource);
    const key = canonicalize(reference);
    const existing = storedBefore.get(key);
    if (existing === undefined) {
      retainedResources.push({ reference, integrityDigest });
      storedBefore.set(key, {
        reference,
        integrityDigest,
        resource,
      });
    } else if (
      existing.integrityDigest !== integrityDigest ||
      !same(existing.resource, resource)
    ) {
      fail(
        "JOURNAL_WORKSPACE_EFFECT_MISMATCH",
        `outcome resource ${reference.name} conflicts with its before-Workspace bytes`,
      );
    }
  }
  const priorHistory = new Set(
    beforeWorkspace.spec.history.map(canonicalize),
  );
  const appendedHistory = [];
  for (const reference of historyReferences) {
    const key = canonicalize(reference);
    if (!priorHistory.has(key)) {
      priorHistory.add(key);
      appendedHistory.push(reference);
    }
  }
  return { retainedResources, historyReferences: appendedHistory };
}

function assertOutcomeWorkspaceEffect(
  record,
  beforeWorkspace,
  resources,
  historyReferences,
) {
  const expected = expectedWorkspaceEffect({
    beforeWorkspace,
    resources,
    historyReferences,
  });
  if (
    !same(
      record.workspaceEffect.retainedResources,
      expected.retainedResources,
    ) ||
    !same(
      record.workspaceEffect.historyReferences,
      expected.historyReferences,
    )
  ) {
    fail(
      "JOURNAL_WORKSPACE_EFFECT_MISMATCH",
      "JournalRecord WorkspaceEffect differs from the exact outcome-owned persistence delta",
    );
  }
}

function validateOutcomeClosure(
  outcome,
  inventory,
  record,
  authoringMachineId,
  beforeWorkspace,
) {
  const { commitKind } = record;
  const stable = assertCommitOutcome(outcome, { commitKind });
  if (commitKind === "evidence") {
    assertEvidenceCommitPlan({
      priorJournalHeadDigest: record.previousSealDigest,
      idempotency: record.idempotency,
      operationDigest: record.operationDigest,
      commandDigest: record.commandDigest,
      payloadDigest: record.payloadDigest,
      before: record.before,
      after: record.after,
      retainedResources:
        record.workspaceEffect.retainedResources,
      openAssignment: record.workspaceEffect.openAssignment,
      outcome: stable,
      mutationDigest: record.mutationDigest,
    });
  }
  const openAssignment = record.workspaceEffect.openAssignment;
  let effectResources;
  let effectHistory;
  switch (stable.class) {
    case "assignment-issued":
      if (!same(openAssignment.after, stable.assignment)) {
        fail(
          "JOURNAL_OUTCOME_WORKSPACE_EFFECT_MISMATCH",
          "assignment issuance does not open its exact retained Assignment",
        );
      }
      {
        const dag = validateAssignmentClosure(
        stable.assignment,
        inventory,
        "outcome.assignment",
      );
        effectResources = [
          dag.contextClosure,
          dag.request,
          dag.projectionArtifact,
          dag.assignment,
        ];
        effectHistory = effectResources.map(resourceReferenceFrom);
      }
      break;
    case "assignment-cancelled":
      if (
        !same(openAssignment.before, stable.assignment) ||
        openAssignment.after !== null
      ) {
        fail(
          "JOURNAL_OUTCOME_WORKSPACE_EFFECT_MISMATCH",
          "assignment cancellation does not close its exact retained Assignment",
        );
      }
      validateAssignmentClosure(
        stable.assignment,
        inventory,
        "outcome.assignment",
      );
      effectResources = [];
      effectHistory = [];
      break;
    case "submission-rejected":
      if (
        !same(openAssignment.before, stable.assignment) ||
        !same(openAssignment.after, stable.assignment)
      ) {
        fail(
          "JOURNAL_OUTCOME_WORKSPACE_EFFECT_MISMATCH",
          "submission rejection must retain the exact open Assignment",
        );
      }
      validateAssignmentClosure(
        stable.assignment,
        inventory,
        "outcome.assignment",
      );
      validateSubmissionClosure(
        stable.submission,
        stable.assignment,
        inventory,
        "outcome.submission",
      );
      effectResources = [
        resolveBinding(
          stable.submission,
          inventory,
          "AuthoringSubmission",
          "normalizedSubmissionDigest",
          "outcome.submission",
        ),
        ...stable.issues.map((reference, index) =>
          resolveReference(
            reference,
            inventory,
            `outcome.issues[${index}]`,
            { kind: "ValidationIssue" },
          )),
      ];
      effectHistory = effectResources.map(resourceReferenceFrom);
      break;
    case "event-rejected":
      if (!same(openAssignment.before, openAssignment.after)) {
        fail(
          "JOURNAL_OUTCOME_WORKSPACE_EFFECT_MISMATCH",
          "event rejection cannot change the open Assignment",
        );
      }
      effectResources = stable.issues.map((reference, index) =>
        resolveReference(
          reference,
          inventory,
          `outcome.issues[${index}]`,
          { kind: "ValidationIssue" },
        ));
      effectHistory = stable.issues;
      break;
    case "transition-committed":
      {
        if (openAssignment.after !== null) {
          fail(
            "JOURNAL_OUTCOME_WORKSPACE_EFFECT_MISMATCH",
            "accepted transition must close the open Assignment boundary",
          );
        }
        const receipt = resolveBinding(
        stable.receipt,
        inventory,
        "AuthoringCommitReceipt",
        "receiptDigest",
        "outcome.receipt",
      );
        const transition = validateTransitionClosure(
          record,
          receipt,
          inventory,
          authoringMachineId,
        );
        const submission = transition.mutation.spec.cause.class ===
          "task-submission"
          ? resolveBinding(
            transition.mutation.spec.cause.submission,
            inventory,
            "AuthoringSubmission",
            "normalizedSubmissionDigest",
            "outcome.transition.submission",
          )
          : undefined;
        const sidecars = (stable.sidecars ?? []).map(
          (reference, index) =>
            resolveReference(
              reference,
              inventory,
              `outcome.sidecars[${index}]`,
            ),
        );
        const nonSidecarReferences = new Set([
          ...beforeWorkspace.spec.resourceVersions.map(
            (stored) => canonicalize(stored.reference),
          ),
          ...transition.mutation.spec.createdResources.map(
            (created) => canonicalize(created.reference),
          ),
          ...(submission === undefined
            ? []
            : [canonicalize(resourceReferenceFrom(submission))]),
          canonicalize(resourceReferenceFrom(transition.mutation)),
          canonicalize(resourceReferenceFrom(transition.receipt)),
        ]);
        (stable.sidecars ?? []).forEach((reference, index) => {
          if (nonSidecarReferences.has(canonicalize(reference))) {
            fail(
              "JOURNAL_OUTCOME_SIDECAR_ALIAS",
              `outcome.sidecars[${index}] is not one additional new evidence resource`,
            );
          }
        });
        effectResources = [
          ...transition.mutation.spec.createdResources.map(
            (created) => created.resource,
          ),
          ...(submission === undefined ? [] : [submission]),
          transition.mutation,
          transition.receipt,
          ...sidecars,
        ];
        effectHistory = [
          ...transition.mutation.spec.supersededResources,
          ...(submission === undefined
            ? []
            : [resourceReferenceFrom(submission)]),
          resourceReferenceFrom(transition.mutation),
          resourceReferenceFrom(transition.receipt),
          ...sidecars.map(resourceReferenceFrom),
        ];
      }
      break;
    default:
      fail(
        "JOURNAL_OUTCOME_INVALID",
        `unsupported outcome ${stable.class}`,
      );
  }
  assertOutcomeWorkspaceEffect(
    record,
    beforeWorkspace,
    effectResources,
    effectHistory,
  );
  return stable;
}

function validateOutcomeView(
  view,
  journal,
) {
  if (!Array.isArray(view) || view.length !== journal.length) {
    fail(
      "JOURNAL_OUTCOME_CARDINALITY_MISMATCH",
      "idempotencyOutcomeView must contain exactly one entry per journal record",
    );
  }
  const keys = new Set();
  const outcomes = [];
  view.forEach((entry, index) => {
    if (
      !exactKeys(entry, [
        "machineId",
        "key",
        "recordDigest",
        "operationDigest",
        "commandDigest",
        "payloadDigest",
        "outcome",
      ])
    ) {
      fail(
        "JOURNAL_OUTCOME_ENTRY_INVALID",
        `idempotencyOutcomeView[${index}] has ambient or missing fields`,
      );
    }
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
        "JOURNAL_OUTCOME_LINK_MISMATCH",
        `idempotencyOutcomeView[${index}] differs from journal[${index}]`,
      );
    }
    const key = `${entry.machineId}\u0000${entry.key}`;
    if (keys.has(key)) {
      fail(
        "JOURNAL_OUTCOME_IDEMPOTENCY_DUPLICATE",
        "idempotencyOutcomeView repeats one machine-qualified key",
      );
    }
    keys.add(key);
    outcomes.push(assertCommitOutcome(
      entry.outcome,
      { commitKind: record.commitKind },
    ));
  });
  return outcomes;
}

function effectResourceBinding(stored) {
  return {
    reference: stored.reference,
    integrityDigest: stored.integrityDigest,
  };
}

function effectArrayBoundary(effect, field) {
  return effect[field];
}

function assertWorkspaceEffectBefore(record, workspace, index) {
  const effect = record.workspaceEffect;
  const boundaries = [
    ["openAssignment", workspace.spec.openAssignment],
    ["activeHeads", workspace.spec.activeHeads],
    ["dependencyEdges", workspace.spec.dependencyEdges],
    ["handoffProducts", workspace.spec.handoffProducts],
  ];
  for (const [field, observed] of boundaries) {
    const boundary = effectArrayBoundary(effect, field);
    if (!same(boundary.before, observed)) {
      fail(
        "JOURNAL_WORKSPACE_EFFECT_BEFORE_MISMATCH",
        `journal[${index}].workspaceEffect.${field}.before differs from the reconstructed pre-image`,
      );
    }
  }
}

function assertWorkspaceEffectAfter(record, workspace, index) {
  const effect = record.workspaceEffect;
  const boundaries = [
    ["openAssignment", workspace.spec.openAssignment],
    ["activeHeads", workspace.spec.activeHeads],
    ["dependencyEdges", workspace.spec.dependencyEdges],
    ["handoffProducts", workspace.spec.handoffProducts],
  ];
  for (const [field, observed] of boundaries) {
    const boundary = effectArrayBoundary(effect, field);
    if (!same(boundary.after, observed)) {
      fail(
        "JOURNAL_WORKSPACE_EFFECT_AFTER_MISMATCH",
        `journal[${index}].workspaceEffect.${field}.after differs from the deterministic post-image`,
      );
    }
  }
}

function terminalStoredVersionIndex(workspace) {
  return new Map(
    workspace.spec.resourceVersions.map((stored) => [
      canonicalize(stored.reference),
      stored,
    ]),
  );
}

function resolveEffectStoredVersions(
  record,
  terminalStored,
  index,
) {
  return record.workspaceEffect.retainedResources.map(
    (binding, effectIndex) => {
      const stored = terminalStored.get(
        canonicalize(binding.reference),
      );
      if (
        stored === undefined ||
        stored.integrityDigest !== binding.integrityDigest
      ) {
        fail(
          "JOURNAL_WORKSPACE_EFFECT_RESOURCE_UNRESOLVED",
          `journal[${index}].workspaceEffect.retainedResources[${effectIndex}] does not resolve to exact terminal bytes`,
        );
      }
      return stored;
    },
  );
}

function transitionReplayInputs(
  record,
  outcome,
  terminalInventory,
  retainedResourceVersions,
  beforeWorkspace,
  index,
) {
  const receipt = resolveBinding(
    outcome.receipt,
    terminalInventory,
    "AuthoringCommitReceipt",
    "receiptDigest",
    `journal[${index}].outcome.receipt`,
  );
  const { mutation } = validateTransitionClosure(
    record,
    receipt,
    terminalInventory,
    record.machineEdges[0].machineId,
  );
  const priorResources = new Set(
    beforeWorkspace.spec.resourceVersions.map(
      (stored) => canonicalize(stored.reference),
    ),
  );
  const created = mutation.spec.createdResources.filter(
    (value) => !priorResources.has(canonicalize(value.reference)),
  );
  if (
    created.length > retainedResourceVersions.length ||
    created.some(
      (value, createdIndex) =>
        !same(
          {
            reference: value.reference,
            integrityDigest: value.integrityDigest,
            resource: value.resource,
          },
          retainedResourceVersions[createdIndex],
        ),
    )
  ) {
    fail(
      "JOURNAL_WORKSPACE_EFFECT_MISMATCH",
      `journal[${index}] does not retain its Mutation-created resources as the exact leading delta`,
    );
  }
  const priorHistory = new Set(
    beforeWorkspace.spec.history.map(canonicalize),
  );
  const superseded = mutation.spec.supersededResources.filter(
    (reference) => !priorHistory.has(canonicalize(reference)),
  );
  if (
    superseded.length >
      record.workspaceEffect.historyReferences.length ||
    superseded.some(
      (reference, supersededIndex) =>
        !same(
          reference,
          record.workspaceEffect.historyReferences[supersededIndex],
        ),
    )
  ) {
    fail(
      "JOURNAL_WORKSPACE_EFFECT_MISMATCH",
      `journal[${index}] does not append its Mutation supersession ancestry as the exact leading history delta`,
    );
  }
  return {
    mutation,
    retainedResourceVersions:
      retainedResourceVersions.slice(created.length),
    historyReferences:
      record.workspaceEffect.historyReferences.slice(superseded.length),
  };
}

function reconstructGenesisWorkspace(
  records,
  workspace,
  identity,
  authoringMachineId,
) {
  const allRetained = records.flatMap(
    (record) => record.workspaceEffect.retainedResources,
  );
  const terminalBindings =
    workspace.spec.resourceVersions.map(effectResourceBinding);
  const retainedSuffix = allRetained.length === 0
    ? []
    : terminalBindings.slice(-allRetained.length);
  if (
    allRetained.length > terminalBindings.length ||
    !same(retainedSuffix, allRetained)
  ) {
    fail(
      "JOURNAL_TERMINAL_RESOURCE_DELTA_MISMATCH",
      "ordered per-record retained-resource effects are not the exact terminal Workspace suffix",
    );
  }
  const allHistory = records.flatMap(
    (record) => record.workspaceEffect.historyReferences,
  );
  const historySuffix = allHistory.length === 0
    ? []
    : workspace.spec.history.slice(-allHistory.length);
  if (
    allHistory.length > workspace.spec.history.length ||
    !same(historySuffix, allHistory)
  ) {
    fail(
      "JOURNAL_TERMINAL_HISTORY_DELTA_MISMATCH",
      "ordered per-record history effects are not the exact terminal Workspace suffix",
    );
  }
  const authoringHead = identity.genesisMachineHeads.find(
    (head) => head.machineId === authoringMachineId,
  );
  if (authoringHead === undefined) {
    fail(
      "JOURNAL_AUTHORING_MACHINE_MISSING",
      "authoringMachineId is absent from identity genesis heads",
    );
  }
  const firstEffect = records[0].workspaceEffect;
  const genesis = {
    apiVersion: workspace.apiVersion,
    kind: workspace.kind,
    metadata: workspace.metadata,
    spec: {
      profile: workspace.spec.profile,
      protocol: workspace.spec.protocol,
      authoringState: authoringHead.state,
      semanticRevision:
        identity.genesisRevisionState.semanticRevision,
      evidenceRevision:
        identity.genesisRevisionState.evidenceRevision,
      resourceVersions: allRetained.length === 0
        ? workspace.spec.resourceVersions
        : workspace.spec.resourceVersions.slice(
          0,
          -allRetained.length,
        ),
      activeHeads: firstEffect.activeHeads.before,
      dependencyEdges: firstEffect.dependencyEdges.before,
      handoffProducts: firstEffect.handoffProducts.before,
      history: allHistory.length === 0
        ? workspace.spec.history
        : workspace.spec.history.slice(0, -allHistory.length),
      openAssignment: firstEffect.openAssignment.before,
      integrity: {
        semanticStateDigest:
          identity.genesisRevisionState.semanticStateDigest,
        workspaceIntegrityDigest:
          identity.genesisWorkspaceIntegrityDigest,
      },
    },
  };
  assertWorkspaceTerminal(genesis);
  return genesis;
}

function applyRecordWorkspaceEffect({
  record,
  outcome,
  beforeWorkspace,
  terminalStored,
  terminalInventory,
  index,
}) {
  assertWorkspaceEffectBefore(record, beforeWorkspace, index);
  const retainedResourceVersions = resolveEffectStoredVersions(
    record,
    terminalStored,
    index,
  );
  let afterWorkspace;
  try {
    if (record.commitKind === "evidence") {
      if (
        record.workspaceEffect.handoffSlots.length !== 0 ||
        !same(
          record.workspaceEffect.activeHeads.before,
          record.workspaceEffect.activeHeads.after,
        ) ||
        !same(
          record.workspaceEffect.dependencyEdges.before,
          record.workspaceEffect.dependencyEdges.after,
        ) ||
        !same(
          record.workspaceEffect.handoffProducts.before,
          record.workspaceEffect.handoffProducts.after,
        )
      ) {
        fail(
          "JOURNAL_EVIDENCE_SEMANTIC_EFFECT",
          `journal[${index}] evidence effect changes a semantic Workspace collection`,
        );
      }
      afterWorkspace = applyEvidenceWorkspace({
        workspace: beforeWorkspace,
        retainedResourceVersions,
        historyReferences:
          record.workspaceEffect.historyReferences,
        openAssignmentAfter:
          record.workspaceEffect.openAssignment.after,
      });
    } else {
      const replayInputs = transitionReplayInputs(
        record,
        outcome,
        terminalInventory,
        retainedResourceVersions,
        beforeWorkspace,
        index,
      );
      afterWorkspace = applyTransitionWorkspace({
        workspace: beforeWorkspace,
        mutation: replayInputs.mutation,
        handoffSlots: record.workspaceEffect.handoffSlots,
        retainedResourceVersions:
          replayInputs.retainedResourceVersions,
        historyReferences: replayInputs.historyReferences,
      });
    }
  } catch (error) {
    if (error instanceof AuthoringJournalReplayError) throw error;
    fail(
      "JOURNAL_WORKSPACE_EFFECT_REPLAY_FAILED",
      `journal[${index}] WorkspaceEffect cannot be applied: ${error.message}`,
    );
  }
  assertWorkspaceEffectAfter(record, afterWorkspace, index);
  if (
    record.afterWorkspaceIntegrityDigest !==
      afterWorkspace.spec.integrity.workspaceIntegrityDigest ||
    !same(record.after, workspaceRevisionState(afterWorkspace))
  ) {
    fail(
      "JOURNAL_WORKSPACE_EFFECT_POSTIMAGE_MISMATCH",
      `journal[${index}] deterministic post-image differs from its recorded Workspace boundary`,
    );
  }
  return afterWorkspace;
}

function validateWorkspaceEffectChain(
  records,
  workspace,
  identity,
  outcomes,
  authoringMachineId,
) {
  const terminalIntegrityDigest =
    workspace.spec.integrity.workspaceIntegrityDigest;
  if (records.length === 0) {
    if (
      terminalIntegrityDigest !==
        identity.genesisWorkspaceIntegrityDigest
    ) {
      fail(
        "JOURNAL_GENESIS_WORKSPACE_INTEGRITY_MISMATCH",
        "empty journal Workspace differs from its identity-bound genesis bytes",
      );
    }
    return;
  }
  const terminalStored = terminalStoredVersionIndex(workspace);
  const terminalInventory = buildResourceInventory(workspace);
  let current = reconstructGenesisWorkspace(
    records,
    workspace,
    identity,
    authoringMachineId,
  );
  records.forEach((record, index) => {
    if (
      current.spec.integrity.workspaceIntegrityDigest !==
        record.beforeWorkspaceIntegrityDigest ||
      !same(workspaceRevisionState(current), record.before)
    ) {
      fail(
        "JOURNAL_WORKSPACE_EFFECT_PREIMAGE_MISMATCH",
        `journal[${index}] deterministic pre-image differs from its recorded Workspace boundary`,
      );
    }
    const beforeWorkspace = current;
    current = applyRecordWorkspaceEffect({
      record,
      outcome: outcomes[index],
      beforeWorkspace,
      terminalStored,
      terminalInventory,
      index,
    });
    validateOutcomeClosure(
      outcomes[index],
      buildResourceInventory(current),
      record,
      authoringMachineId,
      beforeWorkspace,
    );
  });
  if (!same(current, workspace)) {
    fail(
      "JOURNAL_TERMINAL_WORKSPACE_MISMATCH",
      "deterministic per-record replay does not reproduce the exact terminal Workspace",
    );
  }
}

function assertWorkspaceTerminal(workspace) {
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
    ) ||
    !Number.isInteger(workspace.spec.semanticRevision) ||
    !Number.isInteger(workspace.spec.evidenceRevision) ||
    !Array.isArray(workspace.spec.resourceVersions) ||
    !Array.isArray(workspace.spec.activeHeads) ||
    !Array.isArray(workspace.spec.dependencyEdges) ||
    !Array.isArray(workspace.spec.handoffProducts) ||
    !Array.isArray(workspace.spec.history)
  ) {
    fail(
      "JOURNAL_WORKSPACE_INVALID",
      "terminal workspace must be one closed AuthoringWorkspace state",
    );
  }
  assertStateId(workspace.spec.authoringState, "workspace authoringState");
  if (
    workspace.spec.integrity.semanticStateDigest !==
      workspaceSemanticStateDigest(workspace)
  ) {
    fail(
      "JOURNAL_WORKSPACE_SEMANTIC_TAMPERED",
      "terminal Workspace semantic digest is invalid",
    );
  }
  if (
    workspace.spec.integrity.workspaceIntegrityDigest !==
      workspaceIntegrityDigest(workspace)
  ) {
    fail(
      "JOURNAL_WORKSPACE_INTEGRITY_TAMPERED",
      "terminal Workspace integrity digest is invalid",
    );
  }
}

export function replayAuthoringJournal(options) {
  if (
    !isRecord(options) ||
    !exactKeys(options, [
      "commitRevision",
      "workspace",
      "journal",
      "machineHeads",
      "idempotencyOutcomeView",
      "authoringMachineId",
      "identity",
    ])
  ) {
    fail(
      "JOURNAL_REPLAY_OPTIONS_INVALID",
      "replay input has ambient or missing fields",
    );
  }
  assertCompiledIdentity(options.identity);
  const commitRevision = options.commitRevision;
  const workspace = detached(options.workspace, "workspace");
  const journal = detached(options.journal, "journal");
  const machineHeads = detached(options.machineHeads, "machineHeads");
  const idempotencyOutcomeView = detached(
    options.idempotencyOutcomeView,
    "idempotencyOutcomeView",
  );
  const authoringMachineId = options.authoringMachineId;
  if (
    !Number.isInteger(commitRevision) ||
    commitRevision < 0 ||
    !Array.isArray(journal) ||
    commitRevision !== journal.length
  ) {
    fail(
      "JOURNAL_COMMIT_REVISION_MISMATCH",
      "commitRevision must equal journal length",
    );
  }
  assertSemanticId(authoringMachineId, "authoringMachineId");
  assertWorkspaceTerminal(workspace);
  assertMachineHeads(machineHeads, "machineHeads");
  const identity = options.identity;
  const currentHeads = new Map(
    identity.genesisMachineHeads.map(
      (head) => [head.machineId, { ...head }],
    ),
  );
  if (!currentHeads.has(authoringMachineId)) {
    fail(
      "JOURNAL_AUTHORING_MACHINE_MISSING",
      "authoringMachineId is absent from identity genesis heads",
    );
  }
  const commitIds = new Set();
  const idempotencyKeys = new Set();
  const machineOrdinals = new Map(
    identity.genesisMachineHeads.map((head) => [head.machineId, 0]),
  );
  let previousDigest = identity.genesisChainDigest();
  let previousAfter = identity.genesisRevisionState;
  let previousWorkspaceIntegrityDigest =
    identity.genesisWorkspaceIntegrityDigest;
  const records = journal.map((record) => assertJournalRecord(record));
  records.forEach((record, index) => {
    assertRecordAuthentication(record, identity);
    if (record.ordinal !== index + 1) {
      fail(
        "JOURNAL_ORDINAL_DISCONTINUITY",
        `journal[${index}] ordinal is not the contiguous global sequence`,
      );
    }
    if (record.previousSealDigest !== previousDigest) {
      fail(
        "JOURNAL_CHAIN_DISCONTINUITY",
        `journal[${index}] does not bind the prior journal chain head`,
      );
    }
    if (!same(record.before, previousAfter)) {
      fail(
        "JOURNAL_REVISION_DISCONTINUITY",
        `journal[${index}] before-state differs from the prior after-state`,
      );
    }
    if (
      record.beforeWorkspaceIntegrityDigest !==
        previousWorkspaceIntegrityDigest
    ) {
      fail(
        "JOURNAL_WORKSPACE_INTEGRITY_DISCONTINUITY",
        `journal[${index}] does not bind the prior Workspace integrity head`,
      );
    }
    if (commitIds.has(record.commitId)) {
      fail(
        "JOURNAL_COMMIT_ID_DUPLICATE",
        `journal repeats commitId ${record.commitId}`,
      );
    }
    commitIds.add(record.commitId);
    const idempotencyKey =
      `${record.idempotency.machineId}\u0000${record.idempotency.key}`;
    if (idempotencyKeys.has(idempotencyKey)) {
      fail(
        "JOURNAL_IDEMPOTENCY_DUPLICATE",
        "journal repeats one machine-qualified idempotency key",
      );
    }
    idempotencyKeys.add(idempotencyKey);
    const touched = new Set();
    const closedMachines = new Set();
    let priorMachine;
    record.machineEdges.forEach((edge, edgeIndex) => {
      if (
        priorMachine !== undefined &&
        priorMachine !== edge.machineId
      ) {
        closedMachines.add(priorMachine);
      }
      if (closedMachines.has(edge.machineId)) {
        fail(
          "JOURNAL_MACHINE_SEQUENCE_NONCONTIGUOUS",
          `journal[${index}] repeats a non-contiguous machine edge`,
        );
      }
      priorMachine = edge.machineId;
      const head = currentHeads.get(edge.machineId);
      if (
        !head ||
        head.state !== edge.fromState ||
        head.stateDigest !== edge.beforeStateDigest
      ) {
        fail(
          "JOURNAL_MACHINE_EDGE_DISCONTINUITY",
          `journal[${index}].machineEdges[${edgeIndex}] differs from its filtered head`,
        );
      }
      const expectedAfter = identity.machineStateDigest({
        machineId: edge.machineId,
        state: edge.toState,
        journalOrdinal: record.ordinal,
      });
      if (edge.afterStateDigest !== expectedAfter) {
        fail(
          "JOURNAL_MACHINE_EDGE_DIGEST_MISMATCH",
          `journal[${index}].machineEdges[${edgeIndex}] is not identity-bound`,
        );
      }
      currentHeads.set(edge.machineId, {
        machineId: edge.machineId,
        state: edge.toState,
        stateDigest: edge.afterStateDigest,
      });
      touched.add(edge.machineId);
    });
    for (const machineId of touched) {
      machineOrdinals.set(
        machineId,
        (machineOrdinals.get(machineId) ?? 0) + 1,
      );
    }
    previousDigest = record.recordDigest;
    previousAfter = record.after;
    previousWorkspaceIntegrityDigest =
      record.afterWorkspaceIntegrityDigest;
  });
  const terminalRevision = {
    semanticRevision: workspace.spec.semanticRevision,
    evidenceRevision: workspace.spec.evidenceRevision,
    semanticStateDigest: workspace.spec.integrity.semanticStateDigest,
  };
  if (!same(previousAfter, terminalRevision)) {
    fail(
      "JOURNAL_TERMINAL_REVISION_MISMATCH",
      "replayed revision head differs from the terminal Workspace",
    );
  }
  if (
    previousWorkspaceIntegrityDigest !==
      workspace.spec.integrity.workspaceIntegrityDigest
  ) {
    fail(
      records.length === 0
        ? "JOURNAL_GENESIS_WORKSPACE_INTEGRITY_MISMATCH"
        : "JOURNAL_TERMINAL_WORKSPACE_INTEGRITY_MISMATCH",
      "replayed Workspace integrity head differs from the terminal Workspace",
    );
  }
  const replayedHeads = identity.genesisMachineHeads.map(
    (head) => currentHeads.get(head.machineId),
  );
  if (!same(replayedHeads, machineHeads)) {
    fail(
      "JOURNAL_TERMINAL_MACHINE_HEAD_MISMATCH",
      "replayed machine heads differ from the stored complete head view",
    );
  }
  const authoringHead = currentHeads.get(authoringMachineId);
  if (authoringHead.state !== workspace.spec.authoringState) {
    fail(
      "JOURNAL_TERMINAL_AUTHORING_STATE_MISMATCH",
      "replayed authoring head differs from Workspace authoringState",
    );
  }
  const outcomes = validateOutcomeView(
    idempotencyOutcomeView,
    records,
  );
  validateWorkspaceEffectChain(
    records,
    workspace,
    identity,
    outcomes,
    authoringMachineId,
  );
  return frozen({
    journalHeadDigest: previousDigest,
    revisionState: previousAfter,
    machineHeads: replayedHeads,
    perMachineOrdinals: identity.genesisMachineHeads.map((head) => ({
      machineId: head.machineId,
      ordinal: machineOrdinals.get(head.machineId),
    })),
    outcomes,
  }, "journal replay result");
}
