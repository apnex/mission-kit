import Ajv2020 from "ajv/dist/2020.js";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateSurveyResourceSemantics
} from "../../../source/authoring/survey/resource-semantics.mjs";
import {
  loadSharedSchemaSnapshot
} from "../../../source/executables/compiler/shared-schema-closure.mjs";

const supportRoot = path.dirname(fileURLToPath(import.meta.url));
export const packageRoot = path.resolve(supportRoot, "../../..");
export const fixtureRoot = path.join(
  packageRoot,
  "tests/fixtures/survey/contracts"
);
const surveySchemaRoot = path.join(
  packageRoot,
  "schemas/survey/v1alpha1"
);
const authoringSchemaRoot = path.join(
  packageRoot,
  "schemas/authoring/v1alpha1"
);

const expectedSurveySchemaFiles = Object.freeze([
  "common.schema.json",
  "generation-record.schema.json",
  "question-frame-set.schema.json",
  "round-instrument.schema.json",
  "round-interpretation.schema.json",
  "survey-policy-snapshot.schema.json",
  "survey-question-binding.schema.json",
  "survey-round.schema.json",
  "survey-runtime-artifact.schema.json",
  "survey.schema.json"
]);

const expectedAuthoringSchemaFiles = Object.freeze([
  "authoring-assignment.schema.json",
  "authoring-commit-receipt.schema.json",
  "authoring-form-definition.schema.json",
  "authoring-journal-record.schema.json",
  "authoring-mutation.schema.json",
  "authoring-profile-manifest.schema.json",
  "authoring-protocol.schema.json",
  "authoring-request.schema.json",
  "authoring-submission.schema.json",
  "authoring-workspace.schema.json",
  "common.schema.json",
  "context-closure.schema.json",
  "projection-artifact.schema.json",
  "resource-reference.schema.json",
  "source-snapshot.schema.json",
  "validation-issue.schema.json"
]);

const schemaStemByKind = Object.freeze({
  Survey: "survey",
  SurveyRound: "survey-round",
  QuestionFrameSet: "question-frame-set",
  SurveyQuestionBinding: "survey-question-binding",
  RoundInstrument: "round-instrument",
  RoundInterpretation: "round-interpretation",
  SurveyPolicySnapshot: "survey-policy-snapshot",
  SurveyRuntimeArtifact: "survey-runtime-artifact",
  GenerationRecord: "generation-record"
});

let validatorsPromise;

async function readJson(absolutePath) {
  return JSON.parse(await readFile(absolutePath, "utf8"));
}

async function loadExactSchemaInventory(root, expected) {
  const discovered = (await readdir(root))
    .filter((name) => name.endsWith(".schema.json"))
    .sort();
  assert.deepEqual(discovered, expected);
  return Promise.all(
    discovered.map((name) => readJson(path.join(root, name)))
  );
}

export async function surveyContractValidators() {
  if (!validatorsPromise) {
    validatorsPromise = (async () => {
      const [surveySchemas, authoringSchemas, sharedClosure] =
        await Promise.all([
          loadExactSchemaInventory(
            surveySchemaRoot,
            expectedSurveySchemaFiles
          ),
          loadExactSchemaInventory(
            authoringSchemaRoot,
            expectedAuthoringSchemaFiles
          ),
          loadSharedSchemaSnapshot({ packageRoot })
        ]);
      assert.equal(sharedClosure.schemas.length, 4);
      const schemas = [
        ...sharedClosure.schemas,
        ...authoringSchemas,
        ...surveySchemas
      ];
      const ajv = new Ajv2020({
        allErrors: true,
        strict: true,
        validateFormats: false
      });
      for (const schema of schemas) ajv.addSchema(schema);
      const byKind = new Map();
      for (const [kind, stem] of Object.entries(schemaStemByKind)) {
        const id = `urn:mission-kit:survey:schema:${stem}:v1alpha1`;
        const validate = ajv.getSchema(id);
        if (!validate) throw new Error(`schema did not compile: ${id}`);
        byKind.set(kind, validate);
      }
      return Object.freeze({
        ajv,
        byKind,
        schemaCount: schemas.length,
        surveySchemaCount: surveySchemas.length
      });
    })();
  }
  return validatorsPromise;
}

export async function loadPositiveFixture(stem) {
  return readJson(path.join(fixtureRoot, "positive", `${stem}.json`));
}

export async function loadAuthoringFixture(stem) {
  return readJson(path.join(
    packageRoot,
    "tests/fixtures/authoring/contracts/positive",
    `${stem}.json`
  ));
}

export async function loadNegativeFixture(stem) {
  const fault = await readJson(
    path.join(fixtureRoot, "negative", `${stem}.json`)
  );
  const required = ["base", "operation", "path", "expectedIssue"];
  const allowed = new Set([...required, "value"]);
  assert.equal(
    required.every((key) => Object.hasOwn(fault, key)),
    true,
    `negative fixture ${stem} is incomplete`
  );
  assert.equal(
    Object.keys(fault).every((key) => allowed.has(key)),
    true,
    `negative fixture ${stem} has unknown fields`
  );
  assert.match(fault.path, /^\//);
  assert.match(fault.expectedIssue, /^[A-Z][A-Z0-9_]*$/);
  assert.equal(
    ["add", "remove", "replace"].includes(fault.operation),
    true
  );
  const hasValue = Object.hasOwn(fault, "value");
  assert.equal(fault.operation === "remove", !hasValue);
  return fault;
}

function decodePointer(pointer) {
  return pointer.slice(1).split("/").map((part) => (
    part.replaceAll("~1", "/").replaceAll("~0", "~")
  ));
}

export async function loadNegativeCandidate(stem) {
  const fault = await loadNegativeFixture(stem);
  const candidate = structuredClone(await loadPositiveFixture(fault.base));
  const parts = decodePointer(fault.path);
  const property = parts.pop();
  let parent = candidate;
  for (const part of parts) {
    assert.equal(
      parent !== null &&
      typeof parent === "object" &&
      Object.hasOwn(parent, part),
      true,
      `negative fixture path does not resolve: ${fault.path}`
    );
    parent = parent[part];
  }
  if (Array.isArray(parent)) {
    const index = Number(property);
    assert.equal(Number.isSafeInteger(index), true);
    if (fault.operation === "remove") {
      assert.equal(index < parent.length, true);
      parent.splice(index, 1);
    } else if (fault.operation === "replace") {
      assert.equal(index < parent.length, true);
      parent[index] = structuredClone(fault.value);
    } else {
      assert.equal(index <= parent.length, true);
      parent.splice(index, 0, structuredClone(fault.value));
    }
  } else {
    assert.equal(parent !== null && typeof parent === "object", true);
    const exists = Object.hasOwn(parent, property);
    assert.equal(fault.operation === "add" ? !exists : exists, true);
    if (fault.operation === "remove") {
      delete parent[property];
    } else {
      parent[property] = structuredClone(fault.value);
    }
  }
  return Object.freeze({ candidate, fault });
}

export async function validateSurveyResource(
  value,
  { resolveReference } = {}
) {
  const { byKind } = await surveyContractValidators();
  const validate = byKind.get(value?.kind);
  if (!validate) {
    return Object.freeze({
      valid: false,
      structuralErrors: Object.freeze([
        Object.freeze({
          instancePath: "/kind",
          keyword: "unsupported",
          message: "unsupported Survey resource kind"
        })
      ]),
      semanticIssues: Object.freeze([])
    });
  }
  if (!validate(value)) {
    return Object.freeze({
      valid: false,
      structuralErrors: Object.freeze(
        structuredClone(validate.errors ?? [])
      ),
      semanticIssues: Object.freeze([])
    });
  }
  const semanticIssues = validateSurveyResourceSemantics(value, {
    resolveReference
  });
  return Object.freeze({
    valid: semanticIssues.length === 0,
    structuralErrors: Object.freeze([]),
    semanticIssues
  });
}

export async function assertPositiveFixture(stem) {
  const candidate = await loadPositiveFixture(stem);
  const result = await validateSurveyResource(candidate);
  assert.equal(
    result.valid,
    true,
    JSON.stringify(result, null, 2)
  );
  assert.deepEqual(result.structuralErrors, []);
  assert.deepEqual(result.semanticIssues, []);
  return candidate;
}

export async function assertNegativeFixture(stem) {
  const { candidate, fault } = await loadNegativeCandidate(stem);
  const result = await validateSurveyResource(candidate);
  assert.equal(result.valid, false);
  const issueCodes = result.structuralErrors.length > 0
    ? ["STRUCTURAL_REJECTION"]
    : result.semanticIssues.map((item) => item.code);
  assert.equal(
    issueCodes.includes(fault.expectedIssue),
    true,
    JSON.stringify({ issueCodes, result }, null, 2)
  );
  return Object.freeze({ candidate, fault, result });
}
