import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HASH_PROFILE_ID,
  LifecycleRegistry,
  RuntimeProductStateValidator,
  SchemaValidator,
  StateStore,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import { LearningProtocol } from "../../source/executables/orchestrator/index.mjs";

const packageRoot = join(dirname(fileURLToPath(import.meta.url)), "../..");

export async function makeDbf00Fixture() {
  const rootPath = await mkdtemp(join(tmpdir(), "survey-dbf00-"));
  const schemaValidator = await SchemaValidator.fromPackageRoot(packageRoot);
  const registry = await LifecycleRegistry.fromFile(
    join(packageRoot, "source/manifests/lifecycles.json"),
  );
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
  return {
    learning: new LearningProtocol({
      schemaValidator,
      stateStore,
    }),
    stateStore,
    cleanup: () => rm(rootPath, { recursive: true, force: true }),
  };
}

export function rootedBrokerClaim(overrides = {}) {
  const core = {
    hashProfileId: HASH_PROFILE_ID,
    claimId: "claim-1",
    messageDigest: "a".repeat(64),
    targetId: "lr-1",
    operationId: "db-1",
    fence: 1,
    source: {},
    state: "fenced_before_delivery",
    createdAtMs: 1,
    deliveryReceipt: null,
    postDeliveryFence: null,
    drainReceipt: null,
    fenceEvidence: { reason: "capacity" },
    fencedAtMs: 2,
    ...overrides,
  };
  for (const key of Object.keys(core)) {
    if (core[key] === undefined) delete core[key];
  }
  return {
    ...core,
    claimRoot: hashCanonical("broker-delivery-claim/v1", core),
  };
}
