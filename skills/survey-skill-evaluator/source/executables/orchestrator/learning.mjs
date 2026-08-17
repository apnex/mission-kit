import {
  HASH_PROFILE_ID,
  absentAuthoritativeStateRoot,
  hashCanonical,
} from "../engine/hash.mjs";
import {
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import {
  AuthorizationError,
  ConflictError,
  IntegrityError,
  QuarantinedError,
  ValidationError,
} from "../engine/errors.mjs";
import { validateJsonSchema } from "../engine/schema-validator.mjs";

export const SOURCE_OPERATION_BY_TYPE = deepFreeze({
  lr03_diagnosis: "LC01",
  completion_reflection: "LC01",
  recognized_insight_trigger: "LC01",
  post_lr4_payback_observation: "LC02",
});

const CAPITAL_RECOVERY_KINDS = new Set([
  "entry_conflict",
  "terminalized_unconsumed",
  "source_advanced",
  "source_unverifiable",
  "learning_capital_request_source_unverifiable",
]);

function assertSchema(schemaValidator, identifier, value) {
  if (!schemaValidator) {
    throw new ValidationError("LearningProtocol requires a generated schema validator");
  }
  schemaValidator.assert(identifier, value);
  return value;
}

function assertSourceRequest(schemaValidator, request) {
  const definition = schemaValidator.schema(
    "learning-capital-request-state",
  ).$defs?.SourceRequest;
  if (!definition) {
    throw new ValidationError("SourceRequest definition is unavailable");
  }
  const result = validateJsonSchema(request, {
    ...definition,
    $defs:
      schemaValidator.schema("learning-capital-request-state").$defs,
  });
  if (!result.valid) {
    throw new ValidationError("SourceRequest is invalid", {
      errors: result.errors,
    });
  }
  const expectedOperation = SOURCE_OPERATION_BY_TYPE[request.sourceType];
  if (expectedOperation !== request.targetOperation) {
    throw new ValidationError("SourceRequest discriminator targets the wrong operation", {
      sourceType: request.sourceType,
      expectedOperation,
      actualOperation: request.targetOperation,
    });
  }
  return request;
}

function sourceRequestDigest(request) {
  return hashCanonical("learning-capital-source-request/v1", request);
}

function dbAbsenceRoot({
  diagnosticDebateId,
  lr02GrantId,
  brokerClaim,
  absenceReceipt,
}) {
  return hashCanonical("diagnostic-debate-verified-absence/v1", {
    diagnosticDebateId,
    lr02GrantId,
    brokerClaimId: brokerClaim.claimId,
    brokerClaimRoot: brokerClaim.claimRoot,
    absenceReceipt,
  });
}

function dbf00Closure(brokerClaim) {
  if (brokerClaim.state === "fenced_before_delivery") {
    return {
      brokerClosure: "fenced_before_delivery",
      terminalizedUnconsumedReceipt: hashCanonical(
        "diagnostic-debate-unconsumed-receipt/v1",
        {
          claimId: brokerClaim.claimId,
          claimRoot: brokerClaim.claimRoot,
          fenceEvidence: brokerClaim.fenceEvidence,
        },
      ),
    };
  }
  if (
    brokerClaim.state === "delivered" &&
    brokerClaim.postDeliveryFence &&
    brokerClaim.drainReceipt?.disposition === "not_committed" &&
    brokerClaim.drainReceipt.claimId === brokerClaim.claimId &&
    brokerClaim.drainReceipt.fence === brokerClaim.fence &&
    brokerClaim.drainReceipt.operationId === brokerClaim.operationId &&
    brokerClaim.drainReceipt.messageDigest === brokerClaim.messageDigest
  ) {
    return {
      brokerClosure: "delivered_then_not_committed",
      terminalizedUnconsumedReceipt: hashCanonical(
        "diagnostic-debate-unconsumed-receipt/v1",
        {
          claimId: brokerClaim.claimId,
          claimRoot: brokerClaim.claimRoot,
          drainReceipt: brokerClaim.drainReceipt,
        },
      ),
    };
  }
  throw new ConflictError(
    "DBF00 requires a fenced-before-delivery or delivered-not-committed broker closure",
    {
      claimId: brokerClaim.claimId,
      claimState: brokerClaim.state,
      drainDisposition: brokerClaim.drainReceipt?.disposition ?? null,
    },
  );
}

export class LearningProtocol {
  constructor({
    schemaValidator,
    lifecycleEngine = null,
    brokerClaimStore = null,
    quarantineStore = null,
    stateStore = lifecycleEngine?.stateStore ?? null,
    registeredObserverAuthorityIds = [],
  }) {
    this.schemaValidator = schemaValidator;
    this.lifecycleEngine = lifecycleEngine;
    this.brokerClaimStore = brokerClaimStore;
    this.quarantineStore = quarantineStore;
    this.stateStore = stateStore;
    this.registeredObserverAuthorityIds = new Set(
      registeredObserverAuthorityIds,
    );
  }

  buildSourceRequest(fields) {
    const {
      targetOperation: requestedOperation,
      immutable: requestedImmutable,
      sourceType,
      ...remainder
    } = deepCloneCanonical(fields);
    const targetOperation = SOURCE_OPERATION_BY_TYPE[sourceType];
    if (!targetOperation) {
      throw new ValidationError("SourceRequest has an unknown source type", {
        sourceType,
      });
    }
    if (
      requestedOperation !== undefined &&
      requestedOperation !== targetOperation
    ) {
      throw new ValidationError("SourceRequest target cannot override its discriminator", {
        sourceType,
        requestedOperation,
        targetOperation,
      });
    }
    if (requestedImmutable !== undefined && requestedImmutable !== true) {
      throw new ValidationError("SourceRequest immutability cannot be disabled");
    }
    const request = {
      ...remainder,
      sourceType,
      targetOperation,
      immutable: true,
    };
    if (
      sourceType === "post_lr4_payback_observation" &&
      !this.registeredObserverAuthorityIds.has(request.observerAuthorityId)
    ) {
      throw new AuthorizationError(
        "Payback SourceRequest lacks a registered observer authority",
        { observerAuthorityId: request.observerAuthorityId },
      );
    }
    assertSourceRequest(this.schemaValidator, request);
    return deepFreeze({
      request,
      sourceRequestDigest: sourceRequestDigest(request),
    });
  }

  buildCompletionReflectionSource({
    completionReflection,
    sourceRequestId,
    conceptPatternKey,
    sourceObjectId,
    sourceSemanticRoot,
    upstreamOutboxId,
    upstreamOutboxDigest,
    correlationId,
    producerAuthorityId,
  }) {
    assertSchema(
      this.schemaValidator,
      "completion-reflection",
      completionReflection,
    );
    const completionReflectionRoot = hashCanonical(
      "completion-reflection/v1",
      completionReflection,
    );
    return this.buildSourceRequest({
      sourceRequestId,
      sourceType: "completion_reflection",
      sourceObjectId,
      sourceEventDigest: completionReflection.sourceEventDigest,
      sourceSemanticRoot,
      upstreamOutboxId,
      upstreamOutboxDigest,
      correlationId,
      producerAuthorityId,
      conceptPatternKey,
      completionReflectionRoot,
    });
  }

  registerPaybackObservation(observation, { actorAuthorityId } = {}) {
    assertSchema(this.schemaValidator, "payback-observation", observation);
    if (observation.authoredPreLcr !== true) {
      throw new ValidationError(
        "PaybackObservation must be observer-authored before LCR admission",
      );
    }
    if (
      actorAuthorityId !== observation.observerId ||
      !this.registeredObserverAuthorityIds.has(actorAuthorityId)
    ) {
      throw new AuthorizationError(
        "Only the registered observer authority may author PaybackObservation",
        {
          actorAuthorityId,
          observerId: observation.observerId,
        },
      );
    }
    return deepFreeze({
      observation: deepCloneCanonical(observation),
      paybackObservationRoot: hashCanonical(
        "payback-observation/v1",
        observation,
      ),
    });
  }

  buildOperationGrant({
    operationGrantId,
    learningCapitalRequestId,
    sourceRequest,
    fence,
    brokerClaim = null,
    quarantineLatch = null,
    evidenceRefs = [],
  }) {
    assertSourceRequest(this.schemaValidator, sourceRequest);
    const requestDigest = sourceRequestDigest(sourceRequest);
    let grant;
    if (quarantineLatch) {
      const blocksRequest =
        (quarantineLatch.scope === "request" &&
          quarantineLatch.scopeId === learningCapitalRequestId) ||
        quarantineLatch.scope === "ledger";
      if (!blocksRequest) {
        throw new ValidationError(
          "An unrelated quarantine latch cannot alter request admission",
          {
            learningCapitalRequestId,
            latchScope: quarantineLatch.scope,
            latchScopeId: quarantineLatch.scopeId,
          },
        );
      }
      grant = {
        schemaVersion: "1.0.0",
        hashProfileId: HASH_PROFILE_ID,
        operationGrantId,
        grantClass: "denied_projection",
        learningCapitalRequestId,
        targetOperation: sourceRequest.targetOperation,
        sourceRequestDigest: requestDigest,
        fence,
        invocable: false,
        denialReason: "blocked_by_quarantine_latch",
        requestQuarantineRef: quarantineLatch.latchRoot,
        evidenceRefs: [...evidenceRefs, quarantineLatch.latchRoot].filter(Boolean),
      };
    } else {
      if (!brokerClaim) {
        throw new ConflictError("Eligible LCR admission requires a broker claim");
      }
      if (
        brokerClaim.state !== "delivered" ||
        brokerClaim.postDeliveryFence ||
        brokerClaim.targetId !== learningCapitalRequestId ||
        brokerClaim.messageDigest !== sourceRequest.upstreamOutboxDigest ||
        brokerClaim.fence !== fence
      ) {
        throw new ConflictError("Broker claim does not authorize LCR admission", {
          learningCapitalRequestId,
          brokerClaimId: brokerClaim.claimId,
        });
      }
      grant = {
        schemaVersion: "1.0.0",
        hashProfileId: HASH_PROFILE_ID,
        operationGrantId,
        grantClass: "eligible",
        learningCapitalRequestId,
        targetOperation: sourceRequest.targetOperation,
        sourceRequestDigest: requestDigest,
        fence,
        invocable: true,
        brokerClaimId: brokerClaim.claimId,
        evidenceRefs: [...evidenceRefs],
      };
    }
    assertSchema(
      this.schemaValidator,
      "learning-capital-operation-grant",
      grant,
    );
    return deepFreeze({
      grant,
      grantDigest: hashCanonical("learning-capital-operation-grant/v1", grant),
    });
  }

  assertCapitalInvocation({ operationGrant, sourceRequest, transitionId }) {
    assertSchema(
      this.schemaValidator,
      "learning-capital-operation-grant",
      operationGrant,
    );
    assertSourceRequest(this.schemaValidator, sourceRequest);
    if (
      operationGrant.grantClass !== "eligible" ||
      operationGrant.invocable !== true
    ) {
      throw new QuarantinedError("Denied capital projection is not invocable", {
        operationGrantId: operationGrant.operationGrantId,
      });
    }
    if (
      operationGrant.sourceRequestDigest !== sourceRequestDigest(sourceRequest) ||
      operationGrant.targetOperation !== sourceRequest.targetOperation ||
      transitionId !== sourceRequest.targetOperation
    ) {
      throw new IntegrityError("Learning-capital invocation changed its admitted source", {
        operationGrantId: operationGrant.operationGrantId,
        transitionId,
      });
    }
    return true;
  }

  async executeCapital({ operationGrant, sourceRequest, command }) {
    if (!this.lifecycleEngine) {
      throw new ValidationError("LearningProtocol has no lifecycle engine");
    }
    this.assertCapitalInvocation({
      operationGrant,
      sourceRequest,
      transitionId: command.transitionId,
    });
    if (this.brokerClaimStore) {
      const claim = await this.brokerClaimStore.load(
        operationGrant.brokerClaimId,
        { required: true },
      );
      if (
        claim.state !== "delivered" ||
        claim.postDeliveryFence ||
        claim.fence !== operationGrant.fence
      ) {
        throw new ConflictError(
          "Learning-capital broker authority was fenced before invocation",
          { brokerClaimId: operationGrant.brokerClaimId },
        );
      }
    }
    if (this.quarantineStore) {
      await this.quarantineStore.assertAdmissible(
        "request",
        operationGrant.learningCapitalRequestId,
      );
    }
    return this.lifecycleEngine.execute(command);
  }

  async buildDbf00Result({
    diagnosticDebateResultId,
    terminalResultId,
    diagnosticDebateId,
    lr02GrantId,
    brokerClaim,
    evidenceRefs = [],
    absenceReceipt: callerAbsenceReceipt,
    currentDiagnosticDebate: callerDiagnosticDebate,
  }) {
    if (
      callerAbsenceReceipt !== undefined ||
      callerDiagnosticDebate !== undefined
    ) {
      throw new ValidationError(
        "DBF00 absence evidence must be obtained from the authoritative StateStore",
      );
    }
    if (!this.stateStore) {
      throw new ValidationError(
        "DBF00 requires an authoritative diagnostic-debate StateStore",
      );
    }
    const currentDiagnosticDebate = await this.stateStore.load(
      "diagnostic-debate",
      diagnosticDebateId,
    );
    if (currentDiagnosticDebate !== null) {
      throw new ConflictError("DBF00 cannot overwrite an existing DB product", {
        diagnosticDebateId,
      });
    }
    if (!brokerClaim || typeof brokerClaim !== "object") {
      throw new ConflictError("DBF00 requires an authoritative broker closure");
    }
    if (brokerClaim.operationId !== diagnosticDebateId) {
      throw new IntegrityError("DBF00 broker claim is bound to another operation", {
        diagnosticDebateId,
        operationId: brokerClaim.operationId,
      });
    }
    const closure = dbf00Closure(brokerClaim);
    const absenceReceipt = {
      machineId: "diagnostic-debate",
      objectId: diagnosticDebateId,
      schemaVersion: this.stateStore.schemaVersion,
      absentAuthoritativeStateRoot: absentAuthoritativeStateRoot(
        "diagnostic-debate",
        diagnosticDebateId,
        this.stateStore.schemaVersion,
      ),
    };
    const result = {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      diagnosticDebateResultId,
      terminalResult: {
        terminalResultId,
        terminalType: "diagnosis_unavailable",
        diagnosticDebateId,
        lr02GrantId,
        unavailabilityClass: "no_db_created",
        completeCutRoot: hashCanonical("diagnostic-debate-empty-cut/v1", {
          diagnosticDebateId,
          lr02GrantId,
          absenceReceipt,
        }),
        validPairCount: 0,
        ...closure,
        verifiedDbAbsenceRoot: dbAbsenceRoot({
          diagnosticDebateId,
          lr02GrantId,
          brokerClaim,
          absenceReceipt,
        }),
      },
      evidenceRefs: [...evidenceRefs],
    };
    assertSchema(this.schemaValidator, "diagnostic-debate", result);
    return deepFreeze({
      result,
      resultDigest: hashCanonical("diagnostic-debate-result/v1", result),
    });
  }

  async commitDiagnosticResult({ result, commit, acknowledge }) {
    assertSchema(this.schemaValidator, "diagnostic-debate", result);
    if (typeof commit !== "function" || typeof acknowledge !== "function") {
      throw new ValidationError(
        "Diagnostic result delivery requires commit and acknowledgement functions",
      );
    }
    const resultDigest = hashCanonical("diagnostic-debate-result/v1", result);
    const committed = await commit(deepCloneCanonical(result), resultDigest);
    if (
      !committed ||
      (committed.resultDigest !== undefined &&
        committed.resultDigest !== resultDigest)
    ) {
      throw new IntegrityError(
        "Diagnostic result commit did not attest the expected bytes",
      );
    }
    const acknowledgement = await acknowledge({
      diagnosticDebateResultId: result.diagnosticDebateResultId,
      resultDigest,
      commitReceipt: deepCloneCanonical(committed),
    });
    return { resultDigest, commitReceipt: committed, acknowledgement };
  }

  projectSourceDisposition(disposition) {
    assertSchema(
      this.schemaValidator,
      "learning-capital-source-disposition",
      disposition,
    );
    if (
      (disposition.kind === "lc01_success" &&
        disposition.targetOperation !== "LC01") ||
      (disposition.kind === "lc02_success" &&
        disposition.targetOperation !== "LC02")
    ) {
      throw new ValidationError(
        "Capital success disposition targets the wrong operation",
      );
    }
    return deepFreeze({
      disposition: deepCloneCanonical(disposition),
      dispositionDigest: hashCanonical(
        "learning-capital-source-disposition/v1",
        disposition,
      ),
    });
  }

  routeCapitalOutcome({
    sourceRequest,
    sourceDisposition,
    learningRecordState,
  }) {
    assertSourceRequest(this.schemaValidator, sourceRequest);
    assertSchema(
      this.schemaValidator,
      "learning-capital-source-disposition",
      sourceDisposition,
    );
    const lr03Route =
      sourceRequest.sourceType === "lr03_diagnosis" &&
      sourceRequest.targetOperation === "LC01" &&
      sourceDisposition.targetOperation === "LC01" &&
      learningRecordState === "LR3_HANDOFF_PENDING";
    if (!lr03Route) {
      return deepFreeze({ route: "none", transitionIds: [] });
    }
    if (sourceDisposition.kind === "lc01_success") {
      return deepFreeze({
        route: "ordinary_learning_handoff",
        transitionIds: ["LR04", "LR05"],
      });
    }
    if (CAPITAL_RECOVERY_KINDS.has(sourceDisposition.kind)) {
      return deepFreeze({
        route: "terminal_capital_recovery",
        transitionIds: ["LR10"],
      });
    }
    return deepFreeze({ route: "none", transitionIds: [] });
  }
}

export { assertSourceRequest, sourceRequestDigest };
