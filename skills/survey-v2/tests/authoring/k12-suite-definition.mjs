function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function paths(...values) {
  if (new Set(values).size !== values.length) {
    throw new Error("K12 authority and fixture paths must be unique");
  }
  return Object.freeze([...values].sort(compareUtf8));
}

const contextAuthorities = paths(
  "schemas/authoring/v1alpha1/common.schema.json",
  "schemas/authoring/v1alpha1/context-closure.schema.json",
  "source/authoring/kernel/canonical.mjs",
  "source/authoring/kernel/context-resolver.mjs",
  "source/authoring/kernel/contract-semantics.mjs",
  "source/authoring/kernel/digests.mjs",
  "source/authoring/kernel/resource-resolution.mjs",
);

const mutationAuthorities = paths(
  "schemas/authoring/v1alpha1/authoring-mutation.schema.json",
  "schemas/authoring/v1alpha1/authoring-profile-manifest.schema.json",
  "schemas/authoring/v1alpha1/authoring-protocol.schema.json",
  "schemas/authoring/v1alpha1/authoring-workspace.schema.json",
  "schemas/authoring/v1alpha1/common.schema.json",
  "source/authoring/kernel/canonical.mjs",
  "source/authoring/kernel/contract-semantics.mjs",
  "source/authoring/kernel/digests.mjs",
  "source/authoring/kernel/manifest-selection.mjs",
  "source/authoring/kernel/mutation-planner.mjs",
);

const reducerAuthorities = paths(
  "schemas/authoring/v1alpha1/authoring-assignment.schema.json",
  "schemas/authoring/v1alpha1/authoring-mutation.schema.json",
  "schemas/authoring/v1alpha1/authoring-profile-manifest.schema.json",
  "schemas/authoring/v1alpha1/authoring-protocol.schema.json",
  "schemas/authoring/v1alpha1/authoring-request.schema.json",
  "schemas/authoring/v1alpha1/authoring-submission.schema.json",
  "schemas/authoring/v1alpha1/authoring-workspace.schema.json",
  "schemas/authoring/v1alpha1/common.schema.json",
  "schemas/authoring/v1alpha1/context-closure.schema.json",
  "schemas/authoring/v1alpha1/validation-issue.schema.json",
  "source/authoring/kernel/assignment-dag.mjs",
  "source/authoring/kernel/canonical.mjs",
  "source/authoring/kernel/context-resolver.mjs",
  "source/authoring/kernel/contract-semantics.mjs",
  "source/authoring/kernel/digests.mjs",
  "source/authoring/kernel/executable-registry.mjs",
  "source/authoring/kernel/manifest-reducer.mjs",
  "source/authoring/kernel/manifest-selection.mjs",
  "source/authoring/kernel/mutation-planner.mjs",
  "source/authoring/kernel/reducer-results.mjs",
  "source/authoring/kernel/request-planner.mjs",
  "source/authoring/kernel/resource-resolution.mjs",
  "source/authoring/kernel/text-forms.mjs",
);

const contextFixtures = paths(
  "tests/authoring/context-resolution/support.mjs",
  "tests/authoring/contracts/support/contract-validation.mjs",
  "tests/fixtures/authoring/contracts/positive/authoring-profile-manifest.json",
  "tests/fixtures/authoring/contracts/positive/authoring-protocol.json",
  "tests/fixtures/authoring/contracts/positive/authoring-workspace.json",
);

const mutationFixtures = paths(
  "tests/authoring/contracts/support/contract-validation.mjs",
  "tests/authoring/contracts/support/transaction-scenarios.mjs",
  "tests/authoring/mutation-planning/support.mjs",
  "tests/fixtures/authoring/contracts/positive/authoring-mutation.json",
  "tests/fixtures/authoring/contracts/positive/authoring-profile-manifest.json",
  "tests/fixtures/authoring/contracts/positive/authoring-protocol.json",
  "tests/fixtures/authoring/contracts/positive/authoring-workspace.json",
);

const reducerFixtures = paths(
  "tests/authoring/contracts/support/contract-validation.mjs",
  "tests/authoring/reducer/support.mjs",
  "tests/fixtures/authoring/contracts/positive/authoring-assignment.json",
  "tests/fixtures/authoring/contracts/positive/authoring-form-definition.json",
  "tests/fixtures/authoring/contracts/positive/authoring-mutation.json",
  "tests/fixtures/authoring/contracts/positive/authoring-profile-manifest.json",
  "tests/fixtures/authoring/contracts/positive/authoring-protocol.json",
  "tests/fixtures/authoring/contracts/positive/authoring-submission.json",
  "tests/fixtures/authoring/contracts/positive/authoring-workspace.json",
  "tests/fixtures/authoring/contracts/positive/revision-form-definition.json",
  "tests/fixtures/authoring/contracts/positive/runtime-protocol.json",
);

function define(directory, name, invariantId, obligationId, evidenceClass) {
  const surfaces = {
    "context-resolution": {
      authorities: contextAuthorities,
      fixtures: contextFixtures,
    },
    "mutation-planning": {
      authorities: mutationAuthorities,
      fixtures: mutationFixtures,
    },
    reducer: {
      authorities: reducerAuthorities,
      fixtures: reducerFixtures,
    },
  };
  if (obligationId.split("-")[1] !== invariantId) {
    throw new Error(`${obligationId} does not belong to ${invariantId}`);
  }
  return Object.freeze({
    obligationId,
    invariantId,
    evidenceClass,
    executable: `tests/authoring/${directory}/${name}.test.mjs`,
    ...surfaces[directory],
  });
}

const contextNames = Object.freeze([
  "active-head-closure",
  "active-head-duplicate-negative",
  "ambient-key-utf8-order",
  "bounded-scale-determinism",
  "duplicate-role-reference-negative",
  "duplicate-stored-version-negative",
  "e2e-k10-valid",
  "exact-stored-version",
  "inventory-order-determinism",
  "invocation-context-injection-negative",
  "json-pointer-array-index-negative",
  "json-pointer-escape-negative",
  "json-pointer-own-property-negative",
  "json-pointer-positive",
  "lifecycle-mismatch-negative",
  "lifecycle-pointer-positive",
  "optional-compact-ordinal",
  "projection-order",
  "projection-pointer-missing-negative",
  "request-reference-selection",
  "required-zero-cardinality-negative",
  "selector-ambient-negative",
  "selector-order-negative",
  "selector-type-negative",
  "stored-integrity-negative",
  "stored-semantic-negative",
  "two-layer-order-role",
]);

const contextNegative = new Set([
  "active-head-duplicate-negative",
  "duplicate-role-reference-negative",
  "duplicate-stored-version-negative",
  "invocation-context-injection-negative",
  "json-pointer-array-index-negative",
  "json-pointer-escape-negative",
  "json-pointer-own-property-negative",
  "lifecycle-mismatch-negative",
  "projection-pointer-missing-negative",
  "required-zero-cardinality-negative",
  "selector-ambient-negative",
  "selector-order-negative",
  "selector-type-negative",
  "stored-integrity-negative",
  "stored-semantic-negative",
]);

const mutationCases = Object.freeze([
  ["async-contract-validator", "AS14", "O-AS14-26", "negative"],
  ["candidate-order", "AS13", "O-AS13-12", "negative"],
  ["cardinality", "AS13", "O-AS13-13", "negative"],
  ["coupling-widening", "AS15", "O-AS15-21", "negative"],
  ["created-slot-dependency", "AS13", "O-AS13-14", "conformance"],
  ["dependency-relation", "AS13", "O-AS13-15", "negative"],
  ["dependency-selector", "AS13", "O-AS13-16", "negative"],
  ["duplicate-candidate", "AS13", "O-AS13-17", "negative"],
  ["event-mutation", "AS02", "O-AS02-03", "conformance"],
  ["exact-mutation", "AS13", "O-AS13-18", "conformance"],
  ["forbidden-handler-output", "AS13", "O-AS13-19", "negative"],
  ["head-ambiguity", "AS13", "O-AS13-20", "negative"],
  ["partial-revision-group", "AS11", "O-AS11-12", "negative"],
  ["revision-descendants", "AS11", "O-AS11-13", "conformance"],
  ["wrong-kind", "AS13", "O-AS13-21", "negative"],
  ["wrong-slot", "AS13", "O-AS13-22", "negative"],
]);

const reducerCases = Object.freeze([
  ["callback-error-redaction", "AS14", "O-AS14-36", "negative"],
  ["domain-issue-contract", "AS14", "O-AS14-27", "negative"],
  ["event-command-base-freshness", "AS02", "O-AS02-08", "negative"],
  ["event-guard-configuration-authority", "AS02", "O-AS02-09", "conformance"],
  ["event-reduction", "AS02", "O-AS02-04", "conformance"],
  ["event-selection-missing", "AS02", "O-AS02-12", "negative"],
  ["forged-transition-guard-authority", "AS02", "O-AS02-05", "negative"],
  ["guard-blocks-dispatch", "AS02", "O-AS02-06", "negative"],
  ["host-native-async-contract-validator", "AS14", "O-AS14-37", "negative"],
  ["host-promise-contract-validator", "AS14", "O-AS14-38", "negative"],
  ["identity-before-freshness", "AS14", "O-AS14-47", "negative"],
  ["inventory-snapshot-immutability", "AS04", "O-AS04-11", "conformance"],
  ["json-pointer-compatibility", "AS14", "O-AS14-28", "conformance"],
  ["manifest-bounded-mutation", "AS13", "O-AS13-23", "conformance"],
  ["manifest-transition-authority", "AS02", "O-AS02-07", "conformance"],
  ["multi-kind-product-validation", "AS13", "O-AS13-24", "conformance"],
  ["multi-kind-revision-submission", "AS11", "O-AS11-16", "conformance"],
  ["mutation-native-async-contract-validator", "AS14", "O-AS14-39", "negative"],
  ["mutation-promise-contract-validator", "AS14", "O-AS14-40", "negative"],
  ["mutation-result-next-state-validation", "AS13", "O-AS13-25", "negative"],
  ["native-async-executable", "AS14", "O-AS14-41", "negative"],
  ["next-ambiguous", "AS04", "O-AS04-06", "negative"],
  ["next-determinism", "AS04", "O-AS04-07", "conformance"],
  ["next-exactly-one", "AS04", "O-AS04-08", "conformance"],
  ["next-no-task", "AS04", "O-AS04-09", "conformance"],
  ["ordered-guard-short-circuit", "AS02", "O-AS02-13", "conformance"],
  ["product-shape-before-validator", "AS13", "O-AS13-26", "negative"],
  ["producer-evidence-callback-isolation", "AS10", "O-AS10-08", "conformance"],
  ["profile-executable-preflight", "AS14", "O-AS14-42", "negative"],
  ["profile-self-authorization", "AS14", "O-AS14-29", "negative"],
  ["promise-returning-executable", "AS14", "O-AS14-43", "negative"],
  ["reducer-result-validation", "AS14", "O-AS14-30", "negative"],
  ["registry-opaque-capability", "AS14", "O-AS14-31", "negative"],
  ["request-context-authority", "AS07", "O-AS07-31", "negative"],
  ["request-revision-authority", "AS11", "O-AS11-14", "negative"],
  ["request-task-authority", "AS07", "O-AS07-32", "negative"],
  ["revise-guard-configuration-authority", "AS02", "O-AS02-10", "conformance"],
  ["revision-request", "AS11", "O-AS11-15", "conformance"],
  ["storage-independence", "AS01", "O-AS01-03", "conformance"],
  ["submission-dag-preflight", "AS07", "O-AS07-33", "negative"],
  ["submit-guard-configuration-authority", "AS02", "O-AS02-11", "conformance"],
  ["task-result-context-layer-validation", "AS06", "O-AS06-67", "negative"],
  ["trusted-guard-dispatch", "AS14", "O-AS14-32", "conformance"],
  ["trusted-handler-dispatch", "AS14", "O-AS14-33", "negative"],
  ["trusted-kernel-identity", "AS14", "O-AS14-44", "negative"],
  ["trusted-schema-dispatch", "AS14", "O-AS14-34", "negative"],
  ["trusted-surface-accessor-rejection", "AS14", "O-AS14-45", "negative"],
  ["trusted-surface-proxy-rejection", "AS14", "O-AS14-46", "negative"],
  ["trusted-validator-dispatch", "AS14", "O-AS14-35", "negative"],
  ["validation-issue-ordering", "AS04", "O-AS04-10", "conformance"],
  ["workspace-evidence-callback-isolation", "AS10", "O-AS10-09", "conformance"],
]);

export const k12Suite = Object.freeze([
  ...contextNames.map((name, index) =>
    define(
      "context-resolution",
      name,
      "AS06",
      `O-AS06-${String(40 + index).padStart(2, "0")}`,
      contextNegative.has(name)
        ? "negative"
        : (
          ["active-head-closure", "e2e-k10-valid"].includes(name)
            ? "positive"
            : "conformance"
        ),
    )),
  ...mutationCases.map((entry) =>
    define("mutation-planning", ...entry)),
  ...reducerCases.map((entry) =>
    define("reducer", ...entry)),
]);
