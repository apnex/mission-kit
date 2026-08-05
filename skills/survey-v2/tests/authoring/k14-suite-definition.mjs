function compareUtf8(left, right) {
  return Buffer.compare(
    Buffer.from(left, "utf8"),
    Buffer.from(right, "utf8"),
  );
}

function paths(...values) {
  if (new Set(values).size !== values.length) {
    throw new Error("K14 authority paths must be unique");
  }
  return Object.freeze([...values].sort(compareUtf8));
}

const executedAuthorities = paths(
  "package.json",
  "schemas/authoring/v1alpha1/authoring-assignment.schema.json",
  "schemas/authoring/v1alpha1/authoring-commit-receipt.schema.json",
  "schemas/authoring/v1alpha1/authoring-form-definition.schema.json",
  "schemas/authoring/v1alpha1/authoring-journal-record.schema.json",
  "schemas/authoring/v1alpha1/authoring-mutation.schema.json",
  "schemas/authoring/v1alpha1/authoring-profile-manifest.schema.json",
  "schemas/authoring/v1alpha1/authoring-protocol.schema.json",
  "schemas/authoring/v1alpha1/authoring-request.schema.json",
  "schemas/authoring/v1alpha1/authoring-submission.schema.json",
  "schemas/authoring/v1alpha1/authoring-workspace-effect.schema.json",
  "schemas/authoring/v1alpha1/authoring-workspace.schema.json",
  "schemas/authoring/v1alpha1/common.schema.json",
  "schemas/authoring/v1alpha1/context-closure.schema.json",
  "schemas/authoring/v1alpha1/projection-artifact.schema.json",
  "schemas/authoring/v1alpha1/resource-reference.schema.json",
  "schemas/authoring/v1alpha1/source-snapshot.schema.json",
  "schemas/authoring/v1alpha1/validation-issue.schema.json",
  "source/authoring/adapters/in-memory-store.mjs",
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
  "source/authoring/runtime/commit-records.mjs",
  "source/authoring/runtime/journal-replay.mjs",
  "source/authoring/runtime/store-port.mjs",
  "source/authoring/runtime/transaction-coordinator.mjs",
  "source/authoring/runtime/transaction-resources.mjs",
  "source/authoring/runtime/workspace-application.mjs",
  "tests/fixtures/authoring/non-survey-brief/brief-profile.mjs",
  "tests/fixtures/authoring/non-survey-brief/profile-executables.mjs",
);

const fixtureClosure = paths(
  "tests/authoring/contracts/support/contract-validation.mjs",
  "tests/authoring/non-survey-brief/support.mjs",
  "tests/fixtures/authoring/non-survey-brief/brief-resource.schema.json",
);

const applicability = Object.freeze({
  static: Object.freeze({
    mode: "not-applicable",
    transports: Object.freeze([]),
    adapters: Object.freeze([]),
  }),
  inMemory: Object.freeze({
    mode: "specific",
    transports: Object.freeze([]),
    adapters: Object.freeze([
      "urn:mission-kit:survey-v2:adapter:in-memory",
    ]),
  }),
});

function define(
  executable,
  invariantId,
  obligationId,
  evidenceClass,
  selectedApplicability = applicability.inMemory,
) {
  if (obligationId.split("-")[1] !== invariantId) {
    throw new Error(
      `${obligationId} does not belong to ${invariantId}`,
    );
  }
  return Object.freeze({
    executable,
    invariantId,
    obligationId,
    evidenceClass,
    applicability: selectedApplicability,
    authorities: executedAuthorities,
    fixtures: fixtureClosure,
  });
}

export const k14Suite = Object.freeze([
  define(
    "tests/authoring/non-survey-brief/kernel-import-closure.test.mjs",
    "AS01",
    "O-AS01-06",
    "conformance",
    applicability.static,
  ),
  define(
    "tests/authoring/non-survey-brief/two-transition-text-flow.test.mjs",
    "AS02",
    "O-AS02-14",
    "positive",
  ),
  define(
    "tests/authoring/non-survey-brief/ordered-context-roles.test.mjs",
    "AS06",
    "O-AS06-68",
    "conformance",
  ),
  define(
    "tests/authoring/non-survey-brief/missing-context-role.test.mjs",
    "AS06",
    "O-AS06-69",
    "negative",
  ),
  define(
    "tests/authoring/non-survey-brief/journal-replay.test.mjs",
    "AS15",
    "O-AS15-57",
    "conformance",
  ),
]);
