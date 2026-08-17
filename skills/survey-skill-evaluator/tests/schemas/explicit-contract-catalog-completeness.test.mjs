import assert from "node:assert/strict";
import test from "node:test";
import {
  EXPLICIT_SCHEMA_CONTRACT_NAMES,
  generateSchemas,
  validateSchemaCatalog,
} from "../../source/executables/compiler/lib/schemas.mjs";
import {
  DECLARATIVE_SCHEMA_NAMES,
  SOVEREIGN_SCHEMA_FACTORIES,
} from "../../source/executables/compiler/lib/schema-contracts/catalog.mjs";
import { lifecycleStates } from "../../source/executables/compiler/lib/schema-contracts/primitives.mjs";
import { generatedContractFixtureSet } from "./schema-contract-fixtures.mjs";

test("the 141-name catalog has one explicit contract per name and no generic fallback", () => {
  const { catalog, lifecycleManifest, generated } =
    generatedContractFixtureSet();
  assert.equal(generated.size, 141);
  assert.equal(EXPLICIT_SCHEMA_CONTRACT_NAMES.length, 141);
  assert.equal(DECLARATIVE_SCHEMA_NAMES.length, 110);
  assert.equal(Object.keys(SOVEREIGN_SCHEMA_FACTORIES).length, 95);
  assert.deepEqual(
    [...catalog.schemas].sort(),
    [...EXPLICIT_SCHEMA_CONTRACT_NAMES],
  );
  for (const [pathname, schema] of generated) {
    assert.equal(schema.additionalProperties, false, pathname);
    assert.equal(
      Boolean(schema.properties?.status && schema.properties?.sourceRefs),
      false,
      `${pathname} retains the generic ID/status/sourceRefs fallback`,
    );
  }

  const unknownCatalog = structuredClone(catalog);
  unknownCatalog.schemas[0] = "unknown-contract.schema.json";
  assert.throws(
    () => validateSchemaCatalog(unknownCatalog),
    /explicit contract registry|no explicit contract/u,
  );
  assert.throws(
    () => generateSchemas(catalog),
    /requires lifecycle machine/u,
  );
  assert.equal(
    generateSchemas(catalog, { lifecycleManifest }).size,
    catalog.schemas.length,
  );

  const stateOwners = new Map([
    ["scenario-state.schema.json", "scenario-authoring-entry"],
    ["scenario-bank-state.schema.json", "scenario-cohort-use"],
    [
      "evaluation-decision-lineage-state.schema.json",
      "evaluation-decision-lineage",
    ],
    ["confirmatory-family-state.schema.json", "confirmatory-family"],
    ["assurance-state.schema.json", "evaluator-assurance"],
    ["reviewer-capacity-state.schema.json", "reviewer-capacity-global"],
    ["campaign-state.schema.json", "campaign"],
    ["assignment-state.schema.json", "assignment"],
    ["review-state.schema.json", "review-slot"],
    ["run-state.schema.json", "attempt"],
    ["awareness-state.schema.json", "awareness"],
    ["learning-state.schema.json", "learning-record"],
    ["diagnostic-debate-state.schema.json", "diagnostic-debate"],
    ["learning-capital-state.schema.json", "learning-capital"],
    [
      "learning-capital-request-state.schema.json",
      "learning-capital-request",
    ],
  ]);
  for (const [filename, machineId] of stateOwners) {
    const schema = generated.get(`schemas/${filename}`);
    assert.deepEqual(
      schema.properties.state.enum,
      lifecycleStates(lifecycleManifest, machineId),
      `${filename} duplicates or drifts from ${machineId}`,
    );
  }
  assert.deepEqual(
    generated.get("schemas/reviewer-capacity-state.schema.json").properties
      .reservations.items.properties.entryState.enum,
    lifecycleStates(lifecycleManifest, "reviewer-capacity-entry"),
  );
  for (const schema of generated.values()) {
    const encoded = JSON.stringify(schema);
    assert.equal(encoded.includes('"same"'), false);
    assert.equal(encoded.includes('"[*]"'), false);
  }
});
