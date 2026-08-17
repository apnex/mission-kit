import { dirname } from "node:path";
import { mkdir, readdir } from "node:fs/promises";
import {
  assertNoSymlinkAncestors,
  assertSafeSegment,
  atomicCreateOnce,
  atomicReplace,
  exists,
  readJsonFile,
  resolveContained,
  withFileLock,
} from "../engine/atomic-fs.mjs";
import {
  canonicalBytes,
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import { HASH_PROFILE_ID, hashCanonical } from "../engine/hash.mjs";
import {
  ConflictError,
  IntegrityError,
  NotFoundError,
  ValidationError,
} from "../engine/errors.mjs";

const AWARENESS_STATES = new Set([
  "AW0_REGISTERED",
  "AW1_CONTENT_COMMITTED",
  "AW2_REQUESTED",
  "AW3_DISPOSITION_SEALED",
  "AW4_CLOSED",
]);

const FORBIDDEN_AWARENESS_DISCLOSURES = new Set([
  "armMap",
  "armIdentity",
  "candidateId",
  "expectedDirection",
  "hypothesis",
  "peerResult",
  "peerResults",
  "semanticKey",
]);

function assertNeutralAwarenessValue(value, path = "$") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNeutralAwarenessValue(item, `${path}[${index}]`),
    );
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_AWARENESS_DISCLOSURES.has(key)) {
      throw new ValidationError("Awareness request is not neutral", {
        path: `${path}.${key}`,
      });
    }
    assertNeutralAwarenessValue(child, `${path}.${key}`);
  }
}

export function measureTreatmentAwareness(unsafeInput) {
  const input = deepCloneCanonical(unsafeInput);
  if (
    input === null ||
    typeof input !== "object" ||
    Array.isArray(input) ||
    Object.keys(input).sort().join(",") !==
      "contentCommitDigest,request,response,roleClass" ||
    input.roleClass !== "survey_executor" ||
    !/^[a-f0-9]{64}$/u.test(input.contentCommitDigest)
  ) {
    throw new ValidationError("Treatment-awareness evidence is invalid");
  }
  assertNeutralAwarenessValue(input.request);
  if (
    input.response === null ||
    typeof input.response !== "object" ||
    Array.isArray(input.response) ||
    Object.keys(input.response).sort().join(",") !==
      "confidence,evidenceRef,recognition" ||
    !["recognized", "unrecognized", "uncertain"].includes(
      input.response.recognition,
    ) ||
    !Number.isFinite(input.response.confidence) ||
    input.response.confidence < 0 ||
    input.response.confidence > 1 ||
    typeof input.response.evidenceRef !== "string" ||
    input.response.evidenceRef.length === 0
  ) {
    throw new ValidationError(
      "Treatment-awareness response must be a bounded post-content measurement",
    );
  }
  const core = {
    hashProfileId: HASH_PROFILE_ID,
    roleClass: input.roleClass,
    contentCommitDigest: input.contentCommitDigest,
    requestDigest: hashCanonical("awareness-request/v1", input.request),
    recognition: input.response.recognition,
    confidence: input.response.confidence,
    evidenceRef: input.response.evidenceRef,
    explicitArmDisclosure: false,
  };
  return deepFreeze({
    ...core,
    awarenessMeasurementDigest: hashCanonical(
      "treatment-awareness-measurement/v1",
      core,
    ),
  });
}

function rooted(record) {
  const core = { ...record };
  delete core.awarenessStateRoot;
  return {
    ...core,
    awarenessStateRoot: hashCanonical("awareness-state/v1", core),
  };
}

function semanticDigest(record) {
  const semantic = { ...record };
  delete semantic.events;
  delete semantic.awarenessStateRoot;
  return hashCanonical("awareness-semantic-state/v1", semantic);
}

function verify(record, obligationId) {
  if (
    record.hashProfileId !== HASH_PROFILE_ID ||
    record.obligationId !== obligationId ||
    !AWARENESS_STATES.has(record.state) ||
    rooted(record).awarenessStateRoot !== record.awarenessStateRoot
  ) {
    throw new IntegrityError("Awareness state is unverifiable", { obligationId });
  }
  let revision = 0;
  for (const [index, event] of record.events.entries()) {
    if (
      event.core.priorRevision !== revision ||
      event.core.resultingRevision !== revision + 1 ||
      hashCanonical("awareness-event/v1", event.core) !== event.eventRoot
    ) {
      throw new IntegrityError("Awareness event ancestry is invalid", {
        obligationId,
        index,
      });
    }
    if (
      index === 0 &&
      event.core.priorAwarenessStateRoot !== null
    ) {
      throw new IntegrityError("Initial awareness event has a predecessor root", {
        obligationId,
      });
    }
    if (
      index > 0 &&
      !/^[0-9a-f]{64}$/.test(event.core.priorAwarenessStateRoot)
    ) {
      throw new IntegrityError("Awareness event predecessor root is invalid", {
        obligationId,
        index,
      });
    }
    revision = event.core.resultingRevision;
  }
  if (revision !== record.revision) {
    throw new IntegrityError("Awareness revision does not match its event ledger", {
      obligationId,
    });
  }
  if (record.events.at(-1)?.resultingSemanticDigest !== semanticDigest(record)) {
    throw new IntegrityError("Awareness event does not bind current semantic state", {
      obligationId,
    });
  }
  return record;
}

function assertSchemaValidator(schemaValidator, operation) {
  if (
    !schemaValidator ||
    typeof schemaValidator.assert !== "function"
  ) {
    throw new ValidationError(
      `${operation} requires the evaluator schema validator`,
    );
  }
}

function verifyProtectedUnmaskGrant(schemaValidator, unsafeGrant) {
  assertSchemaValidator(
    schemaValidator,
    "Protected unmask grant verification",
  );
  const grant = deepCloneCanonical(unsafeGrant);
  schemaValidator.assert("protected-unmask-grant", grant);
  const core = { ...grant };
  delete core.grantCoreDigest;
  if (
    grant.grantCoreDigest !==
    hashCanonical("protected-unmask-grant/v1", core)
  ) {
    throw new IntegrityError(
      "Protected unmask grant is not self-sealed",
      { protectedUnmaskGrantId: grant.protectedUnmaskGrantId },
    );
  }
  return grant;
}

function verifyProtectedUnmaskGrantDisposition(
  schemaValidator,
  unsafeDisposition,
) {
  assertSchemaValidator(
    schemaValidator,
    "Protected unmask grant disposition verification",
  );
  const disposition = deepCloneCanonical(unsafeDisposition);
  schemaValidator.assert(
    "protected-unmask-grant-disposition",
    disposition,
  );
  const core = { ...disposition };
  delete core.dispositionReceiptRoot;
  if (
    disposition.dispositionReceiptRoot !==
    hashCanonical("protected-unmask-grant-disposition/v1", core)
  ) {
    throw new IntegrityError(
      "Protected unmask grant disposition is not self-sealed",
      {
        protectedUnmaskGrantId:
          disposition.protectedUnmaskGrantId,
      },
    );
  }
  return disposition;
}

export class AwarenessLedger {
  constructor({
    rootPath,
    clock = () => Date.now(),
    schemaValidator = null,
  }) {
    if (!rootPath) throw new ValidationError("AwarenessLedger requires rootPath");
    this.rootPath = rootPath;
    this.clock = clock;
    this.schemaValidator = schemaValidator;
  }

  pathFor(obligationId) {
    return resolveContained(
      this.rootPath,
      "awareness",
      "obligations",
      `${assertSafeSegment(obligationId, "awareness obligation ID")}.json`,
    );
  }

  universeLockTarget() {
    return resolveContained(
      this.rootPath,
      "awareness",
      "universe-authority.json",
    );
  }

  grantDispositionPathFor(grantId) {
    return resolveContained(
      this.rootPath,
      "awareness",
      "unmask-grant-dispositions",
      `${assertSafeSegment(grantId, "unmask grant ID")}.json`,
    );
  }

  async withUniverseLock(operation) {
    const target = this.universeLockTarget();
    await mkdir(dirname(target), { recursive: true, mode: 0o750 });
    await assertNoSymlinkAncestors(this.rootPath, target);
    return withFileLock(target, operation);
  }

  async registeredObligationIds() {
    const directory = resolveContained(
      this.rootPath,
      "awareness",
      "obligations",
    );
    await mkdir(directory, { recursive: true, mode: 0o750 });
    await assertNoSymlinkAncestors(this.rootPath, directory);
    const entries = await readdir(directory, { withFileTypes: true });
    const ids = [];
    for (const entry of entries) {
      if (entry.name.startsWith(".") || !entry.name.endsWith(".json")) {
        continue;
      }
      if (!entry.isFile()) {
        throw new IntegrityError(
          "Awareness universe contains a non-regular obligation entry",
          { entry: entry.name },
        );
      }
      ids.push(entry.name.slice(0, -".json".length));
    }
    return ids.sort();
  }

  async load(obligationId, { required = false } = {}) {
    const path = this.pathFor(obligationId);
    await mkdir(this.rootPath, { recursive: true, mode: 0o750 });
    await assertNoSymlinkAncestors(this.rootPath, path);
    if (!(await exists(path))) {
      if (required) {
        throw new NotFoundError("Awareness obligation is absent", { obligationId });
      }
      return null;
    }
    return verify(await readJsonFile(path), obligationId);
  }

  makeEvent(eventType, obligationId, prior, payload) {
    const core = {
      hashProfileId: HASH_PROFILE_ID,
      eventType,
      obligationId,
      priorRevision: prior?.revision ?? 0,
      priorAwarenessStateRoot: prior?.awarenessStateRoot ?? null,
      resultingRevision: (prior?.revision ?? 0) + 1,
      payloadDigest: hashCanonical("awareness-event-payload/v1", payload),
    };
    return { core, eventRoot: hashCanonical("awareness-event/v1", core) };
  }

  async register({
    obligationId,
    roleClass,
    purpose,
    parentBinding,
    expectedInvocation,
    maskPolicyDigest,
  }) {
    const path = this.pathFor(obligationId);
    await mkdir(this.rootPath, { recursive: true, mode: 0o750 });
    await assertNoSymlinkAncestors(this.rootPath, path);
    await mkdir(dirname(path), { recursive: true, mode: 0o750 });
    await assertNoSymlinkAncestors(this.rootPath, path);
    return this.withUniverseLock(() =>
      withFileLock(path, async () => {
        const current = await this.load(obligationId);
        const payload = {
          roleClass,
          purpose,
          parentBinding,
          expectedInvocation,
          maskPolicyDigest,
        };
        if (current) {
          const existingPayload = {
            roleClass: current.roleClass,
            purpose: current.purpose,
            parentBinding: current.parentBinding,
            expectedInvocation: current.expectedInvocation,
            maskPolicyDigest: current.maskPolicyDigest,
          };
          if (canonicalBytes(existingPayload).equals(canonicalBytes(payload))) {
            return { replayed: true, record: current };
          }
          throw new ConflictError("Awareness obligation identity has changed bytes", {
            obligationId,
          });
        }
        const event = this.makeEvent("AW00_REGISTER", obligationId, null, payload);
        let record = {
          hashProfileId: HASH_PROFILE_ID,
          obligationId,
          revision: 1,
          state: "AW0_REGISTERED",
          ...deepCloneCanonical(payload),
          invocationBinding: null,
          contentCommit: null,
          request: null,
          response: null,
          disposition: null,
          parentReceipt: null,
          events: [],
        };
        record.events.push({
          ...event,
          resultingSemanticDigest: semanticDigest(record),
        });
        record = rooted(record);
        await atomicCreateOnce(path, canonicalBytes(record));
        return { replayed: false, record };
      }),
    );
  }

  async transition(obligationId, {
    eventType,
    allowedStates,
    nextState,
    payload,
    mutate,
  }) {
    const path = this.pathFor(obligationId);
    return withFileLock(path, async () => {
      const current = await this.load(obligationId, { required: true });
      if (!allowedStates.includes(current.state)) {
        throw new ConflictError("Awareness transition source state is illegal", {
          obligationId,
          eventType,
          state: current.state,
        });
      }
      let next = deepCloneCanonical(current);
      next.revision = current.revision + 1;
      next.state = nextState;
      next = await mutate(next);
      const event = this.makeEvent(eventType, obligationId, current, payload);
      next.events.push({
        ...event,
        resultingSemanticDigest: semanticDigest(next),
      });
      next = rooted(next);
      await atomicReplace(path, canonicalBytes(next));
      return next;
    });
  }

  async bindInvocation(obligationId, binding) {
    return this.transition(obligationId, {
      eventType: "AW08_BIND_INVOCATION",
      allowedStates: ["AW0_REGISTERED"],
      nextState: "AW0_REGISTERED",
      payload: binding,
      mutate: (next) => {
        if (next.expectedInvocation !== true) {
          throw new ConflictError("No invocation is expected for this obligation");
        }
        if (next.invocationBinding) {
          if (canonicalBytes(next.invocationBinding).equals(canonicalBytes(binding))) {
            return next;
          }
          throw new IntegrityError("Invocation binding changed under one obligation");
        }
        next.invocationBinding = deepCloneCanonical(binding);
        return next;
      },
    });
  }

  async assertDispatchable(obligationId, bindingDigest) {
    const record = await this.load(obligationId, { required: true });
    if (
      record.state !== "AW0_REGISTERED" ||
      !record.invocationBinding ||
      hashCanonical("awareness-invocation-binding/v1", record.invocationBinding) !==
        bindingDigest
    ) {
      throw new ConflictError("Role dispatch lacks exact AW08 acknowledgement", {
        obligationId,
      });
    }
    return record;
  }

  async commitContent(obligationId, contentCommit) {
    return this.transition(obligationId, {
      eventType: "AW01_COMMIT_CONTENT",
      allowedStates: ["AW0_REGISTERED"],
      nextState: "AW1_CONTENT_COMMITTED",
      payload: contentCommit,
      mutate: (next) => {
        if (!next.invocationBinding) {
          throw new ConflictError("Content cannot commit before AW08 invocation binding");
        }
        next.contentCommit = deepCloneCanonical(contentCommit);
        return next;
      },
    });
  }

  async issueNeutralRequest(obligationId, request) {
    assertNeutralAwarenessValue(request);
    return this.transition(obligationId, {
      eventType: "AW02_ISSUE_REQUEST",
      allowedStates: ["AW1_CONTENT_COMMITTED"],
      nextState: "AW2_REQUESTED",
      payload: request,
      mutate: (next) => {
        next.request = deepCloneCanonical(request);
        return next;
      },
    });
  }

  async sealResponse(obligationId, response) {
    return this.transition(obligationId, {
      eventType: "AW03_SEAL_RESPONSE",
      allowedStates: ["AW2_REQUESTED"],
      nextState: "AW3_DISPOSITION_SEALED",
      payload: response,
      mutate: (next) => {
        next.response = deepCloneCanonical(response);
        next.disposition = {
          kind: "reported",
          requestDigest: hashCanonical("awareness-request/v1", next.request),
          responseDigest: hashCanonical("awareness-response/v1", response),
          contentDigest: hashCanonical(
            "awareness-content-commit/v1",
            next.contentCommit,
          ),
        };
        return next;
      },
    });
  }

  async sealMissingAfterContent(obligationId, evidence) {
    return this.transition(obligationId, {
      eventType: "AW04_SEAL_MISSING",
      allowedStates: ["AW1_CONTENT_COMMITTED", "AW2_REQUESTED"],
      nextState: "AW3_DISPOSITION_SEALED",
      payload: evidence,
      mutate: (next) => {
        next.disposition = {
          kind: "missing_after_content",
          evidence: deepCloneCanonical(evidence),
          contentDigest: hashCanonical(
            "awareness-content-commit/v1",
            next.contentCommit,
          ),
        };
        return next;
      },
    });
  }

  async sealMissingNoContent(obligationId, evidence) {
    return this.transition(obligationId, {
      eventType: "AW05_SEAL_NO_CONTENT",
      allowedStates: ["AW0_REGISTERED"],
      nextState: "AW3_DISPOSITION_SEALED",
      payload: evidence,
      mutate: (next) => {
        next.disposition = {
          kind: "missing_no_content",
          evidence: deepCloneCanonical(evidence),
          invocationBindingDigest: next.invocationBinding
            ? hashCanonical(
                "awareness-invocation-binding/v1",
                next.invocationBinding,
              )
            : null,
        };
        return next;
      },
    });
  }

  async sealNoInvocation(obligationId, evidence) {
    return this.transition(obligationId, {
      eventType: "AW06_SEAL_NO_INVOCATION",
      allowedStates: ["AW0_REGISTERED"],
      nextState: "AW3_DISPOSITION_SEALED",
      payload: evidence,
      mutate: (next) => {
        if (next.invocationBinding) {
          throw new ConflictError("Invoked obligation cannot use no-invocation branch");
        }
        next.disposition = {
          kind: "not_applicable",
          evidence: deepCloneCanonical(evidence),
        };
        return next;
      },
    });
  }

  async acknowledgeParent(obligationId, parentReceipt) {
    return this.transition(obligationId, {
      eventType: "AW07_ACK_PARENT",
      allowedStates: ["AW3_DISPOSITION_SEALED"],
      nextState: "AW4_CLOSED",
      payload: parentReceipt,
      mutate: (next) => {
        next.parentReceipt = deepCloneCanonical(parentReceipt);
        return next;
      },
    });
  }

  async issueUnmaskGrant({
    grantId,
    campaignId,
    expectedObligationIds,
    armMapDigest,
    analystScope,
    campaignEvidenceEnvelopeDigest,
    unmaskFence,
  }) {
    assertSchemaValidator(
      this.schemaValidator,
      "Protected unmask issuance",
    );
    return this.withUniverseLock(async () => {
      const ids = [...new Set(expectedObligationIds)].sort();
      if (ids.length !== expectedObligationIds.length) {
        throw new ValidationError("Expected awareness universe contains duplicates");
      }
      const registeredIds = await this.registeredObligationIds();
      if (!canonicalBytes(ids).equals(canonicalBytes(registeredIds))) {
        throw new ConflictError(
          "Protected unmask expected universe does not match registered obligations",
          { expectedObligationIds: ids, registeredObligationIds: registeredIds },
        );
      }
      const grantsDirectory = resolveContained(
        this.rootPath,
        "awareness",
        "unmask-grants",
      );
      const authorityPath = resolveContained(
        this.rootPath,
        "awareness",
        "protected-unmask-authority.json",
      );
      const path = resolveContained(
        grantsDirectory,
        `${assertSafeSegment(grantId, "unmask grant ID")}.json`,
      );
      const dispositionPath = this.grantDispositionPathFor(grantId);
      await mkdir(grantsDirectory, { recursive: true, mode: 0o750 });
      await assertNoSymlinkAncestors(this.rootPath, authorityPath);
      await assertNoSymlinkAncestors(this.rootPath, path);
      await assertNoSymlinkAncestors(
        this.rootPath,
        dispositionPath,
      );
      if (await exists(dispositionPath)) {
        const disposition =
          verifyProtectedUnmaskGrantDisposition(
            this.schemaValidator,
            await readJsonFile(dispositionPath),
          );
        throw new ConflictError(
          "Disposed protected unmask authority cannot be re-issued",
          {
            protectedUnmaskGrantId: grantId,
            disposition: disposition.disposition,
            dispositionReceiptRoot:
              disposition.dispositionReceiptRoot,
          },
        );
      }

      const roots = [];
      for (const obligationId of ids) {
        const record = await this.load(obligationId, { required: true });
        if (record.state !== "AW4_CLOSED") {
          throw new ConflictError(
            "Protected unmask requires every obligation at AW4",
            { obligationId, state: record.state },
          );
        }
        roots.push({
          obligationId,
          awarenessStateRoot: record.awarenessStateRoot,
          disposition: record.disposition.kind,
        });
      }
      const dispositionCounts = {
        reported: 0,
        missingAfterContent: 0,
        missingNoContent: 0,
        notApplicable: 0,
      };
      for (const root of roots) {
        const key = new Map([
          ["reported", "reported"],
          ["missing_after_content", "missingAfterContent"],
          ["missing_no_content", "missingNoContent"],
          ["not_applicable", "notApplicable"],
        ]).get(root.disposition);
        if (!key) {
          throw new IntegrityError(
            "Closed awareness disposition is unknown to unmask issuance",
            {
              obligationId: root.obligationId,
              disposition: root.disposition,
            },
          );
        }
        dispositionCounts[key] += 1;
      }
      const core = {
        schemaVersion: "1.0.0",
        hashProfileId: HASH_PROFILE_ID,
        protectedUnmaskGrantId: grantId,
        campaignId,
        campaignEvidenceEnvelopeDigest,
        awarenessUniverseRoot: hashCanonical("awareness-universe/v1", roots),
        closedAwarenessLedgerRoot: hashCanonical(
          "closed-awareness-ledger/v1",
          roots,
        ),
        dispositionCounts,
        protectedArmMapDigest: armMapDigest,
        analystScope: deepCloneCanonical(analystScope),
        expectedObligationIds: ids,
        roots,
        unmaskFence,
        transitionId: "EC20",
        containsFutureReference: false,
      };
      const grant = {
        ...core,
        grantCoreDigest: hashCanonical(
          "protected-unmask-grant/v1",
          core,
        ),
      };
      this.schemaValidator.assert("protected-unmask-grant", grant);
      if (await exists(authorityPath)) {
        const existing = await readJsonFile(authorityPath);
        this.schemaValidator.assert("protected-unmask-grant", existing);
        const existingCore = { ...existing };
        delete existingCore.grantCoreDigest;
        if (
          existing.grantCoreDigest !==
            hashCanonical("protected-unmask-grant/v1", existingCore) ||
          !canonicalBytes(existing).equals(canonicalBytes(grant))
        ) {
          throw new ConflictError(
            "Awareness universe already issued a different protected unmask grant",
            {
              existingGrantId: existing.protectedUnmaskGrantId,
              requestedGrantId: grantId,
            },
          );
        }
        await atomicCreateOnce(path, canonicalBytes(existing));
        return { replayed: true, grant: existing, path };
      }
      await atomicCreateOnce(authorityPath, canonicalBytes(grant));
      await atomicCreateOnce(path, canonicalBytes(grant));
      return { replayed: false, grant, path };
    });
  }

  async loadUnmaskGrantDisposition(
    grantId,
    { required = false } = {},
  ) {
    assertSchemaValidator(
      this.schemaValidator,
      "Protected unmask grant disposition loading",
    );
    const path = this.grantDispositionPathFor(grantId);
    if (!(await exists(path))) {
      if (required) {
        throw new NotFoundError(
          "Protected unmask grant disposition does not exist",
          { protectedUnmaskGrantId: grantId },
        );
      }
      return null;
    }
    return verifyProtectedUnmaskGrantDisposition(
      this.schemaValidator,
      await readJsonFile(path),
    );
  }

  async disposeUnmaskGrant({
    grant: unsafeGrant,
    disposition,
    dispositionCauseRoot,
    campaignEventRoot = null,
    failurePreparationRoot = null,
    sourcePhase,
  }) {
    assertSchemaValidator(
      this.schemaValidator,
      "Protected unmask grant disposition",
    );
    const grant = verifyProtectedUnmaskGrant(
      this.schemaValidator,
      unsafeGrant,
    );
    if (
      disposition !== "consumed" &&
      disposition !== "terminalized_unconsumed"
    ) {
      throw new ValidationError(
        "Protected unmask disposition is not terminal",
        { disposition },
      );
    }
    if (
      disposition === "consumed" &&
      (
        !/^[a-f0-9]{64}$/u.test(campaignEventRoot ?? "") ||
        failurePreparationRoot !== null ||
        dispositionCauseRoot !== campaignEventRoot
      )
    ) {
      throw new ValidationError(
        "Consumed protected unmask authority must bind exactly one campaign event",
      );
    }
    if (
      disposition === "terminalized_unconsumed" &&
      (
        campaignEventRoot !== null ||
        !/^[a-f0-9]{64}$/u.test(failurePreparationRoot ?? "") ||
        dispositionCauseRoot !== failurePreparationRoot
      )
    ) {
      throw new ValidationError(
        "Unconsumed protected unmask authority must bind exactly one failure preparation",
      );
    }
    return this.withUniverseLock(async () => {
      const authorityPath = resolveContained(
        this.rootPath,
        "awareness",
        "protected-unmask-authority.json",
      );
      if (!(await exists(authorityPath))) {
        throw new NotFoundError(
          "Protected unmask authority does not exist",
          {
            protectedUnmaskGrantId:
              grant.protectedUnmaskGrantId,
          },
        );
      }
      const authority = verifyProtectedUnmaskGrant(
        this.schemaValidator,
        await readJsonFile(authorityPath),
      );
      if (
        !canonicalBytes(authority).equals(canonicalBytes(grant))
      ) {
        throw new IntegrityError(
          "Protected unmask disposition does not bind the issued authority",
          {
            protectedUnmaskGrantId:
              grant.protectedUnmaskGrantId,
          },
        );
      }
      const path = this.grantDispositionPathFor(
        grant.protectedUnmaskGrantId,
      );
      const core = {
        schemaVersion: "1.0.0",
        hashProfileId: HASH_PROFILE_ID,
        protectedUnmaskGrantDispositionId:
          `${grant.protectedUnmaskGrantId}:disposition`,
        campaignId: grant.campaignId,
        protectedUnmaskGrantId:
          grant.protectedUnmaskGrantId,
        grantCoreDigest: grant.grantCoreDigest,
        disposition,
        dispositionCauseRoot,
        campaignEventRoot,
        failurePreparationRoot,
        sourcePhase,
        liveAuthorityRemaining: false,
      };
      const record = {
        ...core,
        dispositionReceiptRoot: hashCanonical(
          "protected-unmask-grant-disposition/v1",
          core,
        ),
      };
      this.schemaValidator.assert(
        "protected-unmask-grant-disposition",
        record,
      );
      await mkdir(dirname(path), {
        recursive: true,
        mode: 0o750,
      });
      await assertNoSymlinkAncestors(this.rootPath, path);
      if (await exists(path)) {
        const existing =
          verifyProtectedUnmaskGrantDisposition(
            this.schemaValidator,
            await readJsonFile(path),
          );
        if (
          !canonicalBytes(existing).equals(canonicalBytes(record))
        ) {
          throw new ConflictError(
            "Protected unmask grant already has a different terminal disposition",
            {
              protectedUnmaskGrantId:
                grant.protectedUnmaskGrantId,
              existingDisposition: existing.disposition,
              requestedDisposition: disposition,
            },
          );
        }
        return { replayed: true, disposition: existing, path };
      }
      await atomicCreateOnce(path, canonicalBytes(record));
      return { replayed: false, disposition: record, path };
    });
  }
}

export { AWARENESS_STATES };
