import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { ValidationError } from "../../source/executables/engine/errors.mjs";
import { hashCanonical } from "../../source/executables/engine/hash.mjs";
import { validateJsonSchema } from "../../source/executables/engine/schema-validator.mjs";
import {
  generateSchemas,
} from "../../source/executables/compiler/lib/schemas.mjs";
import {
  assertStoppingExecutionPlan,
  createStoppingExecutionPlan,
  STOPPING_EXECUTION_CAPABILITIES,
} from "../../source/executables/orchestrator/stopping-execution.mjs";

function generatedSchemaValidator() {
  const catalog = JSON.parse(
    readFileSync(
      new URL(
        "../../source/manifests/schema-catalog.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const lifecycleManifest = JSON.parse(
    readFileSync(
      new URL(
        "../../source/manifests/lifecycles.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const schemas = generateSchemas(catalog, { lifecycleManifest });
  return {
    assert(identifier, value) {
      const filename = identifier.endsWith(".schema.json")
        ? identifier
        : `${identifier}.schema.json`;
      const schema = schemas.get(`schemas/${filename}`);
      if (!schema) {
        throw new ValidationError("Unknown generated schema", {
          identifier,
        });
      }
      const result = validateJsonSchema(value, schema);
      if (!result.valid) {
        throw new ValidationError(
          "Value does not satisfy its generated schema",
          { identifier, errors: result.errors },
        );
      }
      return value;
    },
  };
}

function fixedRule(assignmentsPerCell = 2) {
  return {
    schemaVersion: "1.0.0",
    hashProfileId: "survey-evaluator-sha256-jcs-v1",
    ruleId: "fixed-completion",
    ruleClass: "fixed_sample",
    sampleUnit: "scenario_stratum_arm_cell",
    minimumAssignmentsPerCell: assignmentsPerCell,
    maximumAssignmentsPerCell: assignmentsPerCell,
    completionRule: "all_assigned_terminal",
    outcomeResponsiveStoppingPermitted: false,
  };
}

function sequentialRule(inspectionSchedule = [3]) {
  return {
    schemaVersion: "1.0.0",
    hashProfileId: "survey-evaluator-sha256-jcs-v1",
    ruleId: "sequential-terminal-only",
    ruleClass: "valid_sequential",
    sampleUnit: "scenario_stratum_arm_cell",
    minimumAssignmentsPerCell: 1,
    maximumAssignmentsPerCell: 3,
    inspectionSchedule,
    repeatedInspectionMethodId: "registered-confidence-sequence",
    decisionPolicyDigest: "a".repeat(64),
    outcomeResponsiveStoppingPermitted: true,
  };
}

test("stopping execution admits only fixed completion and terminal-only sequential completion without implying repeated-look efficacy", () => {
  const schemaValidator = generatedSchemaValidator();

  const fixed = fixedRule();
  const fixedPlan = createStoppingExecutionPlan({
    stoppingRule: fixed,
    schemaValidator,
  });
  assert.equal(fixedPlan.executionClass, "fixed_completion");
  assert.equal(fixedPlan.inferenceClass, "fixed_sample");
  assert.equal(fixedPlan.maximumAssignmentsPerCell, 2);
  assert.deepEqual(fixedPlan.interimOutcomeLookOrdinals, []);
  assert.equal(fixedPlan.interimOutcomeLookCount, 0);
  assert.equal(fixedPlan.outcomeResponsiveEarlyStoppingExecuted, false);
  assert.equal(fixedPlan.repeatedInspectionMethodExecuted, false);
  assert.equal(Object.isFrozen(fixedPlan), true);
  assert.equal(Object.isFrozen(fixedPlan.interimOutcomeLookOrdinals), true);

  const sequential = sequentialRule();
  const sequentialPlan = createStoppingExecutionPlan({
    stoppingRule: sequential,
    schemaValidator,
  });
  assert.equal(
    sequentialPlan.executionClass,
    "sequential_max_completion",
  );
  assert.equal(
    sequentialPlan.inferenceClass,
    "maximum_sample_nonsequential_only",
  );
  assert.equal(sequentialPlan.maximumAssignmentsPerCell, 3);
  assert.deepEqual(sequentialPlan.declaredInspectionSchedule, [3]);
  assert.deepEqual(sequentialPlan.interimOutcomeLookOrdinals, []);
  assert.equal(sequentialPlan.interimOutcomeLookCount, 0);
  assert.equal(sequentialPlan.repeatedInspectionMethodExecuted, false);
  assert.equal(sequentialPlan.sequentialEfficacyClaimSupported, false);
  assert.equal(
    sequentialPlan.stoppingRuleSemanticDigest,
    hashCanonical("campaign-stopping-rule/v1", sequential),
  );
  assert.deepEqual(
    createStoppingExecutionPlan({
      stoppingRule: sequential,
      schemaValidator,
    }),
    sequentialPlan,
  );
  assert.deepEqual(
    assertStoppingExecutionPlan({
      stoppingRule: sequential,
      stoppingExecutionPlan: sequentialPlan,
      schemaValidator,
    }),
    sequentialPlan,
  );

  const changedPlan = structuredClone(sequentialPlan);
  changedPlan.stoppingExecutionPlanDigest = "b".repeat(64);
  assert.throws(
    () =>
      assertStoppingExecutionPlan({
        stoppingRule: sequential,
        stoppingExecutionPlan: changedPlan,
        schemaValidator,
      }),
    /does not match the sealed stopping rule/u,
  );

  assert.throws(
    () =>
      createStoppingExecutionPlan({
        stoppingRule: sequentialRule([1, 3]),
        schemaValidator,
      }),
    /Interim or repeated outcome looks are unsupported/u,
  );
  assert.throws(
    () =>
      createStoppingExecutionPlan({
        stoppingRule: sequentialRule([1]),
        schemaValidator,
      }),
    /Interim or repeated outcome looks are unsupported/u,
  );
  assert.throws(
    () =>
      createStoppingExecutionPlan({
        stoppingRule: fixedRule(0),
        schemaValidator,
      }),
    /exact positive assignment count/u,
  );
  assert.throws(
    () =>
      createStoppingExecutionPlan({
        stoppingRule: {
          ...fixedRule(),
          optionalOutcomeLook: 1,
        },
        schemaValidator,
      }),
    /generated schema/u,
  );

  assert.deepEqual(STOPPING_EXECUTION_CAPABILITIES, {
    fixedCompletion: true,
    sequentialMaximumCompletion: true,
    interimOutcomeLooks: false,
    repeatedOutcomeLooks: false,
    outcomeResponsiveEarlyStopping: false,
    sequentialEfficacyClaims: false,
  });
});
