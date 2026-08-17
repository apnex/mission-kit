import {
  canonicalBytes,
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import {
  HASH_PROFILE_ID,
  hashCanonical,
} from "../engine/hash.mjs";
import {
  IntegrityError,
  ValidationError,
} from "../engine/errors.mjs";

const SCHEMA_VERSION = "1.0.0";
const STOPPING_RULE_HASH_DOMAIN = "campaign-stopping-rule/v1";
const STOPPING_EXECUTION_ID_HASH_DOMAIN =
  "stopping-execution-plan-id/v1";
const STOPPING_EXECUTION_HASH_DOMAIN = "stopping-execution-plan/v1";

function assertSchemaValidator(schemaValidator) {
  if (!schemaValidator || typeof schemaValidator.assert !== "function") {
    throw new ValidationError(
      "Stopping execution admission requires the evaluator schema validator",
    );
  }
}

function planCore(stoppingRule, executionClass, inferenceClass) {
  return {
    schemaVersion: SCHEMA_VERSION,
    hashProfileId: HASH_PROFILE_ID,
    stoppingExecutionPlanId: `stopping-execution:${hashCanonical(
      STOPPING_EXECUTION_ID_HASH_DOMAIN,
      stoppingRule,
    )}`,
    stoppingRuleId: stoppingRule.ruleId,
    stoppingRuleSemanticDigest: hashCanonical(
      STOPPING_RULE_HASH_DOMAIN,
      stoppingRule,
    ),
    ruleClass: stoppingRule.ruleClass,
    executionClass,
    inferenceClass,
    sampleUnit: stoppingRule.sampleUnit,
    minimumAssignmentsPerCell: stoppingRule.minimumAssignmentsPerCell,
    maximumAssignmentsPerCell: stoppingRule.maximumAssignmentsPerCell,
    assignmentActivationClass: "all_through_maximum_precommitted",
    completionRule: "all_assigned_terminal_at_maximum",
    interimOutcomeLookOrdinals: [],
    interimOutcomeLookCount: 0,
    outcomeResponsiveEarlyStoppingExecuted: false,
    repeatedInspectionMethodExecuted: false,
    terminalOutcomeAnalysisClass: "post_completion_only",
    immutable: true,
  };
}

function fixedCompletionPlan(stoppingRule) {
  if (
    stoppingRule.minimumAssignmentsPerCell < 1 ||
    stoppingRule.minimumAssignmentsPerCell !==
      stoppingRule.maximumAssignmentsPerCell
  ) {
    throw new ValidationError(
      "Fixed-completion execution requires one exact positive assignment count",
      {
        minimumAssignmentsPerCell:
          stoppingRule.minimumAssignmentsPerCell,
        maximumAssignmentsPerCell:
          stoppingRule.maximumAssignmentsPerCell,
      },
    );
  }
  return planCore(
    stoppingRule,
    "fixed_completion",
    "fixed_sample",
  );
}

function sequentialMaximumPlan(stoppingRule) {
  if (
    stoppingRule.minimumAssignmentsPerCell < 1 ||
    stoppingRule.minimumAssignmentsPerCell >
      stoppingRule.maximumAssignmentsPerCell
  ) {
    throw new ValidationError(
      "Sequential maximum-completion execution has an invalid assignment range",
      {
        minimumAssignmentsPerCell:
          stoppingRule.minimumAssignmentsPerCell,
        maximumAssignmentsPerCell:
          stoppingRule.maximumAssignmentsPerCell,
      },
    );
  }
  const schedule = stoppingRule.inspectionSchedule;
  if (
    schedule.length !== 1 ||
    schedule[0] !== stoppingRule.maximumAssignmentsPerCell
  ) {
    throw new ValidationError(
      "Interim or repeated outcome looks are unsupported; sequential execution requires exactly one terminal look at the maximum",
      {
        inspectionSchedule: deepCloneCanonical(schedule),
        maximumAssignmentsPerCell:
          stoppingRule.maximumAssignmentsPerCell,
      },
    );
  }
  return {
    ...planCore(
      stoppingRule,
      "sequential_max_completion",
      "maximum_sample_nonsequential_only",
    ),
    declaredInspectionSchedule: deepCloneCanonical(schedule),
    declaredRepeatedInspectionMethodId:
      stoppingRule.repeatedInspectionMethodId,
    declaredDecisionPolicyDigest: stoppingRule.decisionPolicyDigest,
    declaredOutcomeResponsiveStoppingPermitted:
      stoppingRule.outcomeResponsiveStoppingPermitted,
    sequentialEfficacyClaimSupported: false,
  };
}

function sealPlan(core) {
  return {
    ...core,
    stoppingExecutionPlanDigest: hashCanonical(
      STOPPING_EXECUTION_HASH_DOMAIN,
      core,
    ),
  };
}

export function createStoppingExecutionPlan({
  stoppingRule: unsafeStoppingRule,
  schemaValidator,
}) {
  assertSchemaValidator(schemaValidator);
  const stoppingRule = deepCloneCanonical(unsafeStoppingRule);
  schemaValidator.assert("stopping-rule", stoppingRule);

  let core;
  if (stoppingRule.ruleClass === "fixed_sample") {
    core = fixedCompletionPlan(stoppingRule);
  } else if (stoppingRule.ruleClass === "valid_sequential") {
    core = sequentialMaximumPlan(stoppingRule);
  } else {
    throw new ValidationError(
      "Stopping rule class has no executable campaign implementation",
      { ruleClass: stoppingRule.ruleClass },
    );
  }

  const plan = sealPlan(core);
  schemaValidator.assert("stopping-execution-plan", plan);
  return deepFreeze(deepCloneCanonical(plan));
}

export function assertStoppingExecutionPlan({
  stoppingRule,
  stoppingExecutionPlan: unsafeStoppingExecutionPlan,
  schemaValidator,
}) {
  assertSchemaValidator(schemaValidator);
  const observed = deepCloneCanonical(unsafeStoppingExecutionPlan);
  schemaValidator.assert("stopping-execution-plan", observed);
  const expected = createStoppingExecutionPlan({
    stoppingRule,
    schemaValidator,
  });
  if (canonicalBytes(observed).compare(canonicalBytes(expected)) !== 0) {
    throw new IntegrityError(
      "Stopping execution plan does not match the sealed stopping rule",
      {
        expectedDigest: expected.stoppingExecutionPlanDigest,
        observedDigest: observed.stoppingExecutionPlanDigest,
      },
    );
  }
  return expected;
}

export const STOPPING_EXECUTION_CAPABILITIES = deepFreeze({
  fixedCompletion: true,
  sequentialMaximumCompletion: true,
  interimOutcomeLooks: false,
  repeatedOutcomeLooks: false,
  outcomeResponsiveEarlyStopping: false,
  sequentialEfficacyClaims: false,
});
