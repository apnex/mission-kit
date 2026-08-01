import {
  canonicalize,
  deepCloneCanonical,
} from "./canonical-json.mjs";
import { types as utilTypes } from "node:util";
import {
  HASH_PROFILE_ID,
  absentAuthoritativeStateRoot,
  hashCanonical,
  outboxMessageDigest,
  parentStagedGenesis,
  statePredecessor,
} from "./hash.mjs";
import {
  AuthorizationError,
  ConflictError,
  IntegrityError,
  ValidationError,
} from "./errors.mjs";
import { verifyAuthoritativeState } from "./state-store.mjs";

const FORBIDDEN_ACTION_KEYS = new Set([
  "eventRoot",
  "resultingSemanticCoreDigest",
  "authoritativeStateRoot",
  "messageDigest",
  "materializedFileDigest",
]);

function assertNoForbiddenFutureReference(value, path = "$") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoForbiddenFutureReference(item, `${path}[${index}]`),
    );
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    if (FORBIDDEN_ACTION_KEYS.has(key)) {
      throw new ValidationError("Action output contains a future/self-reference field", {
        path: `${path}.${key}`,
        key,
      });
    }
    assertNoForbiddenFutureReference(item, `${path}.${key}`);
  }
}

function existingIdempotentResult(current, transition, command) {
  if (!current) return null;
  const event = current.authoritativeStateCore.eventLedger.find(
    (candidate) => candidate.core.idempotencyKey === command.idempotencyKey,
  );
  if (!event) return null;
  if (
    event.core.transitionId !== transition.transitionId ||
    event.core.inputDigest !== command.inputDigest
  ) {
    throw new IntegrityError("Idempotency key was reused with different bytes", {
      idempotencyKey: command.idempotencyKey,
      existingTransitionId: event.core.transitionId,
      requestedTransitionId: transition.transitionId,
      existingInputDigest: event.core.inputDigest,
      requestedInputDigest: command.inputDigest,
    });
  }
  return {
    replayed: true,
    transitionId: transition.transitionId,
    revision: event.core.resultingRevision,
    eventRoot: event.eventRoot,
    semanticCoreDigest: event.resultingSemanticCoreDigest,
    authoritativeStateRoot: current.authoritativeStateRoot,
    state: current.authoritativeStateCore.semanticState.state,
  };
}

function normalizeActionResult(result) {
  if (result === undefined) return { core: {}, messages: [] };
  if (
    result &&
    typeof result === "object" &&
    (Object.hasOwn(result, "core") || Object.hasOwn(result, "messages"))
  ) {
    return {
      core: result.core ?? {},
      messages: result.messages ?? [],
    };
  }
  return { core: result, messages: [] };
}

export class LifecycleEngine {
  constructor({
    registry,
    stateStore,
    authorityReceiptVerifier = null,
    guards = {},
    actions = {},
    mutations = {},
  }) {
    this.registry = registry;
    this.stateStore = stateStore;
    this.authorityReceiptVerifier = authorityReceiptVerifier;
    this.guards = new Map(Object.entries(guards));
    this.actions = new Map(Object.entries(actions));
    this.mutations = new Map(Object.entries(mutations));
    this.guards.set("always", this.guards.get("always") ?? (() => ({ pass: true })));
    this.actions.set("none", this.actions.get("none") ?? (() => ({ core: {}, messages: [] })));
    this.mutations.set(
      "replace",
      this.mutations.get("replace") ??
        (({ command, currentData }) => ({
          ...(currentData ?? {}),
          ...(command.mutation ?? command.input ?? {}),
        })),
    );
    this.mutations.set(
      "merge",
      this.mutations.get("merge") ?? this.mutations.get("replace"),
    );
  }

  registerGuard(id, handler) {
    this.guards.set(id, handler);
    return this;
  }

  registerAction(id, handler) {
    this.actions.set(id, handler);
    return this;
  }

  registerMutation(id, handler) {
    this.mutations.set(id, handler);
    return this;
  }

  async execute(command) {
    command = deepCloneCanonical(command);
    for (const required of [
      "transitionId",
      "objectId",
      "expectedRevision",
      "idempotencyKey",
      "inputDigest",
    ]) {
      if (command[required] === undefined || command[required] === null) {
        throw new ValidationError("Lifecycle command is missing a required field", {
          field: required,
        });
      }
    }
    const transition = this.registry.transition(command.transitionId);
    const machineId = command.machineId ?? transition.machineId;
    if (machineId !== transition.machineId) {
      throw new ValidationError("Command machine does not own transition", {
        machineId,
        transitionMachineId: transition.machineId,
      });
    }
    const policy = this.registry.participantPolicy(transition.participantPolicyId);
    const policyDigest = this.registry.participantPolicyDigest(
      transition.participantPolicyId,
    );
    if (
      command.participantPolicyId !== undefined &&
      command.participantPolicyId !== transition.participantPolicyId
    ) {
      throw new AuthorizationError("Command participant policy ID is incorrect");
    }
    if (
      command.participantPolicyDigest !== undefined &&
      command.participantPolicyDigest !== policyDigest
    ) {
      throw new AuthorizationError("Command participant policy digest is incorrect");
    }
    if (!this.authorityReceiptVerifier) {
      throw new AuthorizationError(
        "Lifecycle execution requires an external authority trust root",
      );
    }
    const authorityVerification = this.authorityReceiptVerifier.verify({
      policy,
      command,
      machineId,
      participantPolicyDigest: policyDigest,
    });

    return this.stateStore.transact(machineId, command.objectId, async (current) => {
      const replay = existingIdempotentResult(current, transition, command);
      if (replay) return { next: null, result: replay };
      const currentSemantic = current?.authoritativeStateCore.semanticState ?? null;
      const actualRevision = currentSemantic?.revision ?? { kind: "absent" };
      const expectedAbsent =
        command.expectedRevision === "absent" ||
        command.expectedRevision?.kind === "absent";
      if (current === null && !expectedAbsent) {
        throw new ConflictError("Expected revision does not match absent state", {
          expectedRevision: command.expectedRevision,
        });
      }
      if (
        current !== null &&
        (expectedAbsent || command.expectedRevision !== currentSemantic.revision)
      ) {
        throw new ConflictError("Expected revision is stale", {
          expectedRevision: command.expectedRevision,
          actualRevision: currentSemantic.revision,
        });
      }
      if (current === null && transition.creationClass !== "absent") {
        throw new ConflictError("Transition cannot create an absent object", {
          transitionId: transition.transitionId,
          creationClass: transition.creationClass,
        });
      }
      if (current !== null && transition.creationClass === "absent") {
        throw new ConflictError("Absent-only transition cannot mutate an existing object", {
          transitionId: transition.transitionId,
        });
      }
      const actualState =
        currentSemantic?.state ?? currentSemantic?.semantic?.state ?? "absent";
      if (actualState !== transition.fromState) {
        throw new ConflictError("Transition source state does not match", {
          transitionId: transition.transitionId,
          expectedState: transition.fromState,
          actualState,
        });
      }
      const guard = this.guards.get(transition.guardId);
      if (!guard) {
        throw new ValidationError("No implementation is registered for guard", {
          guardId: transition.guardId,
        });
      }
      const guardResult =
        (await guard({
          command: deepCloneCanonical(command),
          transition,
          current: current ? deepCloneCanonical(current) : null,
          policy,
        })) ?? { pass: true };
      if (guardResult === false || guardResult.pass === false) {
        throw new ConflictError("Lifecycle transition guard rejected the command", {
          transitionId: transition.transitionId,
          guardId: transition.guardId,
          guardResult,
        });
      }

      const actionReceipts = [];
      const stagedMessages = [];
      const pipeline = this.registry.actionPipeline(transition.actionPipelineId);
      for (const descriptor of pipeline.actions) {
        const actionId =
          typeof descriptor === "string" ? descriptor : descriptor.actionId;
        const handler = this.actions.get(actionId);
        if (!handler) {
          throw new ValidationError("No implementation is registered for action", {
            actionId,
            actionPipelineId: transition.actionPipelineId,
          });
        }
        const actionInvocation = handler({
          command: deepCloneCanonical(command),
          transition,
          current: current ? deepCloneCanonical(current) : null,
          priorActionReceipts: deepCloneCanonical(actionReceipts),
        });
        if (utilTypes.isProxy(actionInvocation)) {
          throw new ValidationError(
            "Lifecycle action returned an executable proxy view",
            { actionId },
          );
        }
        const rawActionResult = await actionInvocation;
        const inertActionResult =
          rawActionResult === undefined
            ? undefined
            : deepCloneCanonical(rawActionResult);
        const normalized = normalizeActionResult(inertActionResult);
        assertNoForbiddenFutureReference(normalized.core);
        normalized.messages.forEach((message) =>
          assertNoForbiddenFutureReference(message),
        );
        const actionOutputCoreDigest = hashCanonical(
          "action-output-core/v1",
          normalized.core,
        );
        actionReceipts.push({
          actionId,
          executorAuthorityId:
            typeof descriptor === "string"
              ? null
              : descriptor.executorAuthorityId ?? null,
          actionOutputCoreDigest,
          outputCore: normalized.core,
        });
        stagedMessages.push(...normalized.messages);
      }
      stagedMessages.push(...(command.outbox ?? []));
      stagedMessages.forEach((message) => assertNoForbiddenFutureReference(message));

      const priorRevision =
        current === null ? { kind: "absent" } : currentSemantic.revision;
      const priorRoot =
        current?.authoritativeStateRoot ??
        absentAuthoritativeStateRoot(
          machineId,
          command.objectId,
          this.stateStore.schemaVersion,
        );
      const predecessorDigest = statePredecessor(
        command.objectId,
        priorRevision,
        priorRoot,
      );
      const resultingRevision = current === null ? 1 : currentSemantic.revision + 1;
      const eventCore = {
        hashProfileId: HASH_PROFILE_ID,
        transitionId: transition.transitionId,
        machineId,
        eventType: transition.eventType,
        objectId: command.objectId,
        priorRevision,
        resultingRevision,
        predecessor: {
          authoritativeStateRoot: priorRoot,
          predecessorDigest,
        },
        participantPolicyId: transition.participantPolicyId,
        participantPolicyDigest: policyDigest,
        authorityTrustRootDigest: authorityVerification.trustRootDigest,
        authorityCommandScopeDigest:
          authorityVerification.commandScopeDigest,
        authorizationReceiptDigests:
          authorityVerification.receiptDigests,
        guardId: transition.guardId,
        guardResult,
        actionPipelineId: transition.actionPipelineId,
        actionReceipts,
        mutationId: transition.mutationId,
        inputDigest: command.inputDigest,
        idempotencyKey: command.idempotencyKey,
        parentOrderId: command.parentOrderId ?? null,
        parentFence: command.parentFence ?? null,
      };
      const eventRoot = hashCanonical("semantic-event/v1", eventCore);
      const mutation =
        this.mutations.get(transition.mutationId) ??
        (transition.mutationId === "none"
          ? ({ currentData }) => currentData ?? {}
          : null);
      if (!mutation) {
        throw new ValidationError("No implementation is registered for mutation", {
          mutationId: transition.mutationId,
        });
      }
      const nextData = await mutation({
        command: deepCloneCanonical(command),
        transition,
        currentData: deepCloneCanonical(
          currentSemantic?.data ??
            (currentSemantic?.semantic
              ? Object.fromEntries(
                  Object.entries(currentSemantic.semantic).filter(
                    ([key]) => key !== "state",
                  ),
                )
              : {}),
        ),
        actionReceipts: deepCloneCanonical(actionReceipts),
        guardResult: deepCloneCanonical(guardResult),
      });
      const semanticState = {
        revision: resultingRevision,
        creationClass: transition.creationClass,
        state: transition.toState,
        data: nextData ?? {},
        lastEventRoot: eventRoot,
      };
      const semanticCoreDigest = hashCanonical(
        "resulting-semantic-core/v1",
        semanticState,
      );
      const eventRecord = {
        core: eventCore,
        eventRoot,
        resultingSemanticCoreDigest: semanticCoreDigest,
      };
      const outboxLedger = deepCloneCanonical(
        current?.authoritativeStateCore.outboxLedger ?? [],
      );
      for (const message of stagedMessages) {
        const payload = {
          ...message,
          hashProfileId: HASH_PROFILE_ID,
          source: {
            machineId,
            objectId: command.objectId,
            revision: resultingRevision,
            predecessorDigest,
            eventRoot,
            semanticCoreDigest,
          },
        };
        const messageDigest = outboxMessageDigest(payload);
        const existing = outboxLedger.find(
          (entry) => entry.messageDigest === messageDigest,
        );
        if (existing) continue;
        outboxLedger.push({
          payload,
          messageDigest,
          deliveryState: "pending",
          attempts: [],
          acknowledgements: [],
        });
      }
      const authoritativeStateCore = {
        semanticState,
        semanticCoreDigest,
        eventLedger: [
          ...(current?.authoritativeStateCore.eventLedger ?? []),
          eventRecord,
        ],
        outboxLedger,
      };
      const authoritativeStateRoot = hashCanonical(
        "authoritative-state/v1",
        authoritativeStateCore,
      );
      const next = {
        hashProfileId: HASH_PROFILE_ID,
        machineId,
        objectId: command.objectId,
        schemaVersion: this.stateStore.schemaVersion,
        authoritativeStateCore,
        authoritativeStateRoot,
      };
      verifyAuthoritativeState(next, {
        machineId,
        objectId: command.objectId,
        schemaVersion: this.stateStore.schemaVersion,
      });
      return {
        next,
        expectedRoot: current?.authoritativeStateRoot,
        result: {
          replayed: false,
          transitionId: transition.transitionId,
          revision: resultingRevision,
          state: transition.toState,
          eventRoot,
          semanticCoreDigest,
          authoritativeStateRoot,
          outboxMessageDigests: outboxLedger
            .slice(current?.authoritativeStateCore.outboxLedger.length ?? 0)
            .map((entry) => entry.messageDigest),
        },
      };
    });
  }

  async createParentStagedGenesis({
    machineId,
    objectId,
    initialState,
    initialData = {},
    parentBinding,
  }) {
    if (!parentBinding) {
      throw new ValidationError("Parent-staged genesis requires a parent binding");
    }
    return this.stateStore.transact(machineId, objectId, async (current) => {
      if (current) {
        const verified = verifyAuthoritativeState(current, {
          machineId,
          objectId,
          schemaVersion: this.stateStore.schemaVersion,
        });
        if (verified.revision !== 0) {
          throw new ConflictError("Existing object is not a genesis record");
        }
        return {
          next: null,
          result: {
            replayed: true,
            revision: 0,
            authoritativeStateRoot: current.authoritativeStateRoot,
          },
        };
      }
      const initialSemanticPayload = {
        state: initialState,
        ...deepCloneCanonical(initialData),
      };
      const generated = parentStagedGenesis({
        machineId,
        objectId,
        schemaVersion: this.stateStore.schemaVersion,
        parentMachineId: parentBinding.parentMachineId,
        parentObjectId: parentBinding.parentObjectId,
        parentPriorAuthoritativeRoot:
          parentBinding.parentPriorAuthoritativeRoot,
        parentOrderId: parentBinding.parentOrderId,
        parentFence: parentBinding.parentFence,
        initialSemanticPayload,
      });
      const {
        genesisCore,
        genesisCoreDigest,
        semanticState,
        initialSemanticCoreDigest: semanticCoreDigest,
        authoritativeStateCore,
        initialAuthoritativeStateRoot: authoritativeStateRoot,
        genesisRecord,
        genesisRecordDigest,
      } = generated;
      assertNoForbiddenFutureReference(genesisCore);
      const next = {
        hashProfileId: HASH_PROFILE_ID,
        machineId,
        objectId,
        schemaVersion: this.stateStore.schemaVersion,
        authoritativeStateCore,
        authoritativeStateRoot,
        genesisRecord: {
          ...genesisRecord,
          genesisRecordDigest,
        },
      };
      return {
        next,
        result: {
          replayed: false,
          revision: 0,
          authoritativeStateRoot,
          semanticCoreDigest,
          genesisRecord,
          genesisRecordDigest,
        },
      };
    });
  }
}
