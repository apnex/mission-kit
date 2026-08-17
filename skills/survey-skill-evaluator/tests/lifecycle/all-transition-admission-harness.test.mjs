import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  ConflictError,
  LifecycleEngine,
  LifecycleRegistry,
  RuntimeProductStateValidator,
  SchemaValidator,
  StateStore,
  hashCanonical,
  requiredCommandAuthorityIds,
} from "../../source/executables/engine/index.mjs";
import { createExternalAuthorityFixture } from "../helpers/external-authority-fixture.mjs";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

function commandFor(
  registry,
  authority,
  transition,
  objectId,
  expectedRevision,
) {
  const policy = registry.participantPolicy(
    transition.participantPolicyId,
  );
  const input = {
    harnessClass: "contract_level_admission_adapter",
    transitionId: transition.transitionId,
  };
  const command = {
    machineId: transition.machineId,
    objectId,
    transitionId: transition.transitionId,
    expectedRevision,
    participantPolicyId: transition.participantPolicyId,
    participantPolicyDigest: registry.participantPolicyDigest(
      transition.participantPolicyId,
    ),
    idempotencyKey: `contract-harness/${transition.transitionId}/${objectId}`,
    input,
    inputDigest: hashCanonical("contract-admission-input/v1", input),
    parentOrderId: "contract-harness:parent-order",
    parentFence: 0,
  };
  return authority.authorizeSync({
    policy,
    command,
    machineId: transition.machineId,
    participantPolicyDigest: command.participantPolicyDigest,
  });
}

test("all 267 canonical transitions admit their legal source, replay exactly, and reject an illegal source", async (t) => {
  const rootPath = await mkdtemp(join(tmpdir(), "lifecycle-admission-"));
  t.after(() => rm(rootPath, { recursive: true, force: true }));
  const registry = await LifecycleRegistry.fromFile(
    join(packageRoot, "source", "manifests", "lifecycles.json"),
  );
  const transitions = [...registry.transitions.values()];
  assert.equal(transitions.length, 267);
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
  for (const transition of transitions) {
    guards[transition.guardId] = () => ({
      pass: true,
      adapterClass: "contract_level_admission_only",
    });
    mutations[transition.mutationId] = ({ currentData }) => ({
      ...currentData,
      harnessAcceptedTransitionId: transition.transitionId,
    });
    for (const descriptor of registry.actionPipeline(
      transition.actionPipelineId,
    ).actions) {
      const actionId =
        typeof descriptor === "string" ? descriptor : descriptor.actionId;
      actions[actionId] = () => ({
        core: {
          adapterClass: "contract_level_admission_only",
          actionId,
        },
      });
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

  for (const [index, transition] of transitions.entries()) {
    const legalObjectId = `legal-${String(index).padStart(3, "0")}`;
    if (transition.creationClass !== "absent") {
      await engine.createParentStagedGenesis({
        machineId: transition.machineId,
        objectId: legalObjectId,
        initialState: transition.fromState,
        initialData: { harnessSeed: transition.transitionId },
        parentBinding: {
          parentMachineId: "contract-harness",
          parentObjectId: transition.transitionId,
          parentPriorAuthoritativeRoot: hashCanonical(
            "contract-harness-parent/v1",
            { transitionId: transition.transitionId, branch: "legal" },
          ),
          parentOrderId: `legal/${transition.transitionId}`,
          parentFence: 0,
        },
      });
    }
    const legalCommand = commandFor(
      registry,
      authority,
      transition,
      legalObjectId,
      transition.creationClass === "absent" ? "absent" : 0,
    );
    const accepted = await engine.execute(legalCommand);
    const replay = await engine.execute(legalCommand);
    assert.equal(accepted.state, transition.toState, transition.transitionId);
    assert.equal(replay.replayed, true, transition.transitionId);
    assert.equal(replay.eventRoot, accepted.eventRoot, transition.transitionId);
    const stored = await stateStore.load(
      transition.machineId,
      legalObjectId,
      { required: true },
    );
    assert.equal(
      stored.authoritativeStateCore.eventLedger.length,
      1,
      transition.transitionId,
    );

    const illegalObjectId = `illegal-${String(index).padStart(3, "0")}`;
    await engine.createParentStagedGenesis({
      machineId: transition.machineId,
      objectId: illegalObjectId,
      initialState:
        transition.creationClass === "absent"
          ? transition.fromState
          : "__CONTRACT_HARNESS_ILLEGAL_SOURCE__",
      initialData: { harnessSeed: transition.transitionId },
      parentBinding: {
        parentMachineId: "contract-harness",
        parentObjectId: transition.transitionId,
        parentPriorAuthoritativeRoot: hashCanonical(
          "contract-harness-parent/v1",
          { transitionId: transition.transitionId, branch: "illegal" },
        ),
        parentOrderId: `illegal/${transition.transitionId}`,
        parentFence: 0,
      },
    });
    await assert.rejects(
      engine.execute(
        commandFor(registry, authority, transition, illegalObjectId, 0),
      ),
      ConflictError,
      transition.transitionId,
    );
  }
});
