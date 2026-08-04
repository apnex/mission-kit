import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";
import {
  catalogSchemas,
  questionSchema,
  schemaCatalog,
  schemasRoot
} from "../support/question-validation.mjs";

const forbiddenSurveyTerms = [
  "axisPreAnchors",
  "designRationale",
  "director",
  "intentDimension",
  "questionId",
  "round1Relation",
  "sourceEvidenceRefs",
  "survey"
];

test("Question owns only the Kubernetes-shaped resource envelope", () => {
  assert.deepEqual(Object.keys(questionSchema.properties).sort(), [
    "apiVersion",
    "kind",
    "metadata",
    "spec"
  ]);
  assert.equal(questionSchema.additionalProperties, false);
  assert.equal(questionSchema.properties.spec.additionalProperties, false);
});

test("Question schema contains no Survey-specific vocabulary", () => {
  const serializedSchema = JSON.stringify(questionSchema);
  for (const term of forbiddenSurveyTerms) {
    assert.equal(
      serializedSchema.toLowerCase().includes(term.toLowerCase()),
      false,
      `Question schema leaked Survey term ${term}`
    );
  }
});

test("Question has no observed status contract", () => {
  assert.equal(Object.hasOwn(questionSchema.properties, "status"), false);
});

test("Question rejects answer and influence fields from every closed boundary", async (t) => {
  const forbiddenFields = [
    ["status", {}],
    ["answer", ["rolling"]],
    ["selection", ["rolling"]],
    ["recommendation", "rolling"],
    ["preselected", ["rolling"]],
    ["default", "rolling"]
  ];

  for (const [field] of forbiddenFields) {
    await t.test(field, () => {
      assert.equal(Object.hasOwn(questionSchema.properties, field), false);
      assert.equal(Object.hasOwn(questionSchema.properties.spec.properties, field), false);
    });
  }
});

test("Question exposes a discriminated response extension seam", () => {
  const response = questionSchema.properties.spec.properties.response;
  assert.equal(Array.isArray(response.oneOf), true);
  assert.equal(response.oneOf.length, 1);
  assert.equal(
    response.oneOf[0].$ref,
    "urn:mission-kit:schemas:question:choice-response:v1alpha1"
  );
});

test("schema catalog uniquely maps every declared ID to a portable file", () => {
  const ids = catalogSchemas.map((entry) => entry.id);
  const paths = catalogSchemas.map((entry) => entry.path);

  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(paths).size, paths.length);

  for (const entry of catalogSchemas) {
    assert.equal(entry.schema.$id, entry.id);
    assert.equal(path.isAbsolute(entry.path), false);
    assert.equal(fs.existsSync(path.join(schemasRoot, entry.path)), true);
  }

  const questionResource = schemaCatalog.resources.find(
    (resource) => resource.apiVersion === "schemas.mission-kit/v1alpha1" &&
      resource.kind === "Question"
  );
  assert.equal(questionResource.schemaId, questionSchema.$id);
  assert.equal(
    fs.existsSync(path.join(schemasRoot, questionResource.semanticValidator)),
    true
  );
});
