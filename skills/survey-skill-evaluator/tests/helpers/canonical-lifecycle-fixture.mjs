import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  LifecycleEngine,
  LifecycleRegistry,
  RuntimeProductStateValidator,
  SchemaValidator,
  StateStore,
  deepCloneCanonical,
  hashCanonical,
  requiredCommandAuthorityIds,
} from "../../source/executables/engine/index.mjs";
import { packageRoot } from "./package-root.mjs";
import { createExternalAuthorityFixture } from "./external-authority-fixture.mjs";

function commandAuthorities(policy) {
  if (policy.commandAuthority.kind === "single") {
    return [policy.commandAuthority.authorityId];
  }
  return [...policy.commandAuthority.authorityIds];
}

export async function makeCanonicalLifecycleFixture({
  transitionIds,
  guardByTransition = {},
  mutationByTransition = {},
  actionById = {},
} = {}) {
  const rootPath = await mkdtemp(
    join(tmpdir(), "survey-evaluator-canonical-lifecycle-"),
  );
  const registry = await LifecycleRegistry.fromFile(
    join(packageRoot, "source", "manifests", "lifecycles.json"),
  );
  const schemaValidator = await SchemaValidator.fromPackageRoot(packageRoot);
  const authority = createExternalAuthorityFixture({
    authorityIds: [
      ...new Set(
        [...registry.participantPolicies.values()].flatMap((policy) =>
          requiredCommandAuthorityIds(policy),
        ),
      ),
    ],
    schemaValidator,
  });
  const stateStore = new StateStore({
    rootPath,
    schemaVersion: "1.0.0",
    productStateValidator: new RuntimeProductStateValidator({
      schemaValidator,
      registry,
      schemaByMachine: Object.fromEntries(
        [...registry.machines.keys()].map((machineId) => [
          machineId,
          "product-state",
        ]),
      ),
    }),
  });
  await stateStore.initialize();

  const guards = {};
  const actions = {};
  const mutations = {};
  for (const transitionId of transitionIds) {
    const transition = registry.transition(transitionId);
    const registeredGuard =
      guardByTransition[transitionId] ??
      (() => ({ pass: true, testAdapter: "canonical-lifecycle-fixture" }));
    guards[transition.guardId] = (context) => {
      const semanticState =
        context.current?.authoritativeStateCore.semanticState ?? null;
      const currentData =
        semanticState?.data ??
        (semanticState?.semantic
          ? Object.fromEntries(
              Object.entries(semanticState.semantic).filter(
                ([key]) => key !== "state",
              ),
            )
          : {});
      return registeredGuard({
        ...context,
        currentData: deepCloneCanonical(currentData),
      });
    };
    mutations[transition.mutationId] =
      mutationByTransition[transitionId] ??
      (({ currentData, command }) => ({
        ...currentData,
        lastTransitionInput: deepCloneCanonical(command.input ?? {}),
      }));
    for (const descriptor of registry.actionPipeline(
      transition.actionPipelineId,
    ).actions) {
      const actionId =
        typeof descriptor === "string" ? descriptor : descriptor.actionId;
      actions[actionId] =
        actionById[actionId] ??
        (({ transition: invokedTransition }) => ({
          core: {
            actionId,
            transitionId: invokedTransition.transitionId,
            testAdapter: "canonical-lifecycle-fixture",
          },
        }));
    }
  }

  const engine = new LifecycleEngine({
    registry,
    stateStore,
    authorityReceiptVerifier: authority.verifier,
    guards,
    actions,
    mutations,
  });

  async function reopen() {
    const reopenedRegistry = await LifecycleRegistry.fromFile(
      join(packageRoot, "source", "manifests", "lifecycles.json"),
    );
    const reopenedStateStore = new StateStore({
      rootPath,
      schemaVersion: "1.0.0",
      productStateValidator: new RuntimeProductStateValidator({
        schemaValidator,
        registry: reopenedRegistry,
        schemaByMachine: Object.fromEntries(
          [...reopenedRegistry.machines.keys()].map((machineId) => [
            machineId,
            "product-state",
          ]),
        ),
      }),
    });
    await reopenedStateStore.initialize();
    return {
      registry: reopenedRegistry,
      stateStore: reopenedStateStore,
      engine: new LifecycleEngine({
        registry: reopenedRegistry,
        stateStore: reopenedStateStore,
        authorityReceiptVerifier: authority.verifier,
        guards,
        actions,
        mutations,
      }),
    };
  }

  function commandFor({
    transitionId,
    objectId,
    expectedRevision,
    idempotencyKey,
    input = {},
    authorityIds = null,
    participantPolicyId = null,
    participantPolicyDigest = null,
  }) {
    const transition = registry.transition(transitionId);
    const policy = registry.participantPolicy(
      transition.participantPolicyId,
    );
    const command = {
      machineId: transition.machineId,
      objectId,
      transitionId,
      expectedRevision,
      participantPolicyId:
        participantPolicyId ?? transition.participantPolicyId,
      participantPolicyDigest:
        participantPolicyDigest ??
        registry.participantPolicyDigest(transition.participantPolicyId),
      idempotencyKey,
      input: deepCloneCanonical(input),
      inputDigest: hashCanonical(
        "canonical-lifecycle-fixture-input/v1",
        input,
      ),
      parentOrderId: "canonical-lifecycle-fixture:parent-order",
      parentFence: 0,
    };
    if (
      authorityIds !== null &&
      JSON.stringify([...authorityIds].sort()) !==
        JSON.stringify(commandAuthorities(policy).sort())
    ) {
      return { ...command, authorizationReceipts: [] };
    }
    return authority.authorizeSync({
      policy,
      command,
      machineId: transition.machineId,
      participantPolicyDigest:
        command.participantPolicyDigest,
    });
  }

  async function seed({
    transitionId,
    objectId,
    initialState = null,
    initialData = {},
  }) {
    const transition = registry.transition(transitionId);
    return engine.createParentStagedGenesis({
      machineId: transition.machineId,
      objectId,
      initialState: initialState ?? transition.fromState,
      initialData,
      parentBinding: {
        parentMachineId: "canonical-lifecycle-fixture",
        parentObjectId: objectId,
        parentPriorAuthoritativeRoot: hashCanonical(
          "canonical-lifecycle-fixture-parent/v1",
          { transitionId, objectId },
        ),
        parentOrderId: `canonical-lifecycle-fixture/${objectId}`,
        parentFence: 0,
      },
    });
  }

  return {
    rootPath,
    registry,
    stateStore,
    engine,
    authority,
    schemaValidator,
    commandFor,
    seed,
    reopen,
    load: (machineId, objectId, options = {}) =>
      stateStore.load(machineId, objectId, options),
    cleanup: () => rm(rootPath, { recursive: true, force: true }),
  };
}
