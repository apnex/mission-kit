import assert from "node:assert/strict";
import test from "node:test";
import { join } from "node:path";
import {
  LifecycleRegistry,
  RuntimeProductStateValidator,
  SchemaValidator,
  ValidationError,
} from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/package-root.mjs";

test("every lifecycle machine has one explicit generated product-state schema selection", async () => {
  const registry = await LifecycleRegistry.fromFile(
    join(packageRoot, "source/manifests/lifecycles.json"),
  );
  const schemaValidator = await SchemaValidator.fromPackageRoot(packageRoot);
  const validator = new RuntimeProductStateValidator({
    schemaValidator,
    registry,
  });
  assert.equal(Object.keys(validator.schemaByMachine).length, 17);
  assert.deepEqual(validator.schemaByMachine.campaign, {
    schemaId: "campaign-state",
    idField: "campaignId",
  });
  assert.deepEqual(validator.schemaByMachine["diagnostic-debate"], {
    schemaId: "diagnostic-debate-state",
    idField: "diagnosticDebateId",
  });
  assert.equal(
    Object.values(validator.schemaByMachine).filter(
      (entry) => entry.schemaId === "product-state",
    ).length,
    2,
  );

  const incomplete = Object.fromEntries(
    [...registry.machines.keys()]
      .slice(1)
      .map((machineId) => [machineId, "product-state"]),
  );
  assert.throws(
    () =>
      new RuntimeProductStateValidator({
        schemaValidator,
        registry,
        schemaByMachine: incomplete,
      }),
    ValidationError,
  );
  assert.throws(
    () =>
      new RuntimeProductStateValidator({
        schemaValidator,
        registry,
        schemaByMachine: {
          ...Object.fromEntries(
            Object.entries(validator.schemaByMachine).map(
              ([machineId, descriptor]) => [
                machineId,
                {
                  schemaId: descriptor.schemaId,
                  idField: descriptor.idField,
                },
              ],
            ),
          ),
          campaign: "not-a-generated-schema",
        },
      }),
    ValidationError,
  );
});
