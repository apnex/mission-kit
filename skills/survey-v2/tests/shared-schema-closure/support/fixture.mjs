import assert from "node:assert/strict";
import crypto from "node:crypto";
import {
  lstat,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  rm,
  symlink,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const supportDirectory = path.dirname(fileURLToPath(import.meta.url));

export const surveyRoot = path.resolve(supportDirectory, "../../..");
export const missionKitRoot = path.resolve(surveyRoot, "../..");
export const sharedAuthorityRoot = path.join(missionKitRoot, "schemas");
export const registryRelativePath = "dependencies/shared-schemas/v1/roots.json";

export const ids = Object.freeze({
  metadata: "urn:mission-kit:schemas:common:resource-metadata:v1alpha1",
  choice: "urn:mission-kit:schemas:question:choice-response:v1alpha1",
  question: "urn:mission-kit:schemas:question:v1alpha1",
  contextFrame: "urn:mission-kit:schemas:context-frame:v1alpha1"
});

export function rootRegistry() {
  return {
    $schema: "urn:mission-kit:survey-v2:schema:shared-schema-roots:v1",
    schemaVersion: "1.0.0",
    id: "urn:mission-kit:survey-v2:shared-schema-roots",
    source: {
      kind: "repository-selector",
      repository: "apnex/mission-kit",
      selector: "schemas"
    },
    catalogPath: "catalog.json",
    roots: [
      {
        apiVersion: "schemas.mission-kit/v1alpha1",
        kind: "ContextFrame",
        schemaId: ids.contextFrame,
        semanticValidatorExport: "validateContextFrameSemantics"
      },
      {
        apiVersion: "schemas.mission-kit/v1alpha1",
        kind: "Question",
        schemaId: ids.question,
        semanticValidatorExport: "validateQuestionSemantics"
      }
    ]
  };
}

export function authorityCatalog() {
  return {
    catalogVersion: "1.0.0",
    schemas: [
      {
        id: ids.metadata,
        path: "common/v1alpha1/resource-metadata.schema.json",
        role: "fragment"
      },
      {
        id: ids.choice,
        path: "question/v1alpha1/choice-response.schema.json",
        role: "fragment"
      },
      {
        id: ids.question,
        path: "question/v1alpha1/question.schema.json",
        role: "resource"
      },
      {
        id: ids.contextFrame,
        path: "context-frame/v1alpha1/context-frame.schema.json",
        role: "resource"
      }
    ],
    resources: [
      {
        apiVersion: "schemas.mission-kit/v1alpha1",
        kind: "Question",
        schemaId: ids.question,
        semanticValidator: "question/v1alpha1/question.validator.mjs"
      },
      {
        apiVersion: "schemas.mission-kit/v1alpha1",
        kind: "ContextFrame",
        schemaId: ids.contextFrame,
        semanticValidator: "context-frame/v1alpha1/context-frame.validator.mjs"
      }
    ]
  };
}

export function authoritySchemas() {
  return new Map([
    [
      "common/v1alpha1/resource-metadata.schema.json",
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: ids.metadata,
        type: "object",
        additionalProperties: false,
        required: ["name"],
        properties: {
          name: { type: "string", minLength: 1 }
        }
      }
    ],
    [
      "question/v1alpha1/choice-response.schema.json",
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: ids.choice,
        type: "object",
        additionalProperties: false,
        required: ["type", "options"],
        properties: {
          type: { const: "Choice" },
          options: {
            type: "array",
            minItems: 2,
            items: { type: "string", minLength: 1 }
          }
        }
      }
    ],
    [
      "question/v1alpha1/question.schema.json",
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: ids.question,
        type: "object",
        additionalProperties: false,
        required: ["apiVersion", "kind", "metadata", "spec"],
        properties: {
          apiVersion: { const: "schemas.mission-kit/v1alpha1" },
          kind: { const: "Question" },
          metadata: { $ref: ids.metadata },
          spec: {
            type: "object",
            additionalProperties: false,
            required: ["prompt", "response"],
            properties: {
              prompt: { type: "string", minLength: 1 },
              response: { $ref: ids.choice }
            }
          }
        }
      }
    ],
    [
      "context-frame/v1alpha1/context-frame.schema.json",
      {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: ids.contextFrame,
        type: "object",
        additionalProperties: false,
        required: ["apiVersion", "kind", "metadata", "spec"],
        properties: {
          apiVersion: { const: "schemas.mission-kit/v1alpha1" },
          kind: { const: "ContextFrame" },
          metadata: { $ref: ids.metadata },
          spec: {
            type: "object",
            additionalProperties: false,
            required: ["subject"],
            properties: {
              subject: { type: "string", minLength: 1 }
            }
          }
        }
      }
    ]
  ]);
}

export function authorityValidators() {
  return new Map([
    [
      "question/v1alpha1/question.validator.mjs",
      [
        "export function validateQuestionSemantics(question) {",
        "  return question?.spec?.prompt === \"duplicate\"",
        "    ? [{ code: \"DUPLICATE\", path: \"/spec/prompt\", message: \"duplicate prompt\" }]",
        "    : [];",
        "}",
        ""
      ].join("\n")
    ],
    [
      "context-frame/v1alpha1/context-frame.validator.mjs",
      [
        "export function validateContextFrameSemantics(contextFrame) {",
        "  return contextFrame?.spec?.subject === \"duplicate\"",
        "    ? [{ code: \"DUPLICATE\", path: \"/spec/subject\", message: \"duplicate subject\" }]",
        "    : [];",
        "}",
        ""
      ].join("\n")
    ]
  ]);
}

export async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function writeText(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, value, "utf8");
}

export { rm, symlink };

export async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function populateAuthority(authorityRoot) {
  await writeJson(path.join(authorityRoot, "catalog.json"), authorityCatalog());
  for (const [relativePath, schema] of authoritySchemas()) {
    await writeJson(path.join(authorityRoot, relativePath), schema);
  }
  for (const [relativePath, source] of authorityValidators()) {
    await writeText(path.join(authorityRoot, relativePath), source);
  }
}

export async function createFixture() {
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "survey-v2-shared-schema-"));
  const packageRoot = path.join(temporaryRoot, "package");
  const authorityRoot = path.join(temporaryRoot, "authority");
  await writeJson(path.join(packageRoot, registryRelativePath), rootRegistry());
  await populateAuthority(authorityRoot);
  return {
    temporaryRoot,
    packageRoot,
    authorityRoot,
    async cleanup() {
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  };
}

export function refreshOptions(fixture) {
  return {
    packageRoot: fixture.packageRoot,
    authorityRoot: fixture.authorityRoot
  };
}

function compareUtf8(left, right) {
  return Buffer.from(left).compare(Buffer.from(right));
}

export async function treeFingerprint(root) {
  const entries = [];

  async function visit(directory, prefix = "") {
    const children = await readdir(directory, { withFileTypes: true }).catch((error) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    children.sort((left, right) => compareUtf8(left.name, right.name));
    for (const child of children) {
      const relativePath = prefix ? `${prefix}/${child.name}` : child.name;
      const absolutePath = path.join(directory, child.name);
      const stat = await lstat(absolutePath);
      if (stat.isDirectory()) {
        entries.push({ path: relativePath, type: "directory", mode: stat.mode & 0o777 });
        await visit(absolutePath, relativePath);
      } else if (stat.isSymbolicLink()) {
        entries.push({ path: relativePath, type: "symlink" });
      } else {
        const bytes = await readFile(absolutePath);
        entries.push({
          path: relativePath,
          type: "file",
          mode: stat.mode & 0o777,
          bytes: bytes.length,
          digest: `sha256:${crypto.createHash("sha256").update(bytes).digest("hex")}`
        });
      }
    }
  }

  await visit(root);
  return entries;
}

export function findManifestMember(manifest, sourcePath) {
  if (manifest.catalog?.sourcePath === sourcePath) return manifest.catalog;
  const schema = manifest.schemas?.find((entry) => entry.sourcePath === sourcePath);
  if (schema) return schema;
  const validator = manifest.validators?.find((entry) => entry.sourcePath === sourcePath);
  assert.ok(validator, `manifest does not contain ${sourcePath}`);
  return validator;
}

export async function assertExactSnapshotBytes(packageRoot, authorityRoot, manifest) {
  const members = [manifest.catalog, ...manifest.schemas, ...manifest.validators];
  for (const member of members) {
    const [authorityBytes, snapshotBytes] = await Promise.all([
      readFile(path.join(authorityRoot, member.sourcePath)),
      readFile(path.join(packageRoot, member.snapshotPath))
    ]);
    assert.deepEqual(snapshotBytes, authorityBytes, member.sourcePath);
  }
}

export function errorMatches(error, { code, pattern } = {}) {
  if (code && error?.code !== code) return false;
  if (pattern && !pattern.test(String(error?.message))) return false;
  return true;
}

export async function assertClosureFailure(operation, code, pattern) {
  await assert.rejects(operation, (error) => {
    assert.equal(error?.name, "SharedSchemaClosureError");
    assert.equal(error?.code, code);
    if (pattern) assert.match(String(error.message), pattern);
    return true;
  });
}
