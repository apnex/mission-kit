function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function paths(...values) {
  if (new Set(values).size !== values.length) {
    throw new Error("K11 authority and fixture paths must be unique");
  }
  return Object.freeze([...values].sort(compareUtf8));
}

const textFormAuthorities = paths(
  "source/authoring/kernel/canonical.mjs",
  "source/authoring/kernel/digests.mjs",
  "source/authoring/kernel/text-forms.mjs"
);

const assignmentDagAuthorities = paths(
  "source/authoring/kernel/assignment-dag.mjs",
  "source/authoring/kernel/canonical.mjs",
  "source/authoring/kernel/digests.mjs",
  "source/authoring/kernel/text-forms.mjs"
);

const validatedAssignmentDagAuthorities = paths(
  "schemas/authoring/v1alpha1/authoring-assignment.schema.json",
  "schemas/authoring/v1alpha1/authoring-commit-receipt.schema.json",
  "schemas/authoring/v1alpha1/authoring-form-definition.schema.json",
  "schemas/authoring/v1alpha1/authoring-journal-record.schema.json",
  "schemas/authoring/v1alpha1/authoring-mutation.schema.json",
  "schemas/authoring/v1alpha1/authoring-profile-manifest.schema.json",
  "schemas/authoring/v1alpha1/authoring-protocol.schema.json",
  "schemas/authoring/v1alpha1/authoring-request.schema.json",
  "schemas/authoring/v1alpha1/authoring-submission.schema.json",
  "schemas/authoring/v1alpha1/authoring-workspace.schema.json",
  "schemas/authoring/v1alpha1/common.schema.json",
  "schemas/authoring/v1alpha1/context-closure.schema.json",
  "schemas/authoring/v1alpha1/projection-artifact.schema.json",
  "schemas/authoring/v1alpha1/resource-reference.schema.json",
  "schemas/authoring/v1alpha1/source-snapshot.schema.json",
  "schemas/authoring/v1alpha1/validation-issue.schema.json",
  "source/authoring/kernel/assignment-dag.mjs",
  "source/authoring/kernel/canonical.mjs",
  "source/authoring/kernel/contract-semantics.mjs",
  "source/authoring/kernel/digests.mjs",
  "source/authoring/kernel/text-forms.mjs"
);

const textFormFixtures = paths(
  "tests/authoring/text-forms/support.mjs"
);

const textFormGoldenFixtures = paths(
  "tests/authoring/text-forms/support.mjs",
  "tests/fixtures/authoring/text-forms/k11-golden-vectors.json"
);

const assignmentDagSupportFixtures = paths(
  "tests/authoring/assignment-dag/support.mjs"
);

const assignmentDagK10Fixtures = paths(
  "tests/authoring/assignment-dag/support.mjs",
  "tests/fixtures/authoring/contracts/positive/authoring-form-definition.json",
  "tests/fixtures/authoring/contracts/positive/authoring-profile-manifest.json",
  "tests/fixtures/authoring/contracts/positive/authoring-request.json",
  "tests/fixtures/authoring/contracts/positive/context-closure.json"
);

const assignmentDagGoldenFixtures = paths(
  "tests/authoring/assignment-dag/support.mjs",
  "tests/fixtures/authoring/contracts/positive/authoring-form-definition.json",
  "tests/fixtures/authoring/contracts/positive/authoring-profile-manifest.json",
  "tests/fixtures/authoring/contracts/positive/authoring-request.json",
  "tests/fixtures/authoring/contracts/positive/context-closure.json",
  "tests/fixtures/authoring/text-forms/k11-golden-vectors.json"
);

const validatedAssignmentDagFixtures = paths(
  "tests/authoring/assignment-dag/support.mjs",
  "tests/authoring/contracts/support/contract-validation.mjs",
  "tests/fixtures/authoring/contracts/positive/authoring-form-definition.json",
  "tests/fixtures/authoring/contracts/positive/authoring-profile-manifest.json",
  "tests/fixtures/authoring/contracts/positive/authoring-request.json",
  "tests/fixtures/authoring/contracts/positive/context-closure.json"
);

function defineCase({
  obligationId,
  invariantId,
  statement,
  evidenceClass,
  executable,
  authorities,
  fixtures
}) {
  if (obligationId.split("-")[1] !== invariantId) {
    throw new Error(`${obligationId} does not belong to ${invariantId}`);
  }
  return Object.freeze({
    obligationId,
    invariantId,
    statement,
    evidenceClass,
    executable,
    authorities,
    fixtures
  });
}

function textFormCase({
  obligationId,
  invariantId = "AS05",
  name,
  statement,
  evidenceClass,
  fixtures = textFormFixtures
}) {
  return defineCase({
    obligationId,
    invariantId,
    statement,
    evidenceClass,
    executable: `tests/authoring/text-forms/${name}.test.mjs`,
    authorities: textFormAuthorities,
    fixtures
  });
}

function assignmentDagCase({
  obligationId,
  invariantId = "AS07",
  name,
  statement,
  evidenceClass,
  authorities = assignmentDagAuthorities,
  fixtures = assignmentDagK10Fixtures
}) {
  return defineCase({
    obligationId,
    invariantId,
    statement,
    evidenceClass,
    executable: `tests/authoring/assignment-dag/${name}.test.mjs`,
    authorities,
    fixtures
  });
}

export const k11Suite = Object.freeze([
  textFormCase({
    obligationId: "O-AS04-05",
    invariantId: "AS04",
    name: "repeated-render",
    statement: "repeated text-form renders produce identical bytes",
    evidenceClass: "conformance"
  }),
  textFormCase({
    obligationId: "O-AS05-05",
    name: "all-types-roundtrip",
    statement: "all four field types round-trip through populated canonical text",
    evidenceClass: "positive",
    fixtures: textFormGoldenFixtures
  }),
  textFormCase({
    obligationId: "O-AS05-06",
    name: "bom",
    statement: "authoring text rejects a UTF-8 BOM",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-07",
    name: "boolean-yes-no",
    statement: "boolean fields map only exact yes and no literals",
    evidenceClass: "conformance"
  }),
  textFormCase({
    obligationId: "O-AS05-08",
    name: "enum-exactness",
    statement: "enum fields accept exactly one declared case-sensitive member",
    evidenceClass: "conformance"
  }),
  textFormCase({
    obligationId: "O-AS05-09",
    name: "field-id-grammar",
    statement:
      "the sealed field-ID grammar admits underscores and rejects invalid separators",
    evidenceClass: "conformance"
  }),
  textFormCase({
    obligationId: "O-AS05-10",
    name: "form-closed-keys",
    statement:
      "the executable form contract rejects undeclared root, spec, and field keys",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-11",
    name: "form-digest-authority",
    statement:
      "rendering rejects a form whose semantic body differs from its sealed digest",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-12",
    name: "immutable-skeleton",
    statement: "only declared field bodies are mutable",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-13",
    name: "invalid-utf8",
    statement: "authoring text rejects invalid UTF-8 bytes",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-14",
    name: "marker-duplicate",
    statement: "a submitted form cannot duplicate a field-marker region",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-15",
    name: "marker-missing-close",
    statement:
      "an opened field-marker region must have its matching close marker",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-16",
    name: "marker-missing",
    statement: "a submitted form cannot omit a declared field-marker region",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-17",
    name: "marker-nested",
    statement: "field-marker regions cannot nest",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-18",
    name: "marker-reordered",
    statement: "field-marker regions must retain declared order",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-19",
    name: "newline-normalization",
    statement: "CRLF and CR input normalize to canonical LF bytes",
    evidenceClass: "conformance"
  }),
  textFormCase({
    obligationId: "O-AS05-20",
    name: "nul",
    statement: "authoring text rejects NUL",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-21",
    name: "optional-omission",
    statement:
      "optional values are represented by omission, not explicit empty values",
    evidenceClass: "conformance"
  }),
  textFormCase({
    obligationId: "O-AS05-22",
    name: "paragraph-normalization",
    statement:
      "paragraphs normalize horizontal edges and enforce code-point bounds",
    evidenceClass: "conformance"
  }),
  textFormCase({
    obligationId: "O-AS05-23",
    name: "placeholder-residue",
    statement:
      "an exact generated placeholder sentinel cannot remain in a submitted field",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-24",
    name: "request-marker-mismatch",
    statement:
      "a submitted request marker must match the assigned request handle",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-25",
    name: "required-empty",
    statement: "an empty required field is rejected for every field type",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-26",
    name: "reserved-marker-injection",
    statement: "editable bodies reject reserved marker injection",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-27",
    name: "string-list-normalization",
    statement:
      "string lists normalize items and enforce syntax, uniqueness, and bounds",
    evidenceClass: "conformance"
  }),
  textFormCase({
    obligationId: "O-AS05-28",
    name: "terminal-lf",
    statement: "rendered text forms end in exactly one terminal LF",
    evidenceClass: "conformance"
  }),
  textFormCase({
    obligationId: "O-AS05-29",
    name: "unicode-preservation",
    statement:
      "Unicode scalars remain exact without compatibility normalization",
    evidenceClass: "conformance"
  }),
  textFormCase({
    obligationId: "O-AS05-30",
    name: "unsafe-static-marker",
    statement:
      "form-authored static text cannot materialize reserved protocol markers",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-31",
    name: "enum-member-whitespace",
    statement:
      "enum members with leading or trailing whitespace are rejected as non-canonical",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-32",
    name: "normalized-placeholder-residue",
    statement:
      "paragraph and string-list placeholder residue is rejected after normalization",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS05-33",
    name: "undeclared-field-marker",
    statement:
      "a submitted form cannot introduce an undeclared field-marker region",
    evidenceClass: "negative"
  }),
  textFormCase({
    obligationId: "O-AS06-39",
    invariantId: "AS06",
    name: "ordered-context-projection",
    statement:
      "context projection preserves layer order and exposes only ordered role values",
    evidenceClass: "conformance"
  }),
  assignmentDagCase({
    obligationId: "O-AS07-18",
    name: "request-sealing",
    statement:
      "request sealing closes the semantic-state edge before later DAG identities exist",
    evidenceClass: "conformance",
    authorities: validatedAssignmentDagAuthorities,
    fixtures: validatedAssignmentDagFixtures
  }),
  assignmentDagCase({
    obligationId: "O-AS07-19",
    name: "initial-handle",
    statement:
      "an unoccupied request receives its initial 8-character digest handle",
    evidenceClass: "conformance"
  }),
  assignmentDagCase({
    obligationId: "O-AS07-20",
    name: "collision-lengthening",
    statement:
      "request-handle collisions deterministically lengthen only the new handle",
    evidenceClass: "conformance",
    fixtures: assignmentDagSupportFixtures
  }),
  assignmentDagCase({
    obligationId: "O-AS07-21",
    name: "same-digest-reuse",
    statement:
      "the same request digest reuses its handle independently of registry order",
    evidenceClass: "conformance",
    fixtures: assignmentDagSupportFixtures
  }),
  assignmentDagCase({
    obligationId: "O-AS07-22",
    name: "invalid-handle-registry",
    statement:
      "malformed occupied-handle registries are rejected as a closed input",
    evidenceClass: "negative",
    fixtures: assignmentDagSupportFixtures
  }),
  assignmentDagCase({
    obligationId: "O-AS07-23",
    name: "acyclic-chain",
    statement:
      "issuance forms an explicit acyclic request-to-projection-to-assignment chain",
    evidenceClass: "conformance",
    fixtures: assignmentDagGoldenFixtures
  }),
  assignmentDagCase({
    obligationId: "O-AS07-24",
    name: "source-order",
    statement: "projection sources are exactly ordered request then context",
    evidenceClass: "conformance"
  }),
  assignmentDagCase({
    obligationId: "O-AS07-25",
    name: "projection-id-authority",
    statement:
      "the request projection ID and definition digest are authoritative",
    evidenceClass: "negative"
  }),
  assignmentDagCase({
    obligationId: "O-AS07-26",
    name: "assignment-byte-binding",
    statement:
      "an assignment binds the exact blank-view bytes and their domain digests",
    evidenceClass: "conformance"
  }),
  assignmentDagCase({
    obligationId: "O-AS07-27",
    name: "tamper-rejection",
    statement: "tampering with any sealed assignment-DAG stage is rejected",
    evidenceClass: "negative"
  }),
  assignmentDagCase({
    obligationId: "O-AS07-28",
    name: "wrong-projection-submission",
    statement:
      "a submission against the wrong projection artifact is rejected",
    evidenceClass: "negative"
  }),
  assignmentDagCase({
    obligationId: "O-AS07-29",
    name: "request-sealing-validator",
    statement:
      "request sealing requires one positive closed-contract validator result",
    evidenceClass: "negative"
  }),
  assignmentDagCase({
    obligationId: "O-AS07-30",
    name: "deterministic-view-reproduction",
    statement:
      "reproduction from supplied immutable DAG resources returns byte-identical blank views",
    evidenceClass: "conformance"
  }),
  assignmentDagCase({
    obligationId: "O-AS07-40",
    name: "projector-deterministic-view",
    statement:
      "a supplied projector deterministically owns the exact Assignment view bytes",
    evidenceClass: "conformance"
  }),
  assignmentDagCase({
    obligationId: "O-AS07-41",
    name: "projector-divergent-reproduction",
    statement:
      "cold reproduction rejects a projector that diverges from retained exact view bytes",
    evidenceClass: "negative"
  }),
  assignmentDagCase({
    obligationId: "O-AS07-43",
    name: "projector-omission",
    statement:
      "assignment issuance fails closed when its pinned projector renderer is omitted",
    evidenceClass: "negative"
  }),
  assignmentDagCase({
    obligationId: "O-AS07-44",
    name: "projector-async-result",
    statement:
      "assignment issuance consumes and rejects an asynchronous projector result",
    evidenceClass: "negative"
  }),
  assignmentDagCase({
    obligationId: "O-AS08-05",
    invariantId: "AS08",
    name: "submission-validity",
    statement:
      "a completed text form produces one structurally and semantically valid submission",
    evidenceClass: "positive",
    authorities: validatedAssignmentDagAuthorities,
    fixtures: validatedAssignmentDagFixtures
  }),
  assignmentDagCase({
    obligationId: "O-AS08-06",
    invariantId: "AS08",
    name: "raw-evidence-newlines",
    statement:
      "raw evidence preserves submitted bytes while parsing normalizes newlines",
    evidenceClass: "conformance"
  }),
  assignmentDagCase({
    obligationId: "O-AS08-25",
    invariantId: "AS08",
    name: "generation-unicode-scalar-bound",
    statement:
      "generation provider and model bounds count Unicode scalars consistently with their schema",
    evidenceClass: "conformance",
    authorities: validatedAssignmentDagAuthorities,
    fixtures: validatedAssignmentDagFixtures
  })
]);
