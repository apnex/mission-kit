function compareUtf8(left, right) {
  return Buffer.compare(
    Buffer.from(left, "utf8"),
    Buffer.from(right, "utf8"),
  );
}

function paths(...values) {
  if (new Set(values).size !== values.length) {
    throw new Error("S11 authority paths must be unique");
  }
  return Object.freeze([...values].sort(compareUtf8));
}

const authorities = paths(
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
  "source/authoring/kernel/context-resolver.mjs",
  "source/authoring/kernel/contract-semantics.mjs",
  "source/authoring/kernel/digests.mjs",
  "source/authoring/kernel/manifest-reducer.mjs",
  "source/authoring/kernel/manifest-selection.mjs",
  "source/authoring/kernel/request-planner.mjs",
);

const fixtures = paths(
  "tests/authoring/contracts/support/contract-validation.mjs",
  "tests/authoring/reducer/support.mjs",
  "tests/authoring/request-input-bindings/support.mjs",
  "tests/authoring/staged-authority/support.mjs",
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

const applicability = Object.freeze({
  mode: "not-applicable",
  transports: Object.freeze([]),
  adapters: Object.freeze([]),
});

function define(
  executable,
  invariantId,
  obligationId,
  evidenceClass,
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
    authorities,
    fixtures,
    applicability,
  });
}

export const s11Suite = Object.freeze([
  define(
    "tests/authoring/staged-authority/profile-options-schema.test.mjs",
    "AS02",
    "O-AS02-15",
    "conformance",
  ),
  define(
    "tests/authoring/staged-authority/execution-closure-schema-closure.test.mjs",
    "AS02",
    "O-AS02-16",
    "negative",
  ),
  define(
    "tests/authoring/staged-authority/execution-closure-reference-semantics.test.mjs",
    "AS02",
    "O-AS02-17",
    "negative",
  ),
  define(
    "tests/authoring/staged-authority/protocol-binding-closure-preserved.test.mjs",
    "AS02",
    "O-AS02-18",
    "negative",
  ),
  define(
    "tests/authoring/staged-authority/next-transition-unavailable.test.mjs",
    "AS02",
    "O-AS02-19",
    "negative",
  ),
  define(
    "tests/authoring/staged-authority/event-transition-unavailable.test.mjs",
    "AS02",
    "O-AS02-20",
    "negative",
  ),
  define(
    "tests/authoring/staged-authority/execution-closure-backward-compatibility.test.mjs",
    "AS02",
    "O-AS02-21",
    "conformance",
  ),
  define(
    "tests/authoring/staged-authority/revision-plan-unavailable.test.mjs",
    "AS11",
    "O-AS11-25",
    "negative",
  ),
  define(
    "tests/authoring/request-input-bindings/request-input-binding-schema-closure.test.mjs",
    "AS05",
    "O-AS05-34",
    "negative",
  ),
  define(
    "tests/authoring/request-input-bindings/request-input-binding-key-semantics.test.mjs",
    "AS05",
    "O-AS05-35",
    "negative",
  ),
  define(
    "tests/authoring/request-input-bindings/request-reference-binding-totality.test.mjs",
    "AS05",
    "O-AS05-36",
    "conformance",
  ),
  define(
    "tests/authoring/request-input-bindings/active-head-input-derivation.test.mjs",
    "AS05",
    "O-AS05-37",
    "positive",
  ),
  define(
    "tests/authoring/request-input-bindings/ambient-raw-input-rejection.test.mjs",
    "AS05",
    "O-AS05-38",
    "negative",
  ),
  define(
    "tests/authoring/request-input-bindings/legacy-raw-input-compatibility.test.mjs",
    "AS05",
    "O-AS05-39",
    "negative",
  ),
  define(
    "tests/authoring/request-input-bindings/aliased-raw-input-rejection.test.mjs",
    "AS05",
    "O-AS05-41",
    "negative",
  ),
  define(
    "tests/authoring/request-input-bindings/request-reference-input-derivation.test.mjs",
    "AS07",
    "O-AS07-38",
    "conformance",
  ),
  define(
    "tests/authoring/request-input-bindings/derived-input-replay.test.mjs",
    "AS07",
    "O-AS07-39",
    "conformance",
  ),
  define(
    "tests/authoring/request-input-bindings/revision-input-derivation.test.mjs",
    "AS11",
    "O-AS11-26",
    "positive",
  ),
]);
