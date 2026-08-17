import test from "node:test";
import assert from "node:assert/strict";
import { lintSchema } from "../../source/executables/shared/schema-validator.mjs";
import { ANALYTICAL_SCHEMA_CONTRACTS } from "../../source/executables/statistics/index.mjs";

const EXPECTED = [
  "agreement-report.schema.json",
  "analysis-plan.schema.json",
  "analysis-result.schema.json",
  "calibration-corpus.schema.json",
  "control-delta-audit.schema.json",
  "dependence-plan.schema.json",
  "family-allocation-record.schema.json",
  "metric-descriptor.schema.json",
  "qualification-overlay.schema.json",
  "recommendation.schema.json",
  "review-aggregation.schema.json",
  "reviewer-allocation-plan.schema.json",
  "reviewer-capacity-disposition.schema.json",
  "reviewer-capacity-request.schema.json",
  "rubric.schema.json",
];

function assertRecursivelyClosed(node, path = "$") {
  if (!node || typeof node !== "object") return;
  if (node.type === "object") {
    assert.equal(
      node.additionalProperties,
      false,
      `${path} is not a closed object`,
    );
  }
  if (Array.isArray(node)) {
    node.forEach((child, index) =>
      assertRecursivelyClosed(child, `${path}[${index}]`),
    );
  } else {
    Object.entries(node).forEach(([key, child]) =>
      assertRecursivelyClosed(child, `${path}.${key}`),
    );
  }
}

test("analytical contract map contains exactly fifteen immutable, lint-clean, recursively closed schemas", () => {
  assert.deepEqual(Object.keys(ANALYTICAL_SCHEMA_CONTRACTS).sort(), EXPECTED);
  assert.equal(Object.isFrozen(ANALYTICAL_SCHEMA_CONTRACTS), true);
  for (const [filename, schema] of Object.entries(
    ANALYTICAL_SCHEMA_CONTRACTS,
  )) {
    lintSchema(schema, filename);
    assertRecursivelyClosed(schema);
    assert.equal(Object.isFrozen(schema), true);
    assert.equal(
      schema.$id,
      `urn:mission-kit:survey-skill-evaluator:${filename.replace(
        /\.schema\.json$/u,
        "",
      )}`,
    );
  }
});
