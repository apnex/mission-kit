import path from "node:path";
import { HASH_PROFILE_ID } from "./hash.mjs";
import {
  DECLARATIVE_SCHEMA_NAMES,
  declarativeSchemaContract
} from "./schema-contracts/catalog.mjs";
import { lifecycleStates } from "./schema-contracts/primitives.mjs";

const DIALECT = "https://json-schema.org/draft/2020-12/schema";
const ID_PREFIX = "urn:mission-kit:survey-skill-evaluator:";
const DIGEST_PATTERN = "^[a-f0-9]{64}$";
const ID_PATTERN = "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$";

const digest = () => ({ type: "string", pattern: DIGEST_PATTERN });
const identifier = () => ({ type: "string", pattern: ID_PATTERN });
const stringArray = () => ({
  type: "array",
  items: { type: "string" },
  uniqueItems: true
});
const digestArray = () => ({
  type: "array",
  items: digest(),
  uniqueItems: true
});

function object(properties, required = [], extra = {}) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required,
    ...extra
  };
}

function closedUnion(branches) {
  return { oneOf: branches };
}

function predecessor() {
  return closedUnion([
      object(
        {
          kind: { const: "existing" },
          objectId: identifier(),
          revision: { type: "integer", minimum: 0 },
          authoritativeStateRoot: digest()
        },
        ["kind", "objectId", "revision", "authoritativeStateRoot"]
      ),
      object(
        {
          kind: { const: "absent" },
          machineId: identifier(),
          objectId: identifier(),
          schemaVersion: { type: "string" },
          absentSentinel: digest()
        },
        ["kind", "machineId", "objectId", "schemaVersion", "absentSentinel"]
      ),
      object(
        {
          kind: { const: "parent_staged_genesis" },
          genesisRecordDigest: digest(),
          initialSemanticCoreDigest: digest(),
          initialAuthoritativeStateRoot: digest()
        },
        [
          "kind",
          "genesisRecordDigest",
          "initialSemanticCoreDigest",
          "initialAuthoritativeStateRoot"
        ]
      )
    ]);
}

function commonProperties() {
  return {
    schemaVersion: { type: "string", pattern: "^\\d+\\.\\d+\\.\\d+$" },
    hashProfileId: { const: HASH_PROFILE_ID },
    evidenceRefs: digestArray()
  };
}

function testEvidenceContract() {
  const fixtureIdentity = object(
    {
      path: { type: "string", minLength: 1 },
      rawFileSha256: digest(),
      byteLength: { type: "integer", minimum: 0 }
    },
    ["path", "rawFileSha256", "byteLength"]
  );
  const packageIdentities = closedUnion([
    object(
      {
        applicability: { const: "applicable" },
        candidatePackageIdentity: digest(),
        controlPackageIdentity: digest(),
        identityClass: {
          enum: ["raw_fixture_bytes", "package_payload_root"]
        }
      },
      [
        "applicability",
        "candidatePackageIdentity",
        "controlPackageIdentity",
        "identityClass"
      ]
    ),
    object(
      {
        applicability: { const: "not_applicable" },
        reason: { type: "string", minLength: 1 }
      },
      ["applicability", "reason"]
    )
  ]);
  return object(
    {
      schemaVersion: { const: "1.0.0" },
      hashProfileId: { const: HASH_PROFILE_ID },
      evidenceId: identifier(),
      descriptor: object(
        {
          sourcePath: {
            type: "string",
            pattern:
              "^source/test-descriptors/implemented/[a-z0-9][a-z0-9/_-]*\\.descriptor\\.json$"
          },
          testId: identifier(),
          obligationId: {
            type: "string",
            pattern: "^(?:TE|EI|EM)\\d{2}$"
          },
          mechanismId: { type: "string", pattern: "^EM\\d{2}$" },
          gate: { type: "string", pattern: "^E[0-7]$" },
          groupId: { type: "string", pattern: "^[a-z][a-z-]+$" },
          executionIsolationClass: {
            enum: ["read-only-package", "package-root-mutating"]
          },
          rawSourceSha256: digest(),
          descriptorDigest: digest()
        },
        [
          "sourcePath",
          "testId",
          "obligationId",
          "mechanismId",
          "gate",
          "groupId",
          "executionIsolationClass",
          "rawSourceSha256",
          "descriptorDigest"
        ]
      ),
      executable: object(
        {
          path: { type: "string", pattern: "^tests/.+\\.test\\.mjs$" },
          rawSourceSha256: digest(),
          byteLength: { type: "integer", minimum: 1 }
        },
        ["path", "rawSourceSha256", "byteLength"]
      ),
      fixtures: {
        type: "array",
        items: fixtureIdentity,
        uniqueItems: true
      },
      candidateControlIdentities: packageIdentities,
      environment: object(
        {
          nodeVersion: { type: "string", minLength: 1 },
          platform: { type: "string", minLength: 1 },
          architecture: { type: "string", minLength: 1 },
          endianness: { enum: ["BE", "LE"] },
          environmentDigest: digest()
        },
        [
          "nodeVersion",
          "platform",
          "architecture",
          "endianness",
          "environmentDigest"
        ]
      ),
      runner: object(
        {
          runnerId: { const: "survey-evaluator-manifest-runner/v1" },
          sourcePath: { const: "tests/run-manifest.mjs" },
          rawSourceSha256: digest(),
          invocationDigest: digest()
        },
        [
          "runnerId",
          "sourcePath",
          "rawSourceSha256",
          "invocationDigest"
        ]
      ),
      startedAtMs: { type: "integer", minimum: 0 },
      endedAtMs: { type: "integer", minimum: 0 },
      status: { enum: ["passed", "failed"] },
      exitCode: { type: ["integer", "null"], minimum: 0 },
      signal: { type: ["string", "null"] },
      output: object(
        {
          stdoutSha256: digest(),
          stderrSha256: digest(),
          tapSha256: digest(),
          stdoutByteLength: { type: "integer", minimum: 0 },
          stderrByteLength: { type: "integer", minimum: 0 }
        },
        [
          "stdoutSha256",
          "stderrSha256",
          "tapSha256",
          "stdoutByteLength",
          "stderrByteLength"
        ]
      ),
      evidenceDigest: digest()
    },
    [
      "schemaVersion",
      "hashProfileId",
      "evidenceId",
      "descriptor",
      "executable",
      "fixtures",
      "candidateControlIdentities",
      "environment",
      "runner",
      "startedAtMs",
      "endedAtMs",
      "status",
      "exitCode",
      "signal",
      "output",
      "evidenceDigest"
    ]
  );
}

function requirementDescriptorContract() {
  return object(
    {
      ...commonProperties(),
      requirementId: { type: "string", pattern: "^(?:TE|EI)\\d{2}$" },
      class: { enum: ["required-outcome", "invariant"] },
      mechanismIds: {
        type: "array",
        minItems: 1,
        uniqueItems: true,
        items: { type: "string", pattern: "^EM\\d{2}$" }
      },
      sourceOwner: { type: "string", pattern: "^[a-z][a-z0-9-]*\\.[a-z0-9-]+$" }
    },
    [
      "schemaVersion",
      "hashProfileId",
      "requirementId",
      "class",
      "mechanismIds",
      "sourceOwner"
    ]
  );
}

function mechanismDescriptorContract() {
  return object(
    {
      ...commonProperties(),
      mechanismId: { type: "string", pattern: "^EM\\d{2}$" },
      name: { type: "string", minLength: 1 },
      uniquePurpose: { type: "string", minLength: 1 }
    },
    ["schemaVersion", "hashProfileId", "mechanismId", "name", "uniquePurpose"]
  );
}

function fragmentDescriptorContract() {
  return object(
    {
      ...commonProperties(),
      fragmentId: {
        type: "string",
        pattern: "^[a-z][a-z0-9-]*\\.[a-z0-9-]+$"
      },
      path: {
        type: "string",
        pattern: "^source/fragments/[a-z0-9/-]+\\.json$"
      },
      purpose: { type: "string", minLength: 1 },
      requirementIds: {
        type: "array",
        minItems: 1,
        uniqueItems: true,
        items: { type: "string", pattern: "^(?:TE|EI)\\d{2}$" }
      },
      mechanismIds: {
        type: "array",
        minItems: 1,
        uniqueItems: true,
        items: { type: "string", pattern: "^EM\\d{2}$" }
      }
    },
    [
      "schemaVersion",
      "hashProfileId",
      "fragmentId",
      "path",
      "purpose",
      "requirementIds",
      "mechanismIds"
    ]
  );
}

function projectionDescriptorContract() {
  return object(
    {
      ...commonProperties(),
      recipeId: identifier(),
      targetPattern: { type: "string", minLength: 1 },
      sourceOwner: { type: "string", minLength: 1 },
      mode: { enum: ["0644", "0755"] }
    },
    [
      "schemaVersion",
      "hashProfileId",
      "recipeId",
      "targetPattern",
      "sourceOwner",
      "mode"
    ]
  );
}

function metricDescriptorContract() {
  return object(
    {
      ...commonProperties(),
      metricId: { type: "string", pattern: "^[A-Z][A-Z0-9_]+$" },
      dimension: identifier(),
      nativeRepresentation: { type: "string", minLength: 1 },
      direction: {
        enum: [
          "higher-is-better",
          "lower-is-better",
          "descriptive",
          "protected-descriptive"
        ]
      }
    },
    [
      "schemaVersion",
      "hashProfileId",
      "metricId",
      "dimension",
      "nativeRepresentation",
      "direction"
    ]
  );
}

function methodologyContract() {
  return object(
    {
      ...commonProperties(),
      methodologyId: { const: "survey-skill-evaluator" },
      methodologyVersion: { type: "string" },
      roleRegistryDigest: digest(),
      lifecycleManifestDigest: digest(),
      metricManifestDigest: digest(),
      requirementManifestDigest: digest(),
      projectionManifestDigest: digest()
    },
    [
      "schemaVersion",
      "hashProfileId",
      "methodologyId",
      "methodologyVersion",
      "roleRegistryDigest",
      "lifecycleManifestDigest",
      "metricManifestDigest",
      "requirementManifestDigest",
      "projectionManifestDigest"
    ]
  );
}

function hashProfileContract() {
  return object(
    {
      profileId: { const: HASH_PROFILE_ID },
      semanticAlgorithm: { const: "SHA-256" },
      canonicalJson: { const: "RFC8785-JCS-UTF8" },
      framing: { const: "uint64be-length-framed" },
      binaryEncoding: { const: "base64url-unpadded" },
      digestEncoding: { const: "lowercase-hex" },
      rawFileProfileId: { const: "raw-file-sha256/v1" },
      namespace: { const: "survey-skill-evaluator/hash/v1" }
    },
    [
      "profileId",
      "semanticAlgorithm",
      "canonicalJson",
      "framing",
      "binaryEncoding",
      "digestEncoding",
      "rawFileProfileId",
      "namespace"
    ]
  );
}

function genesisContract() {
  const parentBinding = object(
    {
      parentMachineId: identifier(),
      parentObjectId: identifier(),
      parentPriorAuthoritativeRoot: digest(),
      parentOrderId: identifier(),
      parentFence: { type: "integer", minimum: 0 }
    },
    [
      "parentMachineId",
      "parentObjectId",
      "parentPriorAuthoritativeRoot",
      "parentOrderId",
      "parentFence"
    ]
  );
  return object(
    {
      ...commonProperties(),
      creationClass: {
        enum: ["existing", "absent", "parent_staged_genesis"]
      },
      machineId: identifier(),
      objectId: identifier(),
      absentSentinel: digest(),
      parentBinding,
      initialSemanticPayload: {
        type: "object",
        additionalProperties: true
      },
      genesisCoreDigest: digest(),
      initialSemanticCoreDigest: digest(),
      initialAuthoritativeStateRoot: digest(),
      revision: { type: "integer", minimum: 0, maximum: 0 },
      eventLedger: { type: "array", maxItems: 0 },
      outboxLedger: { type: "array", maxItems: 0 }
    },
    [
      "schemaVersion",
      "hashProfileId",
      "creationClass",
      "machineId",
      "objectId"
    ],
    {
      allOf: [
        {
          if: { properties: { creationClass: { const: "absent" } } },
          then: { required: ["absentSentinel"] }
        },
        {
          if: {
            properties: { creationClass: { const: "parent_staged_genesis" } }
          },
          then: {
            required: [
              "absentSentinel",
              "parentBinding",
              "initialSemanticPayload",
              "genesisCoreDigest",
              "initialSemanticCoreDigest",
              "initialAuthoritativeStateRoot",
              "revision",
              "eventLedger",
              "outboxLedger"
            ]
          }
        }
      ]
    }
  );
}

const inventoryEntry = () =>
  object(
    {
      path: { type: "string", minLength: 1, pattern: "^(?!/)(?!.*(?:^|/)\\.\\.?/)(?!.*\\\\)(?!.*\\u0000).+$" },
      mode: { enum: ["0644", "0755"] },
      byteLength: { type: "integer", minimum: 0 },
      rawFileSha256: digest()
    },
    ["path", "mode", "byteLength", "rawFileSha256"]
  );

function packageManifestContract() {
  return object(
    {
      schemaVersion: { const: "1.0.0" },
      hashProfileId: { const: HASH_PROFILE_ID },
      skillName: { const: "survey-skill-evaluator" },
      rootKind: { const: "evaluator-payload" },
      exclusions: {
        type: "array",
        prefixItems: [{ const: "package.manifest.json" }],
        minItems: 1,
        maxItems: 1
      },
      entries: { type: "array", items: inventoryEntry() },
      entryCount: { type: "integer", minimum: 0 },
      payloadRoot: digest()
    },
    [
      "schemaVersion",
      "hashProfileId",
      "skillName",
      "rootKind",
      "exclusions",
      "entries",
      "entryCount",
      "payloadRoot"
    ]
  );
}

function generatedLockContract() {
  return object(
    {
      schemaVersion: { const: "1.0.0" },
      hashProfileId: { const: HASH_PROFILE_ID },
      exclusions: {
        type: "array",
        prefixItems: [
          { const: "generated.lock.json" },
          { const: "package.manifest.json" }
        ],
        minItems: 2,
        maxItems: 2
      },
      sourceRoot: digest(),
      compilerRoot: digest(),
      generatedTargetRoot: digest(),
      generatedTargets: {
        type: "array",
        items: object(
          {
            path: { type: "string", minLength: 1 },
            recipeId: identifier(),
            recipeDigest: digest(),
            sourceDigests: digestArray(),
            sourceAggregateDigest: digest(),
            compilerDigest: digest(),
            mode: { enum: ["0644", "0755"] },
            byteLength: { type: "integer", minimum: 0 },
            rawFileSha256: digest()
          },
          [
            "path",
            "recipeId",
            "recipeDigest",
            "sourceDigests",
            "sourceAggregateDigest",
            "compilerDigest",
            "mode",
            "byteLength",
            "rawFileSha256"
          ]
        )
      }
    },
    [
      "schemaVersion",
      "hashProfileId",
      "exclusions",
      "sourceRoot",
      "compilerRoot",
      "generatedTargetRoot",
      "generatedTargets"
    ]
  );
}

function lifecycleTransitionContract() {
  return object(
    {
      ...commonProperties(),
      transitionId: identifier(),
      machineId: identifier(),
      eventType: identifier(),
      fromState: { type: "string", minLength: 1 },
      toState: { type: "string", minLength: 1 },
      creationClass: {
        enum: ["existing", "absent", "parent_staged_genesis"]
      },
      guardId: identifier(),
      actionPipelineId: identifier(),
      mutationId: identifier(),
      participantPolicyId: identifier(),
      idempotencyClass: {
        enum: ["exact_replay", "create_once", "compare_and_swap"]
      },
      failureRoute: identifier(),
      learningTriggerPolicyId: {
        enum: [
          "none",
          "failure_or_quarantine",
          "material_finding",
          "recognized_insight",
          "recurrent_friction",
          "work_unit_completion",
          "campaign_completion"
        ]
      }
    },
    [
      "schemaVersion",
      "hashProfileId",
      "transitionId",
      "machineId",
      "eventType",
      "fromState",
      "toState",
      "creationClass",
      "guardId",
      "actionPipelineId",
      "mutationId",
      "participantPolicyId",
      "idempotencyClass",
      "failureRoute",
      "learningTriggerPolicyId"
    ]
  );
}

function participantPolicyContract() {
  const authorityExpression = {
    oneOf: [
      object({ kind: { const: "single" }, authorityId: identifier() }, [
        "kind",
        "authorityId"
      ]),
      object(
        {
          kind: { const: "allOf" },
          authorityIds: {
            type: "array",
            minItems: 2,
            uniqueItems: true,
            items: identifier()
          }
        },
        ["kind", "authorityIds"]
      ),
      object(
        {
          kind: { const: "anyOf" },
          authorityIds: {
            type: "array",
            minItems: 2,
            uniqueItems: true,
            items: identifier()
          }
        },
        ["kind", "authorityIds"]
      )
    ]
  };
  return object(
    {
      ...commonProperties(),
      participantPolicyId: identifier(),
      commandAuthority: authorityExpression,
      guardOwnerId: identifier(),
      orderedActionExecutors: {
        type: "array",
        items: object(
          { actionId: identifier(), executorAuthorityId: identifier() },
          ["actionId", "executorAuthorityId"]
        )
      },
      requiredAttestationAuthorityIds: stringArray()
    },
    [
      "schemaVersion",
      "hashProfileId",
      "participantPolicyId",
      "commandAuthority",
      "guardOwnerId",
      "orderedActionExecutors",
      "requiredAttestationAuthorityIds"
    ]
  );
}

function eventContract() {
  return object(
    {
      ...commonProperties(),
      eventId: identifier(),
      objectId: identifier(),
      transitionId: identifier(),
      priorRevision: { type: "integer", minimum: 0 },
      predecessorRoot: digest(),
      semanticEventDigest: digest(),
      resultingSemanticCoreDigest: digest(),
      participantPolicyId: identifier(),
      actionOutputCoreDigests: digestArray()
    },
    [
      "schemaVersion",
      "hashProfileId",
      "eventId",
      "objectId",
      "transitionId",
      "priorRevision",
      "predecessorRoot",
      "semanticEventDigest",
      "resultingSemanticCoreDigest",
      "participantPolicyId",
      "actionOutputCoreDigests"
    ]
  );
}

function outboxContract() {
  const brokerDeliveryClaim = object(
    {
      claimId: identifier(),
      targetId: identifier(),
      messageId: identifier(),
      fence: { type: "integer", minimum: 0 },
      status: {
        enum: ["pending", "delivery_already_claimed", "fenced_before_delivery"]
      }
    },
    ["claimId", "targetId", "messageId", "fence", "status"]
  );
  const drainReceipt = object(
    {
      receiptId: identifier(),
      claimId: identifier(),
      fence: { type: "integer", minimum: 0 },
      result: {
        enum: ["not_committed", "source_advanced", "source_unverifiable"]
      },
      sourceEventDigest: digest(),
      sourceSemanticRoot: digest()
    },
    ["receiptId", "claimId", "fence", "result"]
  );
  return object(
    {
      ...commonProperties(),
      outboxMessageId: identifier(),
      sourceObjectId: identifier(),
      sourceRevision: { type: "integer", minimum: 0 },
      predecessorRoot: digest(),
      semanticEventDigest: digest(),
      resultingSemanticCoreDigest: digest(),
      payloadDigest: digest(),
      deliveryState: {
        enum: ["pending", "delivered", "acknowledged", "terminal"]
      },
      brokerDeliveryClaim: { $ref: "#/$defs/BrokerDeliveryClaim" },
      drainReceipt: { $ref: "#/$defs/DrainReceipt" }
    },
    [
      "schemaVersion",
      "hashProfileId",
      "outboxMessageId",
      "sourceObjectId",
      "sourceRevision",
      "predecessorRoot",
      "semanticEventDigest",
      "resultingSemanticCoreDigest",
      "payloadDigest",
      "deliveryState"
    ],
    { $defs: { BrokerDeliveryClaim: brokerDeliveryClaim, DrainReceipt: drainReceipt } }
  );
}

function quarantineContract() {
  return object(
    {
      ...commonProperties(),
      quarantineId: identifier(),
      scope: {
        enum: [
          "entry",
          "request",
          "diagnostic_debate",
          "campaign",
          "family",
          "whole_ledger"
        ]
      },
      sourceObjectId: identifier(),
      observedByteDigest: digest(),
      failedVerificationRefs: digestArray(),
      brokerFenceRef: digest(),
      drainReceiptRef: digest(),
      blocksUnrelatedObjects: { const: false }
    },
    [
      "schemaVersion",
      "hashProfileId",
      "quarantineId",
      "scope",
      "sourceObjectId",
      "observedByteDigest",
      "failedVerificationRefs"
    ]
  );
}

function diagnosticDebateStateContract(lifecycleManifest) {
  const workOrder = object(
    {
      workOrderId: identifier(),
      diagnosticDebateId: identifier(),
      actorId: identifier(),
      phase: { enum: ["opening", "cross_response"] },
      disclosureRoot: digest(),
      openingCutRoot: digest(),
      capabilityDigest: digest()
    },
    [
      "workOrderId",
      "diagnosticDebateId",
      "actorId",
      "phase",
      "disclosureRoot",
      "capabilityDigest"
    ]
  );
  const slotDisposition = object(
    {
      slotId: identifier(),
      actorId: identifier(),
      phase: { enum: ["opening", "cross_response"] },
      status: { enum: ["empty", "valid", "terminal"] },
      resultDigest: digest(),
      terminalReason: { type: "string" },
      workOrderReceiptDigest: digest()
    },
    ["slotId", "actorId", "phase", "status"]
  );
  const resultDelivery = object(
    {
      deliveryId: identifier(),
      resultId: identifier(),
      sourceEventDigest: digest(),
      sourceSemanticRoot: digest(),
      status: { enum: ["pending", "delivered", "acknowledged"] }
    },
    ["deliveryId", "resultId", "sourceEventDigest", "sourceSemanticRoot", "status"]
  );
  return object(
    {
      ...commonProperties(),
      diagnosticDebateId: identifier(),
      revision: { type: "integer", minimum: 0 },
      state: {
        enum: lifecycleStates(lifecycleManifest, "diagnostic-debate")
      },
      predecessor: predecessor(),
      lr02GrantId: identifier(),
      brokerClaimId: identifier(),
      openingBarrierRoot: digest(),
      workOrders: {
        type: "array",
        items: { $ref: "#/$defs/WorkOrder" }
      },
      openingSlots: {
        type: "array",
        minItems: 2,
        maxItems: 3,
        items: { $ref: "#/$defs/SlotDisposition" }
      },
      responseSlots: {
        type: "array",
        maxItems: 3,
        items: { $ref: "#/$defs/SlotDisposition" }
      },
      resultDelivery: { $ref: "#/$defs/ResultDelivery" },
      eventRefs: digestArray(),
      outboxRefs: digestArray()
    },
    [
      "schemaVersion",
      "hashProfileId",
      "diagnosticDebateId",
      "revision",
      "state",
      "predecessor",
      "lr02GrantId",
      "brokerClaimId",
      "workOrders",
      "openingSlots",
      "responseSlots",
      "eventRefs",
      "outboxRefs"
    ],
    { $defs: { WorkOrder: workOrder, SlotDisposition: slotDisposition, ResultDelivery: resultDelivery } }
  );
}

function diagnosticDebateContract() {
  const common = {
    terminalResultId: identifier(),
    diagnosticDebateId: identifier(),
    lr02GrantId: identifier()
  };
  const terminalResult = {
    oneOf: [
      object(
        {
          ...common,
          terminalType: { const: "sealed_diagnosis" },
          completeCutRoot: digest(),
          validPairCount: { type: "integer", minimum: 2, maximum: 3 },
          contributionDigests: digestArray(),
          dissentDigests: digestArray()
        },
        [
          "terminalResultId",
          "terminalType",
          "diagnosticDebateId",
          "lr02GrantId",
          "completeCutRoot",
          "validPairCount",
          "contributionDigests",
          "dissentDigests"
        ]
      ),
      object(
        {
          ...common,
          terminalType: { const: "diagnosis_unavailable" },
          unavailabilityClass: {
            enum: ["no_db_created", "incomplete_committed_cut"]
          },
          completeCutRoot: digest(),
          validPairCount: { type: "integer", minimum: 0, maximum: 1 },
          brokerClosure: {
            enum: ["fenced_before_delivery", "delivered_then_not_committed"]
          },
          terminalizedUnconsumedReceipt: digest(),
          verifiedDbAbsenceRoot: digest()
        },
        [
          "terminalResultId",
          "terminalType",
          "diagnosticDebateId",
          "lr02GrantId",
          "unavailabilityClass",
          "completeCutRoot",
          "validPairCount",
          "brokerClosure",
          "terminalizedUnconsumedReceipt",
          "verifiedDbAbsenceRoot"
        ]
      ),
      object(
        {
          ...common,
          terminalType: {
            const: "diagnostic_debate_source_unverifiable"
          },
          forensicLatchRoot: digest(),
          observedBytesDigest: digest(),
          failedVerificationRefs: {
            type: "array",
            minItems: 1,
            items: digest()
          }
        },
        [
          "terminalResultId",
          "terminalType",
          "diagnosticDebateId",
          "lr02GrantId",
          "forensicLatchRoot",
          "observedBytesDigest",
          "failedVerificationRefs"
        ]
      )
    ]
  };
  return object(
    {
      ...commonProperties(),
      diagnosticDebateResultId: identifier(),
      terminalResult: { $ref: "#/$defs/TerminalResult" }
    },
    ["schemaVersion", "hashProfileId", "diagnosticDebateResultId", "terminalResult"],
    { $defs: { TerminalResult: terminalResult } }
  );
}

function diagnosticContributionContract() {
  return object(
    {
      ...commonProperties(),
      contributionId: identifier(),
      diagnosticDebateId: identifier(),
      actorId: identifier(),
      phase: { enum: ["opening", "cross_response"] },
      workOrderId: identifier(),
      citations: stringArray(),
      propositions: stringArray(),
      supports: stringArray(),
      challenges: stringArray(),
      uncertainty: stringArray(),
      dissent: stringArray()
    },
    [
      "schemaVersion",
      "hashProfileId",
      "contributionId",
      "diagnosticDebateId",
      "actorId",
      "phase",
      "workOrderId",
      "citations",
      "propositions",
      "supports",
      "challenges",
      "uncertainty",
      "dissent"
    ]
  );
}

function sourceRequestDefinition() {
  const common = {
    sourceRequestId: identifier(),
    sourceObjectId: identifier(),
    sourceEventDigest: digest(),
    sourceSemanticRoot: digest(),
    upstreamOutboxId: identifier(),
    upstreamOutboxDigest: digest(),
    correlationId: identifier(),
    producerAuthorityId: identifier(),
    immutable: { const: true }
  };
  const commonRequired = [
    "sourceRequestId",
    "sourceType",
    "targetOperation",
    "sourceObjectId",
    "sourceEventDigest",
    "sourceSemanticRoot",
    "upstreamOutboxId",
    "upstreamOutboxDigest",
    "correlationId",
    "producerAuthorityId",
    "immutable"
  ];
  return closedUnion([
      object(
        {
          ...common,
          sourceType: { const: "lr03_diagnosis" },
          targetOperation: { const: "LC01" },
          conceptPatternKey: identifier(),
          diagnosticDebateRoot: digest()
        },
        [...commonRequired, "conceptPatternKey", "diagnosticDebateRoot"]
      ),
      object(
        {
          ...common,
          sourceType: { const: "completion_reflection" },
          targetOperation: { const: "LC01" },
          conceptPatternKey: identifier(),
          completionReflectionRoot: digest()
        },
        [...commonRequired, "conceptPatternKey", "completionReflectionRoot"]
      ),
      object(
        {
          ...common,
          sourceType: { const: "recognized_insight_trigger" },
          targetOperation: { const: "LC01" },
          conceptPatternKey: identifier(),
          recognizedInsightCaptureRoot: digest(),
          adjacencyEvidenceRoot: digest()
        },
        [
          ...commonRequired,
          "conceptPatternKey",
          "recognizedInsightCaptureRoot",
          "adjacencyEvidenceRoot"
        ]
      ),
      object(
        {
          ...common,
          sourceType: { const: "post_lr4_payback_observation" },
          targetOperation: { const: "LC02" },
          paybackObservationId: identifier(),
          paybackObservationRoot: digest(),
          observerAuthorityId: identifier()
        },
        [
          ...commonRequired,
          "paybackObservationId",
          "paybackObservationRoot",
          "observerAuthorityId"
        ]
      )
    ]);
}

function learningCapitalRequestStateContract(lifecycleManifest) {
  const conditionalTerminalizer = object(
    {
      terminalizerId: identifier(),
      learningCapitalRequestId: identifier(),
      grantOrDeniedProjectionId: identifier(),
      brokerClaimId: identifier(),
      fence: { type: "integer", minimum: 0 },
      requestedDisposition: {
        enum: [
          "ledger_quarantined",
          "terminal_unavailable",
          "source_unverifiable"
        ]
      }
    },
    [
      "terminalizerId",
      "learningCapitalRequestId",
      "grantOrDeniedProjectionId",
      "fence",
      "requestedDisposition"
    ]
  );
  const requestResultLedger = object(
    {
      ordinaryResultRef: digest(),
      terminalizerResultRef: digest(),
      sourceDispositionRef: digest()
    },
    []
  );
  return object(
    {
      ...commonProperties(),
      learningCapitalRequestId: identifier(),
      revision: { type: "integer", minimum: 0 },
      state: {
        enum: lifecycleStates(lifecycleManifest, "learning-capital-request")
      },
      requestStatus: {
        enum: [
          "open_eligible",
          "open_blocked_no_grant",
          "retirement_pending",
          "consumed",
          "terminal_no_admissible_success"
        ]
      },
      predecessor: predecessor(),
      sourceRequest: { $ref: "#/$defs/SourceRequest" },
      admissionClass: {
        enum: ["eligible", "blocked_by_quarantine_latch"]
      },
      operationGrantOrDeniedProjectionRef: digest(),
      brokerClaimId: identifier(),
      fence: { type: "integer", minimum: 0 },
      conditionalTerminalizer: { $ref: "#/$defs/ConditionalTerminalizer" },
      resultLedger: { $ref: "#/$defs/RequestResultLedger" },
      upstreamAcknowledgementRef: digest(),
      requestQuarantineRef: digest(),
      eventRefs: digestArray(),
      outboxRefs: digestArray()
    },
    [
      "schemaVersion",
      "hashProfileId",
      "learningCapitalRequestId",
      "revision",
      "state",
      "requestStatus",
      "predecessor",
      "sourceRequest",
      "admissionClass",
      "operationGrantOrDeniedProjectionRef",
      "fence",
      "resultLedger",
      "eventRefs",
      "outboxRefs"
    ],
    {
      $defs: {
        SourceRequest: sourceRequestDefinition(),
        ConditionalTerminalizer: conditionalTerminalizer,
        RequestResultLedger: requestResultLedger
      }
    }
  );
}

function learningCapitalOperationGrantContract() {
  const common = {
    ...commonProperties(),
    operationGrantId: identifier(),
    learningCapitalRequestId: identifier(),
    targetOperation: { enum: ["LC01", "LC02"] },
    sourceRequestDigest: digest(),
    fence: { type: "integer", minimum: 0 }
  };
  const commonRequired = [
    "schemaVersion",
    "hashProfileId",
    "operationGrantId",
    "grantClass",
    "learningCapitalRequestId",
    "targetOperation",
    "sourceRequestDigest",
    "fence",
    "invocable"
  ];
  const branches = [
      object(
        {
          ...common,
          grantClass: { const: "eligible" },
          brokerClaimId: identifier(),
          invocable: { const: true }
        },
        [...commonRequired, "brokerClaimId"]
      ),
      object(
        {
          ...common,
          grantClass: { const: "denied_projection" },
          denialReason: { const: "blocked_by_quarantine_latch" },
          requestQuarantineRef: digest(),
          invocable: { const: false }
        },
        [...commonRequired, "denialReason", "requestQuarantineRef"]
      )
    ];
  return object(
    {
      ...common,
      grantClass: { enum: ["eligible", "denied_projection"] },
      brokerClaimId: identifier(),
      invocable: { type: "boolean" },
      denialReason: { const: "blocked_by_quarantine_latch" },
      requestQuarantineRef: digest()
    },
    commonRequired,
    { oneOf: branches }
  );
}

function learningCapitalSourceDispositionContract() {
  const common = {
    ...commonProperties(),
    sourceDispositionId: identifier(),
    learningCapitalRequestId: identifier(),
    sourceRequestDigest: digest(),
    targetOperation: { enum: ["LC01", "LC02"] }
  };
  const commonRequired = [
    "schemaVersion",
    "hashProfileId",
    "sourceDispositionId",
    "kind",
    "learningCapitalRequestId",
    "sourceRequestDigest",
    "targetOperation"
  ];
  const branch = (kind, properties, required) =>
    object(
      { ...common, kind: { const: kind }, ...properties },
      [...commonRequired, ...required]
    );
  const branches = [
      branch(
        "lc01_success",
        {
          grantOrDeniedProjectionRef: digest(),
          ordinaryResultRef: digest(),
          resultingLearningCapitalRoot: digest()
        },
        [
          "grantOrDeniedProjectionRef",
          "ordinaryResultRef",
          "resultingLearningCapitalRoot"
        ]
      ),
      branch(
        "lc02_success",
        {
          grantOrDeniedProjectionRef: digest(),
          ordinaryResultRef: digest(),
          resultingLearningCapitalRoot: digest(),
          paybackObservationRef: digest()
        },
        [
          "grantOrDeniedProjectionRef",
          "ordinaryResultRef",
          "resultingLearningCapitalRoot",
          "paybackObservationRef"
        ]
      ),
      branch(
        "entry_conflict",
        {
          grantOrDeniedProjectionRef: digest(),
          ordinaryResultRef: digest(),
          conflictRef: digest(),
          resultingLearningCapitalRoot: digest()
        },
        [
          "grantOrDeniedProjectionRef",
          "ordinaryResultRef",
          "conflictRef",
          "resultingLearningCapitalRoot"
        ]
      ),
      branch(
        "terminalized_unconsumed",
        {
          grantOrDeniedProjectionRef: digest(),
          fenceRef: digest(),
          terminalizerResultRef: digest()
        },
        ["grantOrDeniedProjectionRef", "fenceRef", "terminalizerResultRef"]
      ),
      branch(
        "source_advanced",
        {
          grantOrDeniedProjectionRef: digest(),
          fenceRef: digest(),
          terminalizerResultRef: digest()
        },
        ["grantOrDeniedProjectionRef", "fenceRef", "terminalizerResultRef"]
      ),
      branch(
        "source_unverifiable",
        {
          grantOrDeniedProjectionRef: digest(),
          brokerClaimRef: digest(),
          fenceRef: digest(),
          quarantineRef: digest(),
          failedVerificationRefs: {
            type: "array",
            minItems: 1,
            items: digest()
          }
        },
        [
          "grantOrDeniedProjectionRef",
          "brokerClaimRef",
          "fenceRef",
          "quarantineRef",
          "failedVerificationRefs"
        ]
      ),
      branch(
        "learning_capital_request_source_unverifiable",
        {
          brokerClaimRef: digest(),
          fenceRef: digest(),
          drainReceiptRef: digest(),
          quarantineRef: digest(),
          observedRequestBytesDigest: digest(),
          failedVerificationRefs: {
            type: "array",
            minItems: 1,
            items: digest()
          }
        },
        [
          "brokerClaimRef",
          "fenceRef",
          "drainReceiptRef",
          "quarantineRef",
          "observedRequestBytesDigest",
          "failedVerificationRefs"
        ]
      )
    ];
  return object(
    {
      ...common,
      kind: {
        enum: [
          "lc01_success",
          "lc02_success",
          "entry_conflict",
          "terminalized_unconsumed",
          "source_advanced",
          "source_unverifiable",
          "learning_capital_request_source_unverifiable"
        ]
      },
      grantOrDeniedProjectionRef: digest(),
      brokerClaimRef: digest(),
      fenceRef: digest(),
      drainReceiptRef: digest(),
      ordinaryResultRef: digest(),
      terminalizerResultRef: digest(),
      resultingLearningCapitalRoot: digest(),
      conflictRef: digest(),
      quarantineRef: digest(),
      observedRequestBytesDigest: digest(),
      failedVerificationRefs: digestArray(),
      paybackObservationRef: digest()
    },
    commonRequired,
    { oneOf: branches }
  );
}

function paybackObservationContract() {
  return object(
    {
      ...commonProperties(),
      paybackObservationId: identifier(),
      observerId: identifier(),
      observerRegistryRevision: digest(),
      idempotencyKey: identifier(),
      observedAfterLr4Root: digest(),
      governedWorkRoot: digest(),
      learningInvestmentId: identifier(),
      conceptPatternKey: identifier(),
      baselineContractRef: digest(),
      counterfactualContractRef: digest(),
      measureKind: {
        enum: ["deleted_future_friction", "avoided_rework"]
      },
      nativeMeasure: { type: "number" },
      nativeUnit: { type: "string", minLength: 1 },
      measurementEvidenceRefs: {
        type: "array",
        minItems: 1,
        items: digest()
      },
      observerAuthorityClass: { const: "registered_payback_observer" },
      authoredPreLcr: { const: true },
      immutable: { const: true }
    },
    [
      "schemaVersion",
      "hashProfileId",
      "paybackObservationId",
      "observerId",
      "observerRegistryRevision",
      "idempotencyKey",
      "observedAfterLr4Root",
      "governedWorkRoot",
      "learningInvestmentId",
      "conceptPatternKey",
      "baselineContractRef",
      "counterfactualContractRef",
      "measureKind",
      "nativeMeasure",
      "nativeUnit",
      "measurementEvidenceRefs",
      "observerAuthorityClass",
      "authoredPreLcr",
      "immutable"
    ]
  );
}

function campaignEvidenceEnvelopeContract() {
  return object(
    {
      ...commonProperties(),
      campaignEvidenceEnvelopeId: identifier(),
      campaignId: identifier(),
      frozenAtCampaignRevision: { type: "integer", minimum: 0 },
      frozenBeforeTransition: { const: "EC20" },
      allAssignedPopulationRoot: digest(),
      instrumentValidPopulationRoot: digest(),
      releaseQualifiedPopulationRoot: digest(),
      roleContentEvidenceRoot: digest(),
      awarenessUniverseRoot: digest(),
      closedAwarenessLedgerRoot: digest(),
      awarenessDispositionCounts: object(
        {
          reported: { type: "integer", minimum: 0 },
          missingAfterContent: { type: "integer", minimum: 0 },
          missingNoContent: { type: "integer", minimum: 0 },
          notApplicable: { type: "integer", minimum: 0 }
        },
        [
          "reported",
          "missingAfterContent",
          "missingNoContent",
          "notApplicable"
        ]
      ),
      qualificationViewRoots: {
        type: "array",
        minItems: 3,
        uniqueItems: true,
        items: digest()
      },
      protectedSourceIndexRoot: digest(),
      derivationRoots: digestArray(),
      disclosurePolicyDigest: digest(),
      disclosureRecipeDigest: digest(),
      disclosureSourceFieldMapDigest: digest(),
      immutable: { const: true },
      containsProtectedUnmaskGrant: { const: false },
      containsDisclosureOutputDigest: { const: false },
      containsFutureTransitionReference: { const: false }
    },
    [
      "schemaVersion",
      "hashProfileId",
      "campaignEvidenceEnvelopeId",
      "campaignId",
      "frozenAtCampaignRevision",
      "frozenBeforeTransition",
      "allAssignedPopulationRoot",
      "instrumentValidPopulationRoot",
      "releaseQualifiedPopulationRoot",
      "roleContentEvidenceRoot",
      "awarenessUniverseRoot",
      "closedAwarenessLedgerRoot",
      "awarenessDispositionCounts",
      "qualificationViewRoots",
      "protectedSourceIndexRoot",
      "derivationRoots",
      "disclosurePolicyDigest",
      "disclosureRecipeDigest",
      "disclosureSourceFieldMapDigest",
      "immutable",
      "containsProtectedUnmaskGrant",
      "containsDisclosureOutputDigest",
      "containsFutureTransitionReference"
    ]
  );
}

function completionReflectionContract() {
  const friction = object(
    {
      status: { enum: ["friction_observed", "no_friction_observed"] },
      evidenceRefs: {
        type: "array",
        minItems: 1,
        items: digest()
      },
      observations: stringArray()
    },
    ["status", "evidenceRefs", "observations"]
  );
  return object(
    {
      ...commonProperties(),
      completionReflectionId: identifier(),
      workUnitId: identifier(),
      actorId: identifier(),
      sourceEventDigest: digest(),
      governanceFriction: friction,
      workflowFriction: friction,
      recognizedInsights: stringArray(),
      attentionClasses: {
        type: "array",
        items: { enum: ["toil", "learning_investment"] }
      },
      adjacencyEvidenceRefs: digestArray(),
      captureEvidenceRefs: digestArray(),
      conceptPatternKeys: stringArray()
    },
    [
      "schemaVersion",
      "hashProfileId",
      "completionReflectionId",
      "workUnitId",
      "actorId",
      "sourceEventDigest",
      "governanceFriction",
      "workflowFriction",
      "recognizedInsights",
      "attentionClasses",
      "adjacencyEvidenceRefs",
      "captureEvidenceRefs",
      "conceptPatternKeys"
    ]
  );
}

function learningTriggerContract() {
  return object(
    {
      ...commonProperties(),
      learningTriggerId: identifier(),
      triggerClass: {
        enum: [
          "failure_or_quarantine",
          "material_finding",
          "recognized_insight",
          "recurrent_friction",
          "work_unit_completion",
          "campaign_completion"
        ]
      },
      sourceMachineId: identifier(),
      sourceObjectId: identifier(),
      sourceRevision: { type: "integer", minimum: 0 },
      sourceEventDigest: digest(),
      sourceSemanticRoot: digest(),
      completionReflectionRoot: digest(),
      durableCaptureRoot: digest(),
      adjacencyEvidenceRoot: digest(),
      lr01ObligationId: identifier(),
      directSourceRequestObligationId: identifier()
    },
    [
      "schemaVersion",
      "hashProfileId",
      "learningTriggerId",
      "triggerClass",
      "sourceMachineId",
      "sourceObjectId",
      "sourceRevision",
      "sourceEventDigest",
      "sourceSemanticRoot",
      "lr01ObligationId"
    ],
    {
      allOf: [
        {
          if: {
            properties: {
              triggerClass: {
                enum: ["work_unit_completion", "campaign_completion"]
              }
            }
          },
          then: { required: ["completionReflectionRoot"] }
        },
        {
          if: {
            properties: { triggerClass: { const: "recognized_insight" } }
          },
          then: {
            required: [
              "durableCaptureRoot",
              "adjacencyEvidenceRoot",
              "directSourceRequestObligationId"
            ]
          }
        }
      ]
    }
  );
}

function learningStateContract(lifecycleManifest) {
  return object(
    {
      ...commonProperties(),
      learningRecordId: identifier(),
      revision: { type: "integer", minimum: 0 },
      state: {
        enum: lifecycleStates(lifecycleManifest, "learning-record")
      },
      predecessor: predecessor(),
      learningTriggerRef: digest(),
      completionReflectionRef: digest(),
      diagnosticDebateGrantRef: digest(),
      diagnosticDebateResultRef: digest(),
      lr03SourceRequestRef: digest(),
      learningCapitalSourceDispositionRef: digest(),
      handoffRef: digest(),
      decisionDispositionRef: digest(),
      eventRefs: digestArray(),
      outboxRefs: digestArray()
    },
    [
      "schemaVersion",
      "hashProfileId",
      "learningRecordId",
      "revision",
      "state",
      "predecessor",
      "learningTriggerRef",
      "eventRefs",
      "outboxRefs"
    ]
  );
}

function learningRecordContract() {
  return object(
    {
      ...commonProperties(),
      learningRecordId: identifier(),
      disposition: { enum: ["diagnosed", "diagnosis_unavailable"] },
      triggerRef: digest(),
      completionReflectionRef: digest(),
      diagnosticDebateResultRef: digest(),
      rootCausePropositions: stringArray(),
      contributionRefs: digestArray(),
      dissentRefs: digestArray(),
      attentionEconomicClass: {
        enum: ["toil", "learning_investment"]
      },
      adjacencyEvidenceRefs: digestArray(),
      captureEvidenceRefs: digestArray(),
      conceptPatternKeys: stringArray(),
      remediationChainRef: digest(),
      diagnosticCapacityHandoffRef: digest()
    },
    [
      "schemaVersion",
      "hashProfileId",
      "learningRecordId",
      "disposition",
      "triggerRef",
      "contributionRefs",
      "dissentRefs",
      "adjacencyEvidenceRefs",
      "captureEvidenceRefs",
      "conceptPatternKeys"
    ],
    {
      allOf: [
        {
          if: { properties: { disposition: { const: "diagnosed" } } },
          then: {
            required: ["diagnosticDebateResultRef", "rootCausePropositions"]
          }
        },
        {
          if: {
            properties: { disposition: { const: "diagnosis_unavailable" } }
          },
          then: { required: ["diagnosticCapacityHandoffRef"] }
        }
      ]
    }
  );
}

function learningCapitalStateContract(lifecycleManifest) {
  return object(
    {
      ...commonProperties(),
      learningCapitalId: identifier(),
      revision: { type: "integer", minimum: 0 },
      state: {
        enum: lifecycleStates(lifecycleManifest, "learning-capital")
      },
      predecessor: predecessor(),
      conceptOccurrenceIndex: {
        type: "object",
        additionalProperties: digest()
      },
      sourceRequestIndex: {
        type: "object",
        additionalProperties: digest()
      },
      paybackObservationIndex: {
        type: "object",
        additionalProperties: digest()
      },
      entryConflictIndex: {
        type: "object",
        additionalProperties: digest()
      },
      eventRefs: digestArray(),
      outboxRefs: digestArray(),
      wholeLedgerQuarantineRef: digest()
    },
    [
      "schemaVersion",
      "hashProfileId",
      "learningCapitalId",
      "revision",
      "state",
      "predecessor",
      "conceptOccurrenceIndex",
      "sourceRequestIndex",
      "paybackObservationIndex",
      "entryConflictIndex",
      "eventRefs",
      "outboxRefs"
    ]
  );
}

function conceptRegistryEntryContract() {
  return object(
    {
      ...commonProperties(),
      conceptRegistryEntryId: identifier(),
      conceptPatternKey: identifier(),
      sourceType: {
        enum: [
          "lr03_diagnosis",
          "completion_reflection",
          "recognized_insight_trigger"
        ]
      },
      observationOccurrenceId: identifier(),
      sourceEventDigest: digest(),
      recurrenceCount: { type: "integer", minimum: 1 },
      enrichmentRefs: digestArray(),
      requirementRefs: digestArray(),
      invariantRefs: digestArray(),
      enforcedTestRefs: digestArray()
    },
    [
      "schemaVersion",
      "hashProfileId",
      "conceptRegistryEntryId",
      "conceptPatternKey",
      "sourceType",
      "observationOccurrenceId",
      "sourceEventDigest",
      "recurrenceCount",
      "enrichmentRefs",
      "requirementRefs",
      "invariantRefs",
      "enforcedTestRefs"
    ]
  );
}

function attentionLedgerContract() {
  const component = object(
    {
      sourceEventDigest: digest(),
      class: { enum: ["toil", "learning_investment"] },
      subtype: {
        enum: [
          "transcription",
          "chasing",
          "archaeology",
          "refighting",
          "clarification",
          "tension_probe",
          "meta_question",
          "root_cause_mining",
          "co_design",
          "director_strategic_judgment"
        ]
      },
      nativeMeasure: { type: "number" },
      nativeUnit: { type: "string", minLength: 1 },
      evidenceRefs: { type: "array", minItems: 1, items: digest() },
      adverselyOptimizable: { type: "boolean" }
    },
    [
      "sourceEventDigest",
      "class",
      "subtype",
      "nativeMeasure",
      "nativeUnit",
      "evidenceRefs",
      "adverselyOptimizable"
    ],
    {
      allOf: [
        {
          if: { properties: { class: { const: "learning_investment" } } },
          then: { properties: { adverselyOptimizable: { const: false } } }
        }
      ]
    }
  );
  return object(
    {
      ...commonProperties(),
      attentionLedgerId: identifier(),
      sourceCutRoot: digest(),
      components: { type: "array", items: component },
      unresolvedObservationRefs: digestArray(),
      paybackObservationRefs: digestArray(),
      projectionOnly: { const: true }
    },
    [
      "schemaVersion",
      "hashProfileId",
      "attentionLedgerId",
      "sourceCutRoot",
      "components",
      "unresolvedObservationRefs",
      "paybackObservationRefs",
      "projectionOnly"
    ]
  );
}

function derivationRecordContract() {
  return object(
    {
      ...commonProperties(),
      derivationId: digest(),
      recipeId: identifier(),
      recipeDigest: digest(),
      orderedInputDigests: { type: "array", items: digest() },
      outputDigest: digest(),
      actorOrToolIdentity: identifier(),
      disclosureClass: identifier(),
      createdAt: { type: "string", format: "date-time" }
    },
    [
      "schemaVersion",
      "hashProfileId",
      "derivationId",
      "recipeId",
      "recipeDigest",
      "orderedInputDigests",
      "outputDigest",
      "actorOrToolIdentity",
      "disclosureClass",
      "createdAt"
    ]
  );
}

function recommendationContract() {
  return object(
    {
      ...commonProperties(),
      recommendationId: identifier(),
      recommendationClass: {
        enum: [
          "recommend_accept",
          "recommend_accept_with_guardrails",
          "recommend_revise_and_repeat",
          "recommend_reject",
          "insufficient_or_invalid_evidence"
        ]
      },
      analysisResultDigest: digest(),
      policyDigest: digest(),
      dimensionalResultRefs: digestArray(),
      limitationRefs: digestArray(),
      promotionAuthorized: { const: false }
    },
    [
      "schemaVersion",
      "hashProfileId",
      "recommendationId",
      "recommendationClass",
      "analysisResultDigest",
      "policyDigest",
      "dimensionalResultRefs",
      "limitationRefs",
      "promotionAuthorized"
    ]
  );
}

const EXISTING_SCHEMA_CONTRACT_FACTORIES = Object.freeze({
  "methodology.schema.json": methodologyContract,
  "hash-profile.schema.json": hashProfileContract,
  "genesis-record.schema.json": genesisContract,
  "package-manifest.schema.json": packageManifestContract,
  "generated-lock.schema.json": generatedLockContract,
  "requirement-descriptor.schema.json": requirementDescriptorContract,
  "mechanism-descriptor.schema.json": mechanismDescriptorContract,
  "fragment-descriptor.schema.json": fragmentDescriptorContract,
  "projection-descriptor.schema.json": projectionDescriptorContract,
  "metric-descriptor.schema.json": metricDescriptorContract,
  "lifecycle-transition.schema.json": lifecycleTransitionContract,
  "transition-participant-policy.schema.json": participantPolicyContract,
  "event.schema.json": eventContract,
  "outbox-message.schema.json": outboxContract,
  "quarantine.schema.json": quarantineContract,
  "diagnostic-debate-state.schema.json": diagnosticDebateStateContract,
  "diagnostic-debate.schema.json": diagnosticDebateContract,
  "diagnostic-contribution.schema.json": diagnosticContributionContract,
  "learning-capital-request-state.schema.json":
    learningCapitalRequestStateContract,
  "learning-capital-operation-grant.schema.json":
    learningCapitalOperationGrantContract,
  "learning-capital-source-disposition.schema.json":
    learningCapitalSourceDispositionContract,
  "payback-observation.schema.json": paybackObservationContract,
  "completion-reflection.schema.json": completionReflectionContract,
  "learning-trigger.schema.json": learningTriggerContract,
  "learning-state.schema.json": learningStateContract,
  "learning-record.schema.json": learningRecordContract,
  "learning-capital-state.schema.json": learningCapitalStateContract,
  "concept-registry-entry.schema.json": conceptRegistryEntryContract,
  "attention-ledger.schema.json": attentionLedgerContract,
  "campaign-evidence-envelope.schema.json":
    campaignEvidenceEnvelopeContract,
  "derivation-record.schema.json": derivationRecordContract,
  "recommendation.schema.json": recommendationContract,
  "test-evidence.schema.json": testEvidenceContract
});

export const EXPLICIT_SCHEMA_CONTRACT_NAMES = Object.freeze(
  [
    ...new Set([
      ...Object.keys(EXISTING_SCHEMA_CONTRACT_FACTORIES),
      ...DECLARATIVE_SCHEMA_NAMES
    ])
  ].sort()
);

if (EXPLICIT_SCHEMA_CONTRACT_NAMES.length !== 141) {
  throw new Error(
    `explicit schema contract registry must contain 141 names, got ${EXPLICIT_SCHEMA_CONTRACT_NAMES.length}`
  );
}

function resolveSchemaContract(file, { lifecycleManifest } = {}) {
  const declarative = declarativeSchemaContract(file, { lifecycleManifest });
  if (declarative) return declarative;
  const existing = EXISTING_SCHEMA_CONTRACT_FACTORIES[file];
  if (!existing) {
    throw new Error(`schema catalog name has no explicit contract: ${file}`);
  }
  return existing(lifecycleManifest);
}

export function validateSchemaCatalog(catalog) {
  if (catalog.schemaVersion !== "1.0.0" || catalog.dialect !== DIALECT) {
    throw new Error("unsupported schema catalog version or dialect");
  }
  if (catalog.idPrefix !== ID_PREFIX) {
    throw new Error(`unexpected schema ID prefix: ${catalog.idPrefix}`);
  }
  if (!Array.isArray(catalog.schemas) || catalog.schemas.length !== 141) {
    throw new Error(`schema catalog must contain exactly 141 names`);
  }
  const unique = new Set(catalog.schemas);
  if (unique.size !== 141) {
    throw new Error("schema catalog names are not unique");
  }
  for (const file of catalog.schemas) {
    if (
      path.posix.basename(file) !== file ||
      !/^[a-z0-9-]+\.schema\.json$/u.test(file)
    ) {
      throw new Error(`invalid schema filename: ${file}`);
    }
  }
  const actual = [...catalog.schemas].sort();
  if (JSON.stringify(actual) !== JSON.stringify(EXPLICIT_SCHEMA_CONTRACT_NAMES)) {
    const actualSet = new Set(actual);
    const missing = EXPLICIT_SCHEMA_CONTRACT_NAMES.filter(
      (filename) => !actualSet.has(filename)
    );
    const expectedSet = new Set(EXPLICIT_SCHEMA_CONTRACT_NAMES);
    const unknown = actual.filter((filename) => !expectedSet.has(filename));
    throw new Error(
      `schema catalog differs from the explicit contract registry; missing=${missing.join(",") || "none"}; unknown=${unknown.join(",") || "none"}`
    );
  }
}

export function generateSchemas(catalog, { lifecycleManifest } = {}) {
  validateSchemaCatalog(catalog);
  const generated = new Map();
  const ids = new Set();
  for (const file of catalog.schemas) {
    const id = `${catalog.idPrefix}${file.replace(/\.schema\.json$/u, "")}`;
    if (ids.has(id)) throw new Error(`duplicate generated schema ID: ${id}`);
    ids.add(id);
    const body = resolveSchemaContract(file, { lifecycleManifest });
    const schema = {
      $schema: DIALECT,
      $id: id,
      title: file.replace(/\.schema\.json$/u, ""),
      ...body
    };
    if (schema.additionalProperties !== false) {
      throw new Error(`schema is not closed: ${file}`);
    }
    generated.set(`schemas/${file}`, schema);
  }
  return generated;
}
