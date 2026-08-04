import Ajv2020 from "ajv/dist/2020.js";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  validateContractSemantics,
  validateTransactionClosureSemantics
} from "../../../../source/authoring/kernel/contract-semantics.mjs";

const supportRoot = path.dirname(fileURLToPath(import.meta.url));
export const packageRoot = path.resolve(supportRoot, "../../../..");
export const schemaRoot = path.join(packageRoot, "schemas/authoring/v1alpha1");
export const fixtureRoot = path.join(
  packageRoot,
  "tests/fixtures/authoring/contracts"
);

export const contractCases = Object.freeze([
  ["authoring-protocol", "AuthoringProtocol"],
  ["authoring-profile-manifest", "AuthoringProfileManifest"],
  ["authoring-workspace", "AuthoringWorkspace"],
  ["authoring-request", "AuthoringRequest"],
  ["authoring-assignment", "AuthoringAssignment"],
  ["context-closure", "ContextClosure"],
  ["source-snapshot", "SourceSnapshot"],
  ["authoring-form-definition", "AuthoringFormDefinition"],
  ["authoring-submission", "AuthoringSubmission"],
  ["authoring-commit-receipt", "AuthoringCommitReceipt"],
  ["authoring-journal-record", "AuthoringJournalRecord"],
  ["validation-issue", "ValidationIssue"],
  ["resource-reference", "ResourceReference"],
  ["projection-artifact", "ProjectionArtifact"],
  ["authoring-mutation", "AuthoringMutation"]
]);

const expectedSchemaFiles = Object.freeze([
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

let validatorPromise;

async function readJson(absolutePath) {
  return JSON.parse(await readFile(absolutePath, "utf8"));
}

export async function contractValidators() {
  if (!validatorPromise) {
    validatorPromise = (async () => {
      const discovered = (await readdir(schemaRoot))
        .filter((name) => name.endsWith(".schema.json"))
        .sort();
      if (JSON.stringify(discovered) !== JSON.stringify(expectedSchemaFiles)) {
        throw new Error(
          `authoring schema inventory mismatch: ${JSON.stringify(discovered)}`
        );
      }
      const schemas = await Promise.all(
        discovered.map((name) => readJson(path.join(schemaRoot, name)))
      );
      const ajv = new Ajv2020({
        allErrors: true,
        strict: true,
        validateFormats: false
      });
      for (const schema of schemas) ajv.addSchema(schema);
      const byStem = new Map();
      for (const schema of schemas) {
        const validate = ajv.getSchema(schema.$id);
        if (!validate) throw new Error(`schema did not compile: ${schema.$id}`);
        byStem.set(
          schema.$id.slice(
            "urn:mission-kit:authoring:schema:".length,
            -":v1alpha1".length
          ),
          validate
        );
      }
      return Object.freeze({ ajv, byStem, schemas: Object.freeze(schemas) });
    })();
  }
  return validatorPromise;
}

export async function loadContractFixture(disposition, stem) {
  if (!["positive", "negative"].includes(disposition)) {
    throw new TypeError(`unknown fixture disposition: ${disposition}`);
  }
  return readJson(path.join(fixtureRoot, disposition, `${stem}.json`));
}

function decodePointer(pointer) {
  if (typeof pointer !== "string" || !pointer.startsWith("/")) {
    throw new TypeError("negative fixture path must be a non-root JSON Pointer");
  }
  return pointer.slice(1).split("/").map((part) => (
    part.replaceAll("~1", "/").replaceAll("~0", "~")
  ));
}

export async function loadNegativeCandidate(stem) {
  const fixture = await loadContractFixture("negative", stem);
  const required = ["base", "expectedIssue", "operation", "path"];
  const allowed = new Set([...required, "value"]);
  if (
    required.some((key) => !Object.hasOwn(fixture, key)) ||
    Object.keys(fixture).some((key) => !allowed.has(key)) ||
    fixture.base !== stem ||
    !["add", "remove", "replace"].includes(fixture.operation)
  ) {
    throw new TypeError(`invalid single-mutation negative fixture: ${stem}`);
  }
  const hasValue = Object.hasOwn(fixture, "value");
  if ((fixture.operation === "remove") === hasValue) {
    throw new TypeError(`negative fixture value/operation mismatch: ${stem}`);
  }
  const candidate = structuredClone(
    await loadContractFixture("positive", fixture.base)
  );
  const parts = decodePointer(fixture.path);
  const property = parts.pop();
  let parent = candidate;
  for (const part of parts) {
    if (!parent || typeof parent !== "object" || !Object.hasOwn(parent, part)) {
      throw new TypeError(`negative fixture path does not resolve: ${stem}`);
    }
    parent = parent[part];
  }
  if (!parent || typeof parent !== "object") {
    throw new TypeError(`negative fixture parent is not a container: ${stem}`);
  }
  const exists = Object.hasOwn(parent, property);
  if (fixture.operation === "add" && exists) {
    throw new TypeError(`negative fixture add target already exists: ${stem}`);
  }
  if (fixture.operation !== "add" && !exists) {
    throw new TypeError(`negative fixture target does not exist: ${stem}`);
  }
  if (fixture.operation === "remove") {
    delete parent[property];
  } else {
    parent[property] = structuredClone(fixture.value);
  }
  return Object.freeze({
    candidate,
    expectedIssue: fixture.expectedIssue,
    mutation: Object.freeze({
      operation: fixture.operation,
      path: fixture.path
    })
  });
}

export async function validateContract(stem, value) {
  const { byStem } = await contractValidators();
  const validate = byStem.get(stem);
  if (!validate) throw new Error(`unknown contract schema stem: ${stem}`);
  if (!validate(value)) {
    return Object.freeze({
      valid: false,
      structuralErrors: Object.freeze(structuredClone(validate.errors ?? [])),
      semanticIssues: Object.freeze([])
    });
  }
  const semanticIssues = validateContractSemantics(value);
  return Object.freeze({
    valid: semanticIssues.length === 0,
    structuralErrors: Object.freeze([]),
    semanticIssues
  });
}

export async function assertPositiveContract(stem) {
  const fixture = await loadContractFixture("positive", stem);
  const result = await validateContract(stem, fixture);
  assert.equal(
    result.valid,
    true,
    JSON.stringify({
      structuralErrors: result.structuralErrors,
      semanticIssues: result.semanticIssues
    })
  );
  assert.deepEqual(result.structuralErrors, []);
  assert.deepEqual(result.semanticIssues, []);
}

export async function assertNegativeContract(stem) {
  const { candidate, expectedIssue, mutation } = await loadNegativeCandidate(stem);
  const result = await validateContract(stem, candidate);
  assert.equal(result.valid, false);
  const issueCodes = result.structuralErrors.length > 0
    ? ["STRUCTURAL_REJECTION"]
    : result.semanticIssues.map((item) => item.code);
  assert.deepEqual(issueCodes, [expectedIssue]);
  assert.match(mutation.path, /^\//);
}

export async function validatePositiveGraph() {
  const entries = await Promise.all(
    contractCases
      .filter(([stem]) => (
        stem !== "resource-reference" &&
        stem !== "authoring-journal-record"
      ))
      .map(async ([stem]) => [
        stem,
        await loadContractFixture("positive", stem)
      ])
  );
  const revisionForm = await loadContractFixture(
    "positive",
    "revision-form-definition"
  );
  const runtimeProtocol = await loadContractFixture(
    "positive",
    "runtime-protocol"
  );
  const mismatches = [];
  for (const [stem, value] of entries) {
    const validation = await validateContract(stem, value);
    for (const item of validation.structuralErrors) {
      mismatches.push(`${stem}: structural ${item.instancePath}`);
    }
    for (const item of validation.semanticIssues) {
      mismatches.push(`${stem}: semantic ${item.code}`);
    }
  }
  const revisionFormValidation = await validateContract(
    "authoring-form-definition",
    revisionForm
  );
  for (const item of revisionFormValidation.structuralErrors) {
    mismatches.push(`revision-form-definition: structural ${item.instancePath}`);
  }
  for (const item of revisionFormValidation.semanticIssues) {
    mismatches.push(`revision-form-definition: semantic ${item.code}`);
  }
  const runtimeProtocolValidation = await validateContract(
    "authoring-protocol",
    runtimeProtocol
  );
  for (const item of runtimeProtocolValidation.structuralErrors) {
    mismatches.push(`runtime-protocol: structural ${item.instancePath}`);
  }
  for (const item of runtimeProtocolValidation.semanticIssues) {
    mismatches.push(`runtime-protocol: semantic ${item.code}`);
  }
  const resources = [
    ...entries.map(([, value]) => value),
    revisionForm,
    runtimeProtocol
  ];
  const byKind = new Map(entries.map(([, value]) => [value.kind, value]));
  const graphIssues = validateTransactionClosureSemantics(resources, {
    roots: [
      byKind.get("AuthoringCommitReceipt"),
      byKind.get("AuthoringWorkspace")
    ]
  });
  mismatches.push(...graphIssues.map(
    (item) => `transaction: ${item.code} ${item.field}`
  ));
  const standalone = await loadContractFixture(
    "positive",
    "resource-reference"
  );
  const created = byKind.get("AuthoringMutation").spec.createdResources.find(
    (item) => sameReference(item.reference, standalone)
  );
  if (!created) {
    mismatches.push("resource-reference: standalone binding mismatch");
  }
  return Object.freeze(mismatches);
}

function sameReference(left, right) {
  return (
    left.apiVersion === right.apiVersion &&
    left.kind === right.kind &&
    left.name === right.name &&
    left.semanticDigest === right.semanticDigest
  );
}
