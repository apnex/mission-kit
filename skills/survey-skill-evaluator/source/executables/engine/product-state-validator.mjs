import { deepCloneCanonical, deepFreeze } from "./canonical-json.mjs";
import { IntegrityError, ValidationError } from "./errors.mjs";
import { HASH_PROFILE_ID } from "./hash.mjs";

const CANONICAL_PRODUCT_SCHEMAS = Object.freeze({
  "scenario-authoring-entry": {
    schemaId: "scenario-state",
    idField: "scenarioId",
  },
  "scenario-cohort-use": {
    schemaId: "scenario-bank-state",
    idField: "scenarioBankId",
  },
  "evaluation-decision-lineage": {
    schemaId: "evaluation-decision-lineage-state",
    idField: "decisionLineageId",
  },
  "reviewer-capacity-global": {
    schemaId: "reviewer-capacity-state",
    idField: "reviewerCapacityLedgerId",
  },
  "reviewer-capacity-entry": {
    schemaId: "product-state",
    idField: "productStateId",
  },
  "confirmatory-family": {
    schemaId: "confirmatory-family-state",
    idField: "confirmatoryFamilyId",
  },
  awareness: {
    schemaId: "awareness-state",
    idField: "awarenessId",
  },
  campaign: {
    schemaId: "campaign-state",
    idField: "campaignId",
  },
  assignment: {
    schemaId: "assignment-state",
    idField: "assignmentId",
  },
  attempt: {
    schemaId: "run-state",
    idField: "runId",
  },
  "review-slot": {
    schemaId: "review-state",
    idField: "reviewId",
  },
  "runtime-availability": {
    schemaId: "product-state",
    idField: "productStateId",
  },
  "learning-record": {
    schemaId: "learning-state",
    idField: "learningId",
  },
  "diagnostic-debate": {
    schemaId: "diagnostic-debate-state",
    idField: "diagnosticDebateId",
  },
  "learning-capital-request": {
    schemaId: "learning-capital-request-state",
    idField: "learningCapitalRequestId",
  },
  "learning-capital": {
    schemaId: "learning-capital-state",
    idField: "learningCapitalId",
  },
  "evaluator-assurance": {
    schemaId: "assurance-state",
    idField: "assuranceId",
  },
});

function semanticState(record) {
  return record?.authoritativeStateCore?.semanticState;
}

function semanticStateName(record) {
  const semantic = semanticState(record);
  return semantic?.state ?? semantic?.semantic?.state;
}

function lastTransitionId(record) {
  const event = record.authoritativeStateCore.eventLedger.at(-1);
  return event?.core?.transitionId ?? "genesis.parent-staged";
}

function predecessor(record) {
  const event = record.authoritativeStateCore.eventLedger.at(-1);
  if (!event) {
    const genesis = record.genesisRecord;
    if (!genesis) {
      throw new IntegrityError(
        "Genesis product state is missing its closed predecessor evidence",
      );
    }
    return {
      kind: "parent_staged_genesis",
      genesisRecordDigest: genesis.genesisRecordDigest,
      initialSemanticCoreDigest: genesis.initialSemanticCoreDigest,
      initialAuthoritativeStateRoot: genesis.initialAuthoritativeStateRoot,
    };
  }
  if (event.core.priorRevision?.kind === "absent") {
    return {
      kind: "absent",
      machineId: record.machineId,
      objectId: record.objectId,
      schemaVersion: record.schemaVersion,
      absentSentinel: event.core.predecessor.authoritativeStateRoot,
    };
  }
  return {
    kind: "existing",
    objectId: record.objectId,
    revision: event.core.priorRevision,
    authoritativeStateRoot:
      event.core.predecessor.authoritativeStateRoot,
  };
}

function semanticData(record) {
  const semantic = semanticState(record);
  if (semantic.data) return deepCloneCanonical(semantic.data);
  const initial = deepCloneCanonical(semantic.semantic ?? {});
  delete initial.state;
  return initial;
}

function runtimePhase(registry, machineId, state, revision) {
  const machine = registry.machine(machineId);
  const hasExit = machine.transitions.some(
    (transition) => transition.fromState === state,
  );
  if (!hasExit) {
    return {
      semanticPhase: "terminal",
      runtimeStatus: "closed",
      rejoinRule: "read_only",
    };
  }
  if (revision === 0) {
    return {
      semanticPhase: "dormant",
      runtimeStatus: "not_started",
      rejoinRule: "admit_from_sealed_predecessor",
    };
  }
  return {
    semanticPhase: "active",
    runtimeStatus: "ready",
    rejoinRule: "verify_authoritative_root_and_cursor",
  };
}

export class RuntimeProductStateValidator {
  constructor({
    schemaValidator,
    registry,
    schemaByMachine = null,
  }) {
    if (!schemaValidator || typeof schemaValidator.assert !== "function") {
      throw new ValidationError(
        "RuntimeProductStateValidator requires generated schema authority",
      );
    }
    if (!registry || !(registry.machines instanceof Map)) {
      throw new ValidationError(
        "RuntimeProductStateValidator requires lifecycle registry authority",
      );
    }
    const selection =
      schemaByMachine ??
      Object.fromEntries(
        [...registry.machines.keys()].map((machineId) => [
          machineId,
          CANONICAL_PRODUCT_SCHEMAS[machineId] ?? {
            schemaId: "product-state",
            idField: "productStateId",
          },
        ]),
      );
    const normalized = {};
    for (const machineId of registry.machines.keys()) {
      const selected = selection[machineId];
      const descriptor =
        typeof selected === "string"
          ? {
              schemaId: selected,
              idField:
                selected === "product-state"
                  ? "productStateId"
                  : CANONICAL_PRODUCT_SCHEMAS[machineId]?.idField,
            }
          : selected;
      if (
        !descriptor ||
        typeof descriptor.schemaId !== "string" ||
        descriptor.schemaId.length === 0 ||
        typeof descriptor.idField !== "string" ||
        descriptor.idField.length === 0
      ) {
        throw new ValidationError(
          "Product-state schema selection is missing for a lifecycle machine",
          { machineId },
        );
      }
      schemaValidator.schema(descriptor.schemaId);
      normalized[machineId] = deepFreeze({
        schemaId: descriptor.schemaId,
        idField: descriptor.idField,
      });
    }
    const unexpected = Object.keys(selection).filter(
      (machineId) => !registry.machines.has(machineId),
    );
    if (unexpected.length > 0) {
      throw new ValidationError(
        "Product-state schema selection names an unknown lifecycle machine",
        { unexpected },
      );
    }
    this.schemaValidator = schemaValidator;
    this.registry = registry;
    this.schemaByMachine = deepFreeze(normalized);
  }

  validate(record) {
    const semantic = semanticState(record);
    if (!semantic || !Number.isInteger(semantic.revision)) {
      throw new IntegrityError(
        "Authoritative record has no semantic product-state revision",
      );
    }
    const state = semanticStateName(record);
    if (typeof state !== "string" || state.length === 0) {
      throw new IntegrityError(
        "Authoritative record has no semantic product-state state",
      );
    }
    const selection = this.schemaByMachine[record.machineId];
    if (!selection) {
      throw new IntegrityError(
        "Authoritative machine has no product-state schema selection",
        { machineId: record.machineId },
      );
    }
    const projection =
      selection.schemaId === "product-state"
        ? {
            schemaVersion: record.schemaVersion,
            hashProfileId: HASH_PROFILE_ID,
            productStateId: record.objectId,
            machineId: record.machineId,
            phaseRuntime: runtimePhase(
              this.registry,
              record.machineId,
              state,
              semantic.revision,
            ),
            transitionId: lastTransitionId(record),
            authoritativeStateRoot: record.authoritativeStateRoot,
          }
        : {
            schemaVersion: record.schemaVersion,
            hashProfileId: HASH_PROFILE_ID,
            [selection.idField]: record.objectId,
            machineId: record.machineId,
            revision: semantic.revision,
            state,
            predecessor: predecessor(record),
            eventRefs: record.authoritativeStateCore.eventLedger.map(
              (event) => event.eventRoot,
            ),
            outboxRefs: record.authoritativeStateCore.outboxLedger.map(
              (entry) => entry.messageDigest,
            ),
            ...semanticData(record),
          };
    this.schemaValidator.assert(selection.schemaId, projection);
    return {
      schemaId: selection.schemaId,
      projection: deepCloneCanonical(projection),
    };
  }
}

export { CANONICAL_PRODUCT_SCHEMAS };
