import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import {
  catalogSchemas,
  clone,
  contextFrameSchema,
  readContextFrameExample,
  schemaCatalog,
  schemasRoot,
  validateContextFrameStructure
} from "../support/context-frame-validation.mjs";

const forbiddenVocabulary = [
  "survey",
  "round",
  "question",
  "ordinal",
  "director",
  "generation",
  "model",
  "response",
  "interpretation",
  "answer"
];

function assertStructurallyInvalid(contextFrame) {
  assert.equal(validateContextFrameStructure(contextFrame), false);
}

function regularFilesBelow(directory) {
  return fs.readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? regularFilesBelow(entryPath) : [entryPath];
    })
    .filter((entryPath) => fs.statSync(entryPath).isFile());
}

test("ContextFrame owns only the shared Kubernetes-shaped resource envelope", () => {
  assert.deepEqual(Object.keys(contextFrameSchema.properties).sort(), [
    "apiVersion",
    "kind",
    "metadata",
    "spec"
  ]);
  assert.equal(contextFrameSchema.additionalProperties, false);
  assert.equal(contextFrameSchema.properties.spec.additionalProperties, false);
  assert.equal(Object.hasOwn(contextFrameSchema.properties, "status"), false);
});

test("every ContextFrame boundary exposes only its ratified property set", () => {
  assert.deepEqual(
    Object.keys(contextFrameSchema.properties.spec.properties).sort(),
    ["givens", "purpose", "scope", "subject", "synopsis", "terms"]
  );
  assert.deepEqual(
    Object.keys(contextFrameSchema.$defs.scope.properties).sort(),
    ["excluded", "included"]
  );
  assert.deepEqual(
    Object.keys(contextFrameSchema.$defs.given.properties).sort(),
    ["classification", "text"]
  );
  assert.deepEqual(
    Object.keys(contextFrameSchema.$defs.term.properties).sort(),
    ["meaning", "term"]
  );
});

test("ContextFrame contract surfaces contain no process-specific vocabulary", () => {
  const ownedFiles = regularFilesBelow(path.join(schemasRoot, "context-frame"));

  for (const filePath of ownedFiles) {
    const relativePath = path.relative(schemasRoot, filePath);
    const content = fs.readFileSync(filePath, "utf8").toLowerCase();
    for (const term of forbiddenVocabulary) {
      assert.equal(
        content.includes(term.toLowerCase()),
        false,
        `${relativePath} leaked process-specific term ${term}`
      );
    }
  }
});

test("ContextFrame rejects process-specific fields at every semantic boundary", async (t) => {
  for (const field of forbiddenVocabulary) {
    await t.test(field, () => {
      const root = clone(readContextFrameExample("application-messaging.context-frame.json"));
      root[field] = "forbidden";
      assertStructurallyInvalid(root);

      const spec = clone(readContextFrameExample("application-messaging.context-frame.json"));
      spec.spec[field] = "forbidden";
      assertStructurallyInvalid(spec);

      const scope = clone(readContextFrameExample("application-messaging.context-frame.json"));
      scope.spec.scope[field] = "forbidden";
      assertStructurallyInvalid(scope);

      const given = clone(readContextFrameExample("application-messaging.context-frame.json"));
      given.spec.givens[0][field] = "forbidden";
      assertStructurallyInvalid(given);

      const term = clone(readContextFrameExample("application-messaging.context-frame.json"));
      term.spec.terms[0][field] = "forbidden";
      assertStructurallyInvalid(term);
    });
  }
});

test("ContextFrame catalog binding is unique and portable", () => {
  const resourceBindings = schemaCatalog.resources.filter(
    (resource) => resource.apiVersion === "schemas.mission-kit/v1alpha1" &&
      resource.kind === "ContextFrame"
  );
  assert.equal(resourceBindings.length, 1);

  const [resourceBinding] = resourceBindings;
  assert.equal(resourceBinding.schemaId, contextFrameSchema.$id);
  assert.equal(path.isAbsolute(resourceBinding.semanticValidator), false);
  assert.equal(
    fs.existsSync(path.join(schemasRoot, resourceBinding.semanticValidator)),
    true
  );

  const schemaBindings = catalogSchemas.filter(
    (entry) => entry.id === contextFrameSchema.$id
  );
  assert.equal(schemaBindings.length, 1);
  assert.equal(schemaBindings[0].role, "resource");
  assert.equal(path.isAbsolute(schemaBindings[0].path), false);
});

test("ContextFrame catalog semantic-validator binding is importable and exact", async () => {
  const resourceBinding = schemaCatalog.resources.find(
    (resource) => resource.apiVersion === "schemas.mission-kit/v1alpha1" &&
      resource.kind === "ContextFrame"
  );
  const validatorPath = path.join(schemasRoot, resourceBinding.semanticValidator);
  const validatorModule = await import(pathToFileURL(validatorPath));

  assert.deepEqual(
    Object.keys(validatorModule).sort(),
    ["validateContextFrameSemantics"]
  );
  assert.equal(typeof validatorModule.validateContextFrameSemantics, "function");
});
