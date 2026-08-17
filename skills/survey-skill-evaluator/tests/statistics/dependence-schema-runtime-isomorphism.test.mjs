import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBytes } from "../../source/executables/engine/canonical-json.mjs";
import { validateJsonSchema } from "../../source/executables/engine/schema-validator.mjs";
import {
  ANALYTICAL_SCHEMA_CONTRACTS,
  normalizeDependencePlan,
} from "../../source/executables/statistics/index.mjs";
import { blockedObservations, clusteredPlan } from "./fixtures.mjs";

test("a schema-valid sealed dependence plan is consumed and returned without field translation", () => {
  const plan = clusteredPlan();
  const schemaResult = validateJsonSchema(
    plan,
    ANALYTICAL_SCHEMA_CONTRACTS["dependence-plan.schema.json"],
  );
  assert.equal(schemaResult.valid, true, JSON.stringify(schemaResult.errors));
  assert.deepEqual(
    canonicalBytes(normalizeDependencePlan(plan, blockedObservations)),
    canonicalBytes(plan),
  );
});
