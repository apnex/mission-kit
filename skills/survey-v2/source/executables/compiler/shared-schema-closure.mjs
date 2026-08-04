#!/usr/bin/env node
import { constants } from "node:fs";
import {
  lstat,
  mkdir,
  open,
  readdir,
  realpath,
  rename,
  rm
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "acorn";
import {
  canonicalize,
  prettyJson,
  sha256Bytes,
  sha256Value
} from "../runtime/lib/canonical.mjs";

export const SHARED_SCHEMA_ROOTS_PATH =
  "dependencies/shared-schemas/v1/roots.json";
export const SHARED_SCHEMA_MANIFEST_PATH =
  "dependencies/shared-schemas/v1/closure.manifest.json";
export const SHARED_SCHEMA_SNAPSHOT_PREFIX =
  "dependencies/shared-schemas/v1/snapshot";

const MAX_MEMBER_BYTES = 16 * 1024 * 1024;
const MAX_CLOSURE_MEMBERS = 512;
const MAX_REFERENCE_EDGES = 8192;
const ROOT_SCHEMA_ID =
  "urn:mission-kit:survey-v2:schema:shared-schema-roots:v1";
const ROOT_LIST_ID =
  "urn:mission-kit:survey-v2:shared-schema-roots";
const CLOSURE_SCHEMA_ID =
  "urn:mission-kit:survey-v2:schema:shared-schema-closure:v1";
const CLOSURE_ID =
  "urn:mission-kit:survey-v2:shared-schema-closure";
const SOURCE_ID = Object.freeze({
  kind: "repository-selector",
  repository: "apnex/mission-kit",
  selector: "schemas"
});
const utf8Decoder = new TextDecoder("utf-8", { fatal: true });

export class SharedSchemaClosureError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = "SharedSchemaClosureError";
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

function fail(code, message, details) {
  throw new SharedSchemaClosureError(code, message, details);
}

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function compareFields(...fields) {
  return (left, right) => {
    for (const field of fields) {
      const comparison = compareUtf8(String(left[field]), String(right[field]));
      if (comparison !== 0) return comparison;
    }
    return 0;
  };
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function assertRecord(value, code, label) {
  if (
    value === null ||
    Array.isArray(value) ||
    typeof value !== "object" ||
    Object.getPrototypeOf(value) !== Object.prototype
  ) {
    fail(code, `${label} must be a JSON object`);
  }
  return value;
}

function assertExactKeys(value, expected, code, label) {
  assertRecord(value, code, label);
  const actual = Object.keys(value).sort(compareUtf8);
  const wanted = [...expected].sort(compareUtf8);
  if (canonicalize(actual) !== canonicalize(wanted)) {
    fail(
      code,
      `${label} fields differ: expected ${wanted.join(", ")}, got ${actual.join(", ")}`
    );
  }
}

function assertNonEmptyString(value, code, label) {
  if (typeof value !== "string" || value.length === 0) {
    fail(code, `${label} must be a non-empty string`);
  }
  return value;
}

function assertDigest(value, code, label) {
  if (typeof value !== "string" || !/^sha256:[0-9a-f]{64}$/.test(value)) {
    fail(code, `${label} must be a sha256 digest`);
  }
}

function assertSafeRelativePath(relativePath, code = "UNSAFE_PATH", label = "path") {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    path.posix.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath.includes("\0") ||
    relativePath.split("/").some((part) => part === "" || part === "." || part === "..") ||
    !/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/.test(relativePath)
  ) {
    fail(code, `${label} is not a normalized repository-relative POSIX path: ${String(relativePath)}`);
  }
  return relativePath;
}

function snapshotPathFor(sourcePath) {
  assertSafeRelativePath(sourcePath);
  return `${SHARED_SCHEMA_SNAPSHOT_PREFIX}/${sourcePath}`;
}

function decodeUtf8(bytes, label) {
  try {
    return utf8Decoder.decode(bytes);
  } catch {
    fail("INVALID_UTF8", `${label} is not canonical UTF-8`);
  }
}

function visitJsonAst(node, label) {
  if (!node || typeof node !== "object") return;
  if (node.type === "ObjectExpression") {
    const keys = new Set();
    for (const property of node.properties) {
      if (
        property.type !== "Property" ||
        property.computed ||
        property.kind !== "init" ||
        property.method ||
        property.shorthand ||
        property.key.type !== "Literal" ||
        typeof property.key.value !== "string"
      ) {
        fail("INVALID_JSON", `${label} contains a non-JSON object member`);
      }
      if (keys.has(property.key.value)) {
        fail(
          "DUPLICATE_JSON_KEY",
          `${label} contains duplicate object key ${JSON.stringify(property.key.value)}`
        );
      }
      keys.add(property.key.value);
      visitJsonAst(property.value, label);
    }
  } else if (node.type === "ArrayExpression") {
    for (const element of node.elements) visitJsonAst(element, label);
  } else if (
    !["Literal", "UnaryExpression"].includes(node.type)
  ) {
    fail("INVALID_JSON", `${label} contains unsupported JSON syntax`);
  }
}

function parseJsonBytes(bytes, label) {
  const text = decodeUtf8(bytes, label);
  let value;
  try {
    value = JSON.parse(text);
  } catch (error) {
    fail("INVALID_JSON", `${label} is invalid JSON: ${error.message}`);
  }
  try {
    const program = parse(`(${text}\n)`, {
      ecmaVersion: "latest",
      sourceType: "script"
    });
    visitJsonAst(program.body[0]?.expression, label);
    canonicalize(value);
  } catch (error) {
    if (error instanceof SharedSchemaClosureError) throw error;
    fail("INVALID_JSON", `${label} cannot be canonicalized: ${error.message}`);
  }
  return value;
}

async function secureRoot(rootPath, label) {
  if (typeof rootPath !== "string" || rootPath.length === 0) {
    fail("UNSAFE_PATH", `${label} must be a filesystem path`);
  }
  const resolved = path.resolve(rootPath);
  let observed;
  try {
    observed = await lstat(resolved, { bigint: true });
  } catch (error) {
    fail("SOURCE_UNAVAILABLE", `${label} is unavailable: ${error.code}`);
  }
  if (observed.isSymbolicLink()) fail("SYMLINK", `${label} must not be a symlink`);
  if (!observed.isDirectory()) fail("NOT_REGULAR_FILE", `${label} must be a directory`);
  const canonical = await realpath(resolved);
  if (canonical !== resolved) {
    fail("SYMLINK", `${label} traverses a symlink or non-canonical ancestor`);
  }
  return {
    path: canonical,
    device: observed.dev,
    inode: observed.ino
  };
}

async function assertRootIdentity(root, label) {
  const observed = await lstat(root.path, { bigint: true }).catch((error) => {
    fail("SOURCE_UNSTABLE", `${label} disappeared: ${error.code}`);
  });
  if (
    !observed.isDirectory() ||
    observed.isSymbolicLink() ||
    observed.dev !== root.device ||
    observed.ino !== root.inode
  ) {
    fail("SOURCE_UNSTABLE", `${label} identity changed during observation`);
  }
}

function containedTarget(root, relativePath, code = "PATH_ESCAPE") {
  assertSafeRelativePath(relativePath, code);
  const target = path.resolve(root.path, ...relativePath.split("/"));
  const relative = path.relative(root.path, target);
  if (relative === "" || relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(code, `path escapes its declared root: ${relativePath}`);
  }
  return target;
}

async function secureRead(
  root,
  relativePath,
  {
    label = relativePath,
    missingCode = "SOURCE_UNAVAILABLE",
    maxBytes = MAX_MEMBER_BYTES
  } = {}
) {
  const target = containedTarget(root, relativePath);
  let current = root.path;
  const segments = relativePath.split("/");
  let leafObservation;
  for (let index = 0; index < segments.length; index += 1) {
    current = path.join(current, segments[index]);
    let observed;
    try {
      observed = await lstat(current, { bigint: true });
    } catch (error) {
      fail(missingCode, `${label} is unavailable: ${error.code}`);
    }
    if (observed.isSymbolicLink()) {
      fail("SYMLINK", `${label} traverses symlink ${segments.slice(0, index + 1).join("/")}`);
    }
    if (index < segments.length - 1 && !observed.isDirectory()) {
      fail("NOT_REGULAR_FILE", `${label} traverses a non-directory component`);
    }
    if (index === segments.length - 1) leafObservation = observed;
  }
  if (!leafObservation.isFile()) fail("NOT_REGULAR_FILE", `${label} is not a regular file`);
  if (leafObservation.size < 1n || leafObservation.size > BigInt(maxBytes)) {
    fail("BUDGET_EXCEEDED", `${label} exceeds the admitted byte bounds`);
  }

  let handle;
  try {
    handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  } catch (error) {
    if (error.code === "ELOOP") fail("SYMLINK", `${label} became a symlink before open`);
    fail(missingCode, `${label} could not be opened: ${error.code}`);
  }
  let bytes;
  try {
    const opened = await handle.stat({ bigint: true });
    if (!opened.isFile()) fail("NOT_REGULAR_FILE", `${label} did not open as a regular file`);
    if (opened.dev !== leafObservation.dev || opened.ino !== leafObservation.ino) {
      fail("SOURCE_UNSTABLE", `${label} identity changed before open`);
    }
    bytes = await handle.readFile();
    const completed = await handle.stat({ bigint: true });
    if (
      completed.dev !== opened.dev ||
      completed.ino !== opened.ino ||
      completed.size !== BigInt(bytes.length) ||
      completed.size !== opened.size
    ) {
      fail("SOURCE_UNSTABLE", `${label} changed while being read`);
    }
  } finally {
    await handle.close();
  }

  const after = await lstat(target, { bigint: true }).catch((error) => {
    fail("SOURCE_UNSTABLE", `${label} disappeared after read: ${error.code}`);
  });
  if (
    after.isSymbolicLink() ||
    after.dev !== leafObservation.dev ||
    after.ino !== leafObservation.ino ||
    after.size !== BigInt(bytes.length)
  ) {
    fail("SOURCE_UNSTABLE", `${label} identity changed after read`);
  }
  const physical = await realpath(target);
  const physicalRelative = path.relative(root.path, physical);
  if (
    physical !== target ||
    physicalRelative.startsWith("..") ||
    path.isAbsolute(physicalRelative)
  ) {
    fail("PATH_ESCAPE", `${label} resolves outside its declared root`);
  }
  await assertRootIdentity(root, "filesystem root");
  return bytes;
}

function validateRootList(value) {
  assertExactKeys(
    value,
    ["$schema", "schemaVersion", "id", "source", "catalogPath", "roots"],
    "INVALID_ROOTS",
    "shared-schema root registry"
  );
  if (
    value.$schema !== ROOT_SCHEMA_ID ||
    value.schemaVersion !== "1.0.0" ||
    value.id !== ROOT_LIST_ID
  ) {
    fail("INVALID_ROOTS", "shared-schema root registry identity is invalid");
  }
  assertExactKeys(
    value.source,
    ["kind", "repository", "selector"],
    "INVALID_ROOTS",
    "shared-schema root source"
  );
  if (canonicalize(value.source) !== canonicalize(SOURCE_ID)) {
    fail("INVALID_ROOTS", "shared-schema root source authority is invalid");
  }
  if (value.catalogPath !== "catalog.json") {
    fail("INVALID_ROOTS", "shared-schema catalog path must be catalog.json");
  }
  if (!Array.isArray(value.roots) || value.roots.length !== 2) {
    fail("INVALID_ROOTS", "root registry must contain exactly two roots");
  }
  const expected = new Map([
    ["ContextFrame", {
      schemaId: "urn:mission-kit:schemas:context-frame:v1alpha1",
      semanticValidatorExport: "validateContextFrameSemantics"
    }],
    ["Question", {
      schemaId: "urn:mission-kit:schemas:question:v1alpha1",
      semanticValidatorExport: "validateQuestionSemantics"
    }]
  ]);
  const seen = new Set();
  for (const [index, root] of value.roots.entries()) {
    assertExactKeys(
      root,
      ["apiVersion", "kind", "schemaId", "semanticValidatorExport"],
      "INVALID_ROOTS",
      `shared-schema root ${index}`
    );
    if (
      root.apiVersion !== "schemas.mission-kit/v1alpha1" ||
      !expected.has(root.kind) ||
      root.schemaId !== expected.get(root.kind).schemaId ||
      root.semanticValidatorExport !== expected.get(root.kind).semanticValidatorExport ||
      seen.has(root.kind)
    ) {
      fail("INVALID_ROOTS", `shared-schema root ${index} is not the fixed ${root.kind} binding`);
    }
    seen.add(root.kind);
  }
  const sorted = [...value.roots].sort(compareFields("apiVersion", "kind", "schemaId"));
  if (canonicalize(sorted) !== canonicalize(value.roots)) {
    fail("INVALID_ROOTS", "shared-schema roots are not in deterministic byte order");
  }
  return value;
}

function validateCatalog(value) {
  assertExactKeys(
    value,
    ["catalogVersion", "schemas", "resources"],
    "INVALID_CATALOG",
    "schema catalog"
  );
  if (value.catalogVersion !== "1.0.0") {
    fail("INVALID_CATALOG", "unsupported schema catalog version");
  }
  if (!Array.isArray(value.schemas) || !Array.isArray(value.resources)) {
    fail("INVALID_CATALOG", "schema catalog arrays are missing");
  }
  const byId = new Map();
  const byPath = new Map();
  for (const [index, entry] of value.schemas.entries()) {
    assertExactKeys(entry, ["id", "path", "role"], "INVALID_CATALOG", `catalog schema ${index}`);
    assertNonEmptyString(entry.id, "INVALID_CATALOG", `catalog schema ${index} ID`);
    assertSafeRelativePath(entry.path, "UNSAFE_PATH", `catalog schema ${index} path`);
    if (!["fragment", "resource"].includes(entry.role)) {
      fail("INVALID_CATALOG", `catalog schema ${entry.id} has invalid role`);
    }
    if (byId.has(entry.id)) fail("DUPLICATE_SCHEMA_ID", `duplicate catalog schema ID ${entry.id}`);
    if (byPath.has(entry.path)) {
      fail("DUPLICATE_SCHEMA_PATH", `duplicate catalog schema path ${entry.path}`);
    }
    byId.set(entry.id, entry);
    byPath.set(entry.path, entry);
  }
  const resourceKeys = new Set();
  for (const [index, resource] of value.resources.entries()) {
    assertExactKeys(
      resource,
      ["apiVersion", "kind", "schemaId", "semanticValidator"],
      "INVALID_CATALOG",
      `catalog resource ${index}`
    );
    for (const field of ["apiVersion", "kind", "schemaId"]) {
      assertNonEmptyString(resource[field], "INVALID_CATALOG", `catalog resource ${index}.${field}`);
    }
    assertSafeRelativePath(
      resource.semanticValidator,
      "UNSAFE_PATH",
      `catalog resource ${index} semantic validator`
    );
    const key = `${resource.apiVersion}\0${resource.kind}`;
    if (resourceKeys.has(key)) {
      fail("DUPLICATE_RESOURCE_BINDING", `duplicate catalog resource ${resource.apiVersion}/${resource.kind}`);
    }
    resourceKeys.add(key);
  }
  return { value, byId, byPath };
}

function collectSchemaReferences(value) {
  const references = [];
  const stack = [{ value, pointer: "" }];
  while (stack.length > 0) {
    const current = stack.pop();
    if (Array.isArray(current.value)) {
      for (let index = current.value.length - 1; index >= 0; index -= 1) {
        stack.push({ value: current.value[index], pointer: `${current.pointer}/${index}` });
      }
    } else if (current.value && typeof current.value === "object") {
      const entries = Object.entries(current.value);
      for (let index = entries.length - 1; index >= 0; index -= 1) {
        const [key, child] = entries[index];
        const escaped = key.replaceAll("~", "~0").replaceAll("/", "~1");
        const pointer = `${current.pointer}/${escaped}`;
        if ((key === "$ref" || key === "$dynamicRef")) {
          if (typeof child !== "string" || child.length === 0) {
            fail("INVALID_SCHEMA", `${pointer} must contain a non-empty URI reference`);
          }
          references.push({ keyword: key, pointer, raw: child });
        }
        stack.push({ value: child, pointer });
      }
    }
    if (references.length > MAX_REFERENCE_EDGES) {
      fail("BUDGET_EXCEEDED", "schema reference graph exceeds its edge budget");
    }
  }
  return references.sort(compareFields("pointer", "keyword", "raw"));
}

function splitReference(raw) {
  const hashIndex = raw.indexOf("#");
  return hashIndex === -1
    ? { document: raw, fragment: "" }
    : { document: raw.slice(0, hashIndex), fragment: raw.slice(hashIndex + 1) };
}

function resolveSchemaReference(reference, currentEntry, catalog) {
  const { document, fragment } = splitReference(reference.raw);
  if (document === "") {
    return { targetId: currentEntry.id, fragment, external: false };
  }
  if (/^(?:https?|file|data|javascript):/i.test(document) || document.startsWith("//")) {
    fail("REMOTE_REFERENCE", `${currentEntry.id} contains disallowed reference ${reference.raw}`);
  }
  if (/^[A-Za-z][A-Za-z0-9+.-]*:/.test(document)) {
    if (!document.startsWith("urn:")) {
      fail("REMOTE_REFERENCE", `${currentEntry.id} contains external reference ${reference.raw}`);
    }
    if (!catalog.byId.has(document)) {
      fail("UNRESOLVED_REFERENCE", `${currentEntry.id} references unknown schema ${document}`);
    }
    return {
      targetId: document,
      fragment,
      external: document !== currentEntry.id
    };
  }
  if (document.includes("?") || document.includes("\\")) {
    fail("UNRESOLVED_REFERENCE", `${currentEntry.id} contains invalid relative reference ${reference.raw}`);
  }
  const joined = path.posix.normalize(path.posix.join(path.posix.dirname(currentEntry.path), document));
  if (joined === ".." || joined.startsWith("../") || path.posix.isAbsolute(joined)) {
    fail("PATH_ESCAPE", `${currentEntry.id} reference escapes the schema root: ${reference.raw}`);
  }
  assertSafeRelativePath(joined, "PATH_ESCAPE", "resolved schema reference");
  const target = catalog.byPath.get(joined);
  if (!target) {
    fail("UNRESOLVED_REFERENCE", `${currentEntry.id} references unregistered path ${joined}`);
  }
  return {
    targetId: target.id,
    fragment,
    external: target.id !== currentEntry.id
  };
}

function decodeFragment(fragment, label) {
  try {
    return decodeURIComponent(fragment);
  } catch {
    fail("UNRESOLVED_REFERENCE", `${label} contains an invalid percent-encoded fragment`);
  }
}

function resolveJsonPointer(document, pointer, label) {
  if (pointer === "") return document;
  if (!pointer.startsWith("/")) return undefined;
  let current = document;
  for (const encodedToken of pointer.slice(1).split("/")) {
    if (/~(?:[^01]|$)/.test(encodedToken)) {
      fail("UNRESOLVED_REFERENCE", `${label} contains an invalid JSON Pointer escape`);
    }
    const token = encodedToken.replaceAll("~1", "/").replaceAll("~0", "~");
    if (Array.isArray(current)) {
      if (!/^(?:0|[1-9][0-9]*)$/.test(token) || Number(token) >= current.length) {
        return undefined;
      }
      current = current[Number(token)];
    } else if (current && typeof current === "object" && hasOwn(current, token)) {
      current = current[token];
    } else {
      return undefined;
    }
  }
  return current;
}

function hasAnchor(document, anchor) {
  let matches = 0;
  const stack = [document];
  while (stack.length > 0) {
    const value = stack.pop();
    if (Array.isArray(value)) {
      stack.push(...value);
    } else if (value && typeof value === "object") {
      if (value.$anchor === anchor || value.$dynamicAnchor === anchor) matches += 1;
      stack.push(...Object.values(value));
    }
  }
  return matches;
}

function validateResolvedFragment(document, fragment, label) {
  const decoded = decodeFragment(fragment, label);
  if (decoded === "") return;
  if (decoded.startsWith("/")) {
    if (resolveJsonPointer(document, decoded, label) === undefined) {
      fail("UNRESOLVED_REFERENCE", `${label} points to an absent JSON Pointer`);
    }
    return;
  }
  const matches = hasAnchor(document, decoded);
  if (matches !== 1) {
    fail(
      "UNRESOLVED_REFERENCE",
      `${label} resolves to ${matches} anchors instead of exactly one`
    );
  }
}

function exportedNamesFromPattern(pattern, names) {
  if (!pattern) return;
  if (pattern.type === "Identifier") names.add(pattern.name);
  else if (pattern.type === "ObjectPattern") {
    for (const property of pattern.properties) {
      exportedNamesFromPattern(property.value ?? property.argument, names);
    }
  } else if (pattern.type === "ArrayPattern") {
    for (const element of pattern.elements) exportedNamesFromPattern(element, names);
  } else if (pattern.type === "AssignmentPattern") {
    exportedNamesFromPattern(pattern.left, names);
  } else if (pattern.type === "RestElement") {
    exportedNamesFromPattern(pattern.argument, names);
  }
}

function analyzeModule(bytes, sourcePath) {
  const text = decodeUtf8(bytes, sourcePath);
  let ast;
  try {
    ast = parse(text, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowHashBang: false
    });
  } catch (error) {
    fail("INVALID_MODULE", `${sourcePath} is invalid ESM: ${error.message}`);
  }

  const functionBindings = new Set();
  const importedBindings = new Map();
  const declaredExports = new Set();
  const directExports = new Set();
  const forwardedExports = new Map();
  const starExportSpecifiers = [];
  const importRequests = [];
  const imports = [];

  for (const statement of ast.body) {
    const declaration = statement.type === "ExportNamedDeclaration"
      ? statement.declaration
      : statement;
    if (declaration?.type === "FunctionDeclaration" && declaration.id) {
      functionBindings.add(declaration.id.name);
    } else if (declaration?.type === "VariableDeclaration") {
      for (const item of declaration.declarations) {
        if (
          item.id.type === "Identifier" &&
          ["ArrowFunctionExpression", "FunctionExpression"].includes(item.init?.type)
        ) {
          functionBindings.add(item.id.name);
        }
      }
    }
    if (statement.type === "ImportDeclaration") {
      for (const specifier of statement.specifiers) {
        if (specifier.type === "ImportNamespaceSpecifier") {
          importedBindings.set(specifier.local.name, {
            kind: "namespace",
            specifier: statement.source.value,
            imported: "*"
          });
        } else if (specifier.type === "ImportDefaultSpecifier") {
          importedBindings.set(specifier.local.name, {
            kind: "binding",
            specifier: statement.source.value,
            imported: "default"
          });
        } else {
          importedBindings.set(specifier.local.name, {
            kind: "binding",
            specifier: statement.source.value,
            imported: specifier.imported.name ?? specifier.imported.value
          });
        }
      }
    }
  }

  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (node.type === "ImportExpression") {
      fail("DYNAMIC_IMPORT", `${sourcePath} contains a dynamic import`);
    }
    if (
      node.type === "CallExpression" &&
      node.callee?.type === "Identifier" &&
      node.callee.name === "require"
    ) {
      fail("INVALID_MODULE", `${sourcePath} contains CommonJS require()`);
    }
    for (const [key, value] of Object.entries(node)) {
      if (key === "start" || key === "end") continue;
      if (Array.isArray(value)) {
        for (const child of value) walk(child);
      } else if (value && typeof value === "object" && typeof value.type === "string") {
        walk(value);
      }
    }
  }
  walk(ast);

  for (const statement of ast.body) {
    if (statement.type === "ImportDeclaration") {
      imports.push(statement.source.value);
      for (const specifier of statement.specifiers) {
        if (specifier.type === "ImportNamespaceSpecifier") {
          importRequests.push({
            specifier: statement.source.value,
            kind: "namespace",
            imported: "*"
          });
        } else if (specifier.type === "ImportDefaultSpecifier") {
          importRequests.push({
            specifier: statement.source.value,
            kind: "binding",
            imported: "default"
          });
        } else {
          importRequests.push({
            specifier: statement.source.value,
            kind: "binding",
            imported: specifier.imported.name ?? specifier.imported.value
          });
        }
      }
    } else if (
      (statement.type === "ExportNamedDeclaration" ||
        statement.type === "ExportAllDeclaration") &&
      statement.source
    ) {
      imports.push(statement.source.value);
    }
    if (statement.type === "ExportDefaultDeclaration") {
      declaredExports.add("default");
      directExports.add("default");
    } else if (statement.type === "ExportNamedDeclaration") {
      if (statement.declaration?.type === "FunctionDeclaration" ||
          statement.declaration?.type === "ClassDeclaration") {
        if (statement.declaration.id) {
          declaredExports.add(statement.declaration.id.name);
          directExports.add(statement.declaration.id.name);
        }
      } else if (statement.declaration?.type === "VariableDeclaration") {
        const names = new Set();
        for (const declaration of statement.declaration.declarations) {
          exportedNamesFromPattern(declaration.id, names);
        }
        for (const name of names) {
          declaredExports.add(name);
          directExports.add(name);
        }
      }
      for (const specifier of statement.specifiers) {
        const exported = specifier.exported.name ?? specifier.exported.value;
        declaredExports.add(exported);
        if (statement.source) {
          forwardedExports.set(exported, {
            specifier: statement.source.value,
            imported: specifier.local.name ?? specifier.local.value
          });
          importRequests.push({
            specifier: statement.source.value,
            kind: "binding",
            imported: specifier.local.name ?? specifier.local.value
          });
        } else {
          const local = specifier.local.name ?? specifier.local.value;
          const imported = importedBindings.get(local);
          if (imported?.kind === "binding") {
            forwardedExports.set(exported, {
              specifier: imported.specifier,
              imported: imported.imported
            });
          } else {
            directExports.add(exported);
          }
        }
      }
    } else if (statement.type === "ExportAllDeclaration" && statement.exported) {
      const exported = statement.exported.name ?? statement.exported.value;
      declaredExports.add(exported);
      directExports.add(exported);
    } else if (statement.type === "ExportAllDeclaration") {
      starExportSpecifiers.push(statement.source.value);
    }
  }

  const directlyExportedFunctions = new Set();
  for (const statement of ast.body) {
    if (statement.type !== "ExportNamedDeclaration" || statement.source) continue;
    if (statement.declaration?.type === "FunctionDeclaration" && statement.declaration.id) {
      directlyExportedFunctions.add(statement.declaration.id.name);
    }
    for (const specifier of statement.specifiers) {
      const local = specifier.local.name ?? specifier.local.value;
      const exported = specifier.exported.name ?? specifier.exported.value;
      if (functionBindings.has(local)) directlyExportedFunctions.add(exported);
    }
  }

  return {
    imports: [...new Set(imports)].sort(compareUtf8),
    declaredExports: [...declaredExports].sort(compareUtf8),
    directExports,
    directlyExportedFunctions,
    forwardedExports,
    starExportSpecifiers,
    importRequests
  };
}

function resolveModuleSpecifier(importerPath, specifier) {
  if (
    typeof specifier !== "string" ||
    (!specifier.startsWith("./") && !specifier.startsWith("../")) ||
    specifier.includes("\\") ||
    specifier.includes("\0") ||
    specifier.includes("?") ||
    specifier.includes("#") ||
    !specifier.endsWith(".mjs")
  ) {
    fail("EXTERNAL_IMPORT", `${importerPath} imports disallowed specifier ${String(specifier)}`);
  }
  const resolved = path.posix.normalize(
    path.posix.join(path.posix.dirname(importerPath), specifier)
  );
  if (resolved === ".." || resolved.startsWith("../") || path.posix.isAbsolute(resolved)) {
    fail("PATH_ESCAPE", `${importerPath} import escapes the schema root: ${specifier}`);
  }
  assertSafeRelativePath(resolved, "PATH_ESCAPE", "resolved validator import");
  return resolved;
}

function resourceKey(resource) {
  return `${resource.apiVersion}\0${resource.kind}`;
}

function bindingEqual(left, right) {
  return (
    left.apiVersion === right.apiVersion &&
    left.kind === right.kind &&
    left.schemaId === right.schemaId &&
    left.semanticValidatorPath === right.semanticValidatorPath &&
    left.semanticValidatorExport === right.semanticValidatorExport
  );
}

async function buildClosureFromRoot(sourceRoot, rootList) {
  const catalogBytes = await secureRead(sourceRoot, rootList.catalogPath, {
    label: "schema catalog"
  });
  const catalogValue = parseJsonBytes(catalogBytes, "schema catalog");
  const catalog = validateCatalog(catalogValue);
  const catalogResourcesByKey = new Map(
    catalogValue.resources.map((resource) => [resourceKey(resource), resource])
  );

  const resources = [];
  for (const root of rootList.roots) {
    const schemaEntry = catalog.byId.get(root.schemaId);
    if (!schemaEntry || schemaEntry.role !== "resource") {
      fail("ROOT_BINDING_MISMATCH", `${root.kind} root schema is absent or not a resource`);
    }
    const catalogResource = catalogResourcesByKey.get(resourceKey(root));
    if (!catalogResource || catalogResource.schemaId !== root.schemaId) {
      fail("ROOT_BINDING_MISMATCH", `${root.kind} catalog resource binding differs from roots.json`);
    }
    resources.push({
      apiVersion: root.apiVersion,
      kind: root.kind,
      schemaId: root.schemaId,
      semanticValidatorPath: catalogResource.semanticValidator,
      semanticValidatorExport: root.semanticValidatorExport
    });
  }
  resources.sort(compareFields("apiVersion", "kind", "schemaId"));

  const schemaStates = new Map();
  const pendingReferences = [];
  const queue = resources.map((resource) => resource.schemaId);
  const queued = new Set(queue);
  while (queue.length > 0) {
    if (schemaStates.size >= MAX_CLOSURE_MEMBERS) {
      fail("BUDGET_EXCEEDED", "schema closure exceeds its member budget");
    }
    const schemaId = queue.shift();
    const entry = catalog.byId.get(schemaId);
    if (!entry) fail("UNRESOLVED_REFERENCE", `schema ${schemaId} is absent from catalog`);
    const bytes = await secureRead(sourceRoot, entry.path, {
      label: `schema ${schemaId}`
    });
    const document = parseJsonBytes(bytes, `schema ${schemaId}`);
    if (document?.$id !== schemaId) {
      fail(
        "INVALID_SCHEMA",
        `catalog ID ${schemaId} differs from ${entry.path} document ID ${String(document?.$id)}`
      );
    }
    const references = collectSchemaReferences(document);
    const refTargets = new Set();
    for (const reference of references) {
      const resolved = resolveSchemaReference(reference, entry, catalog);
      pendingReferences.push({
        sourceId: schemaId,
        pointer: reference.pointer,
        raw: reference.raw,
        targetId: resolved.targetId,
        fragment: resolved.fragment
      });
      if (resolved.external) refTargets.add(resolved.targetId);
      if (!schemaStates.has(resolved.targetId) && !queued.has(resolved.targetId)) {
        queue.push(resolved.targetId);
        queued.add(resolved.targetId);
      }
    }
    schemaStates.set(schemaId, {
      entry,
      bytes,
      document,
      refTargets: [...refTargets].sort(compareUtf8)
    });
  }

  for (const reference of pendingReferences) {
    const target = schemaStates.get(reference.targetId);
    if (!target) {
      fail("UNRESOLVED_REFERENCE", `${reference.sourceId} reference ${reference.raw} is outside closure`);
    }
    validateResolvedFragment(
      target.document,
      reference.fragment,
      `${reference.sourceId}${reference.pointer} -> ${reference.raw}`
    );
  }

  for (const resource of resources) {
    const rootDocument = schemaStates.get(resource.schemaId)?.document;
    if (
      rootDocument?.properties?.apiVersion?.const !== resource.apiVersion ||
      rootDocument?.properties?.kind?.const !== resource.kind
    ) {
      fail(
        "ROOT_BINDING_MISMATCH",
        `${resource.kind} schema does not select its catalog apiVersion/kind`
      );
    }
  }

  const schemas = [...schemaStates.values()]
    .map(({ entry, bytes, document, refTargets }) => ({
      id: entry.id,
      sourcePath: entry.path,
      snapshotPath: snapshotPathFor(entry.path),
      bytes: bytes.length,
      exactDigest: sha256Bytes(bytes),
      semanticDigest: sha256Value(document),
      mediaType: "application/schema+json",
      memberRole: entry.role,
      refTargets
    }))
    .sort(compareFields("sourcePath", "id"));

  const resourceBindingsByValidator = new Map();
  for (const resource of resources) {
    const existing = resourceBindingsByValidator.get(resource.semanticValidatorPath) ?? [];
    existing.push(resource);
    resourceBindingsByValidator.set(resource.semanticValidatorPath, existing);
  }
  const validatorStates = new Map();
  const validatorQueue = [...resourceBindingsByValidator.keys()].sort(compareUtf8);
  const validatorQueued = new Set(validatorQueue);
  while (validatorQueue.length > 0) {
    if (validatorStates.size >= MAX_CLOSURE_MEMBERS) {
      fail("BUDGET_EXCEEDED", "validator closure exceeds its member budget");
    }
    const sourcePath = validatorQueue.shift();
    const entryModule = resourceBindingsByValidator.has(sourcePath);
    const bytes = await secureRead(sourceRoot, sourcePath, {
      label: entryModule
        ? `semantic validator entry module ${sourcePath}`
        : `unresolved imported module ${sourcePath}`,
      missingCode: entryModule ? "SOURCE_UNAVAILABLE" : "UNRESOLVED_IMPORT"
    });
    const analysis = analyzeModule(bytes, sourcePath);
    const staticImports = [];
    for (const specifier of analysis.imports) {
      const resolved = resolveModuleSpecifier(sourcePath, specifier);
      staticImports.push({
        specifier,
        sourcePath: resolved,
        snapshotPath: snapshotPathFor(resolved)
      });
      if (!validatorStates.has(resolved) && !validatorQueued.has(resolved)) {
        validatorQueue.push(resolved);
        validatorQueue.sort(compareUtf8);
        validatorQueued.add(resolved);
      }
    }
    staticImports.sort(compareFields("specifier", "sourcePath", "snapshotPath"));
    validatorStates.set(sourcePath, { bytes, analysis, staticImports });
  }

  function resolveExportProviders(modulePath, exportName, active = new Set()) {
    const key = `${modulePath}\0${exportName}`;
    if (active.has(key)) return new Set();
    active.add(key);
    try {
      const state = validatorStates.get(modulePath);
      if (!state) return new Set();
      if (state.analysis.directExports.has(exportName)) {
        return new Set([key]);
      }
      const forward = state.analysis.forwardedExports.get(exportName);
      if (forward) {
        const targetPath = resolveModuleSpecifier(modulePath, forward.specifier);
        return resolveExportProviders(targetPath, forward.imported, active);
      }
      if (exportName === "default") return new Set();
      const providers = new Set();
      for (const specifier of state.analysis.starExportSpecifiers) {
        const targetPath = resolveModuleSpecifier(modulePath, specifier);
        for (const provider of resolveExportProviders(targetPath, exportName, active)) {
          providers.add(provider);
        }
      }
      return providers;
    } finally {
      active.delete(key);
    }
  }

  for (const [modulePath, state] of validatorStates) {
    for (const request of state.analysis.importRequests) {
      if (request.kind === "namespace") continue;
      const targetPath = resolveModuleSpecifier(modulePath, request.specifier);
      const providers = resolveExportProviders(targetPath, request.imported);
      if (providers.size !== 1) {
        fail(
          "UNRESOLVED_IMPORT",
          `${modulePath} imports unresolved or ambiguous binding ${request.imported} from ${request.specifier}`
        );
      }
    }
  }

  for (const resource of resources) {
    const providers = resolveExportProviders(
      resource.semanticValidatorPath,
      resource.semanticValidatorExport
    );
    const provider = providers.size === 1 ? [...providers][0] : null;
    const separator = provider?.lastIndexOf("\0") ?? -1;
    const providerPath = separator === -1 ? null : provider.slice(0, separator);
    const providerExport = separator === -1 ? null : provider.slice(separator + 1);
    if (
      providers.size !== 1 ||
      !validatorStates.get(providerPath)?.analysis.directlyExportedFunctions.has(providerExport)
    ) {
      fail(
        "VALIDATOR_BINDING_MISMATCH",
        `registered export binding ${resource.semanticValidatorExport} is missing or not a function in ${resource.semanticValidatorPath}`
      );
    }
  }

  const validators = [...validatorStates]
    .map(([sourcePath, state]) => {
      const bindings = (resourceBindingsByValidator.get(sourcePath) ?? [])
        .map((resource) => ({ ...resource }))
        .sort(compareFields("apiVersion", "kind", "schemaId"));
      return {
        sourcePath,
        snapshotPath: snapshotPathFor(sourcePath),
        bytes: state.bytes.length,
        exactDigest: sha256Bytes(state.bytes),
        mediaType: "text/javascript",
        memberRole: bindings.length > 0 ? "entry" : "support",
        declaredExports: state.analysis.declaredExports,
        staticImports: state.staticImports,
        resourceBindings: bindings
      };
    })
    .sort(compareFields("sourcePath"));

  const catalogMember = {
    sourcePath: rootList.catalogPath,
    snapshotPath: snapshotPathFor(rootList.catalogPath),
    bytes: catalogBytes.length,
    exactDigest: sha256Bytes(catalogBytes),
    semanticDigest: sha256Value(catalogValue),
    mediaType: "application/json"
  };
  const core = {
    $schema: CLOSURE_SCHEMA_ID,
    schemaVersion: "1.0.0",
    id: CLOSURE_ID,
    source: { ...SOURCE_ID },
    rootListDigest: sha256Value(rootList),
    catalog: catalogMember,
    resources,
    schemas,
    validators
  };
  const manifest = {
    ...core,
    closureDigest: sha256Value(core)
  };
  const members = new Map([[catalogMember.snapshotPath, catalogBytes]]);
  for (const member of schemas) {
    members.set(member.snapshotPath, schemaStates.get(member.id).bytes);
  }
  for (const member of validators) {
    members.set(member.snapshotPath, validatorStates.get(member.sourcePath).bytes);
  }
  if (members.size !== 1 + schemas.length + validators.length) {
    fail("SNAPSHOT_INVENTORY", "two closure members resolve to the same snapshot path");
  }
  return {
    manifest,
    schemas: schemas.map((member) => schemaStates.get(member.id).document),
    resources,
    members
  };
}

function validateManifestShape(manifest) {
  assertExactKeys(
    manifest,
    [
      "$schema",
      "schemaVersion",
      "id",
      "source",
      "rootListDigest",
      "catalog",
      "resources",
      "schemas",
      "validators",
      "closureDigest"
    ],
    "SNAPSHOT_DIRTY",
    "shared-schema closure manifest"
  );
  if (
    manifest.$schema !== CLOSURE_SCHEMA_ID ||
    manifest.schemaVersion !== "1.0.0" ||
    manifest.id !== CLOSURE_ID ||
    canonicalize(manifest.source) !== canonicalize(SOURCE_ID)
  ) {
    fail("SNAPSHOT_DIRTY", "shared-schema closure manifest identity is invalid");
  }
  assertDigest(manifest.rootListDigest, "SNAPSHOT_DIRTY", "manifest rootListDigest");
  assertDigest(manifest.closureDigest, "SNAPSHOT_DIRTY", "manifest closureDigest");
  if (
    !Array.isArray(manifest.resources) ||
    !Array.isArray(manifest.schemas) ||
    !Array.isArray(manifest.validators)
  ) {
    fail("SNAPSHOT_DIRTY", "shared-schema closure arrays are missing");
  }
}

async function readRootList(packageRoot) {
  const bytes = await secureRead(packageRoot, SHARED_SCHEMA_ROOTS_PATH, {
    label: "shared-schema roots"
  });
  return {
    bytes,
    value: validateRootList(parseJsonBytes(bytes, "shared-schema roots"))
  };
}

async function enumerateSnapshot(root, relativeRoot = SHARED_SCHEMA_SNAPSHOT_PREFIX) {
  const target = containedTarget(root, relativeRoot);
  const files = [];
  async function visit(directory, prefix) {
    let entries;
    try {
      entries = await readdir(directory, { withFileTypes: true });
    } catch (error) {
      fail("SNAPSHOT_MISSING", `snapshot directory is unavailable: ${error.code}`);
    }
    entries.sort((left, right) => compareUtf8(left.name, right.name));
    for (const entry of entries) {
      const relative = `${prefix}/${entry.name}`;
      const absolute = path.join(directory, entry.name);
      const observed = await lstat(absolute, { bigint: true });
      if (observed.isSymbolicLink()) fail("SYMLINK", `snapshot contains symlink ${relative}`);
      if (entry.isDirectory()) await visit(absolute, relative);
      else if (entry.isFile()) files.push(relative);
      else fail("NOT_REGULAR_FILE", `snapshot contains special member ${relative}`);
    }
  }
  await visit(target, relativeRoot);
  return files.sort(compareUtf8);
}

function sameMemberBytes(left, right) {
  if (left.size !== right.size) return false;
  for (const [memberPath, bytes] of left) {
    if (!right.has(memberPath) || !bytes.equals(right.get(memberPath))) return false;
  }
  return true;
}

function sameClosure(left, right) {
  return (
    canonicalize(left.manifest) === canonicalize(right.manifest) &&
    sameMemberBytes(left.members, right.members)
  );
}

async function observeStableClosure(root, rootList) {
  const first = await buildClosureFromRoot(root, rootList);
  const second = await buildClosureFromRoot(root, rootList);
  if (!sameClosure(first, second)) {
    fail("SOURCE_UNSTABLE", "closure bytes or membership changed between full observations");
  }
  return second;
}

async function readSnapshot(packageRoot, rootList) {
  let manifestBytes;
  try {
    manifestBytes = await secureRead(packageRoot, SHARED_SCHEMA_MANIFEST_PATH, {
      label: "shared-schema closure manifest",
      missingCode: "SNAPSHOT_MISSING"
    });
  } catch (error) {
    if (error instanceof SharedSchemaClosureError) throw error;
    fail("SNAPSHOT_MISSING", "shared-schema closure manifest is missing");
  }
  const manifest = parseJsonBytes(manifestBytes, "shared-schema closure manifest");
  validateManifestShape(manifest);
  if (!manifestBytes.equals(Buffer.from(prettyJson(manifest), "utf8"))) {
    fail("SNAPSHOT_DIRTY", "closure manifest bytes are not deterministic canonical JSON");
  }
  const snapshotRoot = await secureRoot(
    path.join(packageRoot.path, ...SHARED_SCHEMA_SNAPSHOT_PREFIX.split("/")),
    "shared-schema snapshot root"
  ).catch((error) => {
    if (error instanceof SharedSchemaClosureError && error.code === "SOURCE_UNAVAILABLE") {
      fail("SNAPSHOT_MISSING", error.message);
    }
    throw error;
  });
  let computed;
  try {
    computed = await observeStableClosure(snapshotRoot, rootList);
  } catch (error) {
    if (
      error instanceof SharedSchemaClosureError &&
      ["SOURCE_UNAVAILABLE", "UNRESOLVED_IMPORT"].includes(error.code)
    ) {
      fail("SNAPSHOT_MISSING", `declared snapshot member is missing: ${error.message}`);
    }
    throw error;
  }
  if (canonicalize(computed.manifest) !== canonicalize(manifest)) {
    fail("SNAPSHOT_DIRTY", "snapshot bytes do not reproduce closure.manifest.json");
  }
  const expectedInventory = [...computed.members.keys()].sort(compareUtf8);
  const actualInventory = await enumerateSnapshot(packageRoot);
  if (canonicalize(expectedInventory) !== canonicalize(actualInventory)) {
    fail("SNAPSHOT_INVENTORY", "snapshot filesystem inventory differs from the closed manifest");
  }
  const manifestAgain = await secureRead(packageRoot, SHARED_SCHEMA_MANIFEST_PATH, {
    label: "shared-schema closure manifest",
    missingCode: "SNAPSHOT_MISSING"
  });
  if (!manifestAgain.equals(manifestBytes)) {
    fail("SOURCE_UNSTABLE", "closure manifest changed during self-check");
  }
  return computed;
}

async function assertAuthorityParity(snapshot, authority) {
  if (canonicalize(snapshot.manifest) !== canonicalize(authority.manifest)) {
    fail("AUTHORITY_DRIFT", "snapshot manifest differs from the selected schema authority");
  }
  if (!sameMemberBytes(snapshot.members, authority.members)) {
    fail("AUTHORITY_DRIFT", "snapshot bytes differ from the selected schema authority");
  }
}

async function writeNewFile(target, bytes, mode = 0o644) {
  const handle = await open(
    target,
    constants.O_WRONLY |
      constants.O_CREAT |
      constants.O_EXCL |
      constants.O_NOFOLLOW,
    mode
  );
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function stageSnapshot(packageRoot, closure) {
  const containerPath = containedTarget(
    packageRoot,
    path.posix.dirname(SHARED_SCHEMA_SNAPSHOT_PREFIX)
  );
  const stagePath = path.join(containerPath, `.snapshot-stage-${randomUUID()}`);
  await mkdir(stagePath, { mode: 0o700 });
  try {
    for (const [snapshotPath, bytes] of [...closure.members].sort(([left], [right]) => compareUtf8(left, right))) {
      const memberRelative = path.posix.relative(SHARED_SCHEMA_SNAPSHOT_PREFIX, snapshotPath);
      assertSafeRelativePath(memberRelative);
      const memberTarget = path.join(stagePath, ...memberRelative.split("/"));
      await mkdir(path.dirname(memberTarget), { recursive: true, mode: 0o755 });
      await writeNewFile(memberTarget, bytes);
    }
    return stagePath;
  } catch (error) {
    await rm(stagePath, { recursive: true, force: true });
    throw error;
  }
}

async function prepareSnapshotPublication(packageRoot, closure, testHooks = undefined) {
  const stagePath = await stageSnapshot(packageRoot, closure);
  const finalSnapshot = containedTarget(packageRoot, SHARED_SCHEMA_SNAPSHOT_PREFIX);
  const snapshotBackup = `${finalSnapshot}.backup-${randomUUID()}`;
  const manifestTarget = containedTarget(packageRoot, SHARED_SCHEMA_MANIFEST_PATH);
  const manifestStage = path.join(
    path.dirname(manifestTarget),
    `.closure-manifest-stage-${randomUUID()}`
  );
  const manifestBackup = `${manifestTarget}.backup-${randomUUID()}`;
  let stagedSnapshotIdentity;
  let stagedManifestIdentity;
  try {
    await writeNewFile(manifestStage, Buffer.from(prettyJson(closure.manifest), "utf8"));
    stagedSnapshotIdentity = await lstat(stagePath, { bigint: true });
    stagedManifestIdentity = await lstat(manifestStage, { bigint: true });
  } catch (error) {
    await rm(stagePath, { recursive: true, force: true }).catch(() => {});
    await rm(manifestStage, { force: true }).catch(() => {});
    throw error;
  }

  let hadSnapshot = false;
  let hadManifest = false;
  let snapshotBackedUp = false;
  let manifestBackedUp = false;
  let snapshotPromoted = false;
  let manifestPromoted = false;
  let finalized = false;

  async function removePromoted(target, expected, recursive) {
    const observed = await lstat(target, { bigint: true }).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (!observed) return;
    if (observed.dev !== expected.dev || observed.ino !== expected.ino) {
      fail("SOURCE_UNSTABLE", `publication target identity changed before rollback: ${target}`);
    }
    await rm(target, { recursive, force: true });
  }

  async function rollback() {
    if (finalized) return;
    const failures = [];
    if (manifestPromoted) {
      await removePromoted(manifestTarget, stagedManifestIdentity, false).catch((error) => {
        failures.push(error);
      });
      manifestPromoted = false;
    }
    if (snapshotPromoted) {
      await removePromoted(finalSnapshot, stagedSnapshotIdentity, true).catch((error) => {
        failures.push(error);
      });
      snapshotPromoted = false;
    }
    if (snapshotBackedUp) {
      await rename(snapshotBackup, finalSnapshot).catch((error) => failures.push(error));
      snapshotBackedUp = false;
    } else if (!hadSnapshot) {
      await rm(finalSnapshot, { recursive: true, force: true }).catch((error) => failures.push(error));
    }
    if (manifestBackedUp) {
      await rename(manifestBackup, manifestTarget).catch((error) => failures.push(error));
      manifestBackedUp = false;
    } else if (!hadManifest) {
      await rm(manifestTarget, { force: true }).catch((error) => failures.push(error));
    }
    await rm(stagePath, { recursive: true, force: true }).catch((error) => failures.push(error));
    await rm(manifestStage, { force: true }).catch((error) => failures.push(error));
    await rm(snapshotBackup, { recursive: true, force: true }).catch((error) => failures.push(error));
    await rm(manifestBackup, { force: true }).catch((error) => failures.push(error));
    finalized = true;
    if (failures.length > 0) {
      fail(
        "SOURCE_UNSTABLE",
        `failed to restore the exact pre-refresh state: ${failures.map((error) => error.message).join("; ")}`
      );
    }
  }

  async function commit() {
    if (finalized) return;
    // The caller invokes commit only after the promoted snapshot and manifest
    // pass complete self and authority parity checks. Cross the irreversible
    // boundary before deleting either backup: cleanup failure must preserve
    // the verified new state, never attempt rollback from half-deleted backup.
    finalized = true;
    const failures = [];
    if (snapshotBackedUp) {
      await rm(snapshotBackup, { recursive: true, force: true }).catch((error) => {
        failures.push(error);
      });
      snapshotBackedUp = false;
    }
    if (manifestBackedUp) {
      await rm(manifestBackup, { force: true }).catch((error) => {
        failures.push(error);
      });
      manifestBackedUp = false;
    }
    await rm(stagePath, { recursive: true, force: true }).catch((error) => {
      failures.push(error);
    });
    await rm(manifestStage, { force: true }).catch((error) => {
      failures.push(error);
    });
    if (failures.length > 0) {
      fail(
        "SOURCE_UNSTABLE",
        `verified refresh committed but residue cleanup failed: ${failures.map((error) => error.message).join("; ")}`
      );
    }
  }

  try {
    const existing = await lstat(finalSnapshot, { bigint: true }).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (existing) {
      hadSnapshot = true;
      if (existing.isSymbolicLink()) fail("SYMLINK", "existing snapshot root is a symlink");
      if (!existing.isDirectory()) {
        fail("NOT_REGULAR_FILE", "existing snapshot root is not a directory");
      }
    }
    const existingManifest = await lstat(manifestTarget, { bigint: true }).catch((error) => {
      if (error.code === "ENOENT") return null;
      throw error;
    });
    if (existingManifest) {
      hadManifest = true;
      if (existingManifest.isSymbolicLink()) {
        fail("SYMLINK", "existing closure manifest is a symlink");
      }
      if (!existingManifest.isFile()) {
        fail("NOT_REGULAR_FILE", "existing closure manifest is not a regular file");
      }
    }
    if (hadSnapshot) {
      await rename(finalSnapshot, snapshotBackup);
      snapshotBackedUp = true;
    }
    if (hadManifest) {
      await rename(manifestTarget, manifestBackup);
      manifestBackedUp = true;
    }
    await rename(stagePath, finalSnapshot);
    snapshotPromoted = true;
    if (testHooks?.afterSnapshotSwapBeforeManifestCommit !== undefined) {
      if (typeof testHooks.afterSnapshotSwapBeforeManifestCommit !== "function") {
        fail("USAGE", "afterSnapshotSwapBeforeManifestCommit test hook must be a function");
      }
      try {
        await testHooks.afterSnapshotSwapBeforeManifestCommit();
      } catch (error) {
        fail(
          "SOURCE_UNSTABLE",
          `refresh publication interrupted after snapshot swap: ${error.message}`
        );
      }
    }
    await rename(manifestStage, manifestTarget);
    manifestPromoted = true;
  } catch (error) {
    try {
      await rollback();
    } catch (rollbackError) {
      throw rollbackError;
    }
    throw error;
  }
  return { commit, rollback };
}

function publicResult(closure) {
  return {
    manifest: closure.manifest,
    schemas: closure.schemas,
    resources: closure.resources
  };
}

/**
 * Replace the sovereign snapshot from one explicit schema authority.
 * No ambient sibling path is ever inferred.
 */
export async function refreshSharedSchemaSnapshot({
  packageRoot,
  authorityRoot,
  testHooks = undefined
} = {}) {
  if (!authorityRoot) {
    fail("USAGE", "refreshSharedSchemaSnapshot requires authorityRoot");
  }
  if (testHooks !== undefined) {
    assertExactKeys(
      testHooks,
      ["afterSnapshotSwapBeforeManifestCommit"],
      "USAGE",
      "refresh test hooks"
    );
  }
  const packageBoundary = await secureRoot(packageRoot, "Survey-v2 package root");
  const authorityBoundary = await secureRoot(authorityRoot, "shared-schema authority root");
  const rootsBefore = await readRootList(packageBoundary);
  const authority = await observeStableClosure(authorityBoundary, rootsBefore.value);
  const rootsAfter = await readRootList(packageBoundary);
  if (!rootsBefore.bytes.equals(rootsAfter.bytes)) {
    fail("SOURCE_UNSTABLE", "shared-schema roots changed during refresh");
  }
  const publication = await prepareSnapshotPublication(
    packageBoundary,
    authority,
    testHooks
  );
  try {
    const checked = await checkSharedSchemaSnapshot({
      packageRoot: packageBoundary.path,
      authorityRoot: authorityBoundary.path
    });
    await publication.commit();
    return checked;
  } catch (error) {
    try {
      await publication.rollback();
    } catch (rollbackError) {
      throw rollbackError;
    }
    throw error;
  }
}

/**
 * Verify the snapshot without mutation. authorityRoot is optional so a clean
 * relocated package can check itself with no parent or sibling repository.
 */
export async function checkSharedSchemaSnapshot({ packageRoot, authorityRoot } = {}) {
  const packageBoundary = await secureRoot(packageRoot, "Survey-v2 package root");
  const rootsBefore = await readRootList(packageBoundary);
  const snapshot = await readSnapshot(packageBoundary, rootsBefore.value);
  const rootsAfter = await readRootList(packageBoundary);
  if (!rootsBefore.bytes.equals(rootsAfter.bytes)) {
    fail("SOURCE_UNSTABLE", "shared-schema roots changed during check");
  }
  if (authorityRoot !== undefined) {
    const authorityBoundary = await secureRoot(
      authorityRoot,
      "shared-schema authority root"
    );
    const authority = await observeStableClosure(authorityBoundary, rootsBefore.value);
    await assertAuthorityParity(snapshot, authority);
  }
  return publicResult(snapshot);
}

/**
 * Load is deliberately a checked, source-free snapshot operation.
 */
export async function loadSharedSchemaSnapshot({ packageRoot } = {}) {
  return checkSharedSchemaSnapshot({ packageRoot });
}

/**
 * Render the only runtime bridge between compiled structural validators and
 * snapshotted semantic entry modules. Every import is static and package-local.
 */
export function renderSharedSemanticValidatorRegistry(result) {
  if (!result?.manifest || !Array.isArray(result.resources)) {
    fail("SNAPSHOT_DIRTY", "semantic registry renderer requires a checked closure result");
  }
  const validatorsByBinding = new Map();
  for (const validator of result.manifest.validators) {
    for (const binding of validator.resourceBindings) {
      const key = resourceKey(binding);
      if (validatorsByBinding.has(key)) {
        fail("DUPLICATE_RESOURCE_BINDING", `duplicate semantic registry binding ${key}`);
      }
      validatorsByBinding.set(key, validator);
    }
  }

  const resources = [...result.resources].sort(compareFields("apiVersion", "kind", "schemaId"));
  const imports = [];
  const records = [];
  for (const [index, resource] of resources.entries()) {
    const validator = validatorsByBinding.get(resourceKey(resource));
    if (!validator) {
      fail(
        "VALIDATOR_BINDING_MISMATCH",
        `manifest has no semantic validator member for ${resource.apiVersion}/${resource.kind}`
      );
    }
    const binding = validator.resourceBindings.find((candidate) => bindingEqual(candidate, resource));
    if (!binding) {
      fail("VALIDATOR_BINDING_MISMATCH", `semantic validator binding differs for ${resource.kind}`);
    }
    const localName = `semantic_${String(index).padStart(2, "0")}`;
    const importPath = `../${validator.snapshotPath}`;
    if (!importPath.startsWith("../dependencies/shared-schemas/v1/snapshot/")) {
      fail("PATH_ESCAPE", `generated semantic validator import escapes snapshot: ${importPath}`);
    }
    imports.push(
      `import { ${resource.semanticValidatorExport} as ${localName} } from ${JSON.stringify(importPath)};`
    );
    records.push(
      `  Object.freeze({ apiVersion: ${JSON.stringify(resource.apiVersion)}, kind: ${JSON.stringify(resource.kind)}, schemaId: ${JSON.stringify(resource.schemaId)}, semanticValidatorExport: ${JSON.stringify(resource.semanticValidatorExport)}, validateSemantics: ${localName} })`
    );
  }

  return [
    "/* GENERATED FILE. Refresh the shared-schema snapshot and run ./compile.sh. */",
    'import { validateById } from "./validators.mjs";',
    ...imports,
    "",
    "const bindings = Object.freeze([",
    records.join(",\n"),
    "]);",
    "const bindingsByKey = new Map(bindings.map((binding) => [`${binding.apiVersion}\\0${binding.kind}`, binding]));",
    "",
    "export function sharedResourceBinding(apiVersion, kind) {",
    "  const binding = bindingsByKey.get(`${apiVersion}\\0${kind}`);",
    "  if (!binding) return null;",
    "  return Object.freeze({",
    "    apiVersion: binding.apiVersion,",
    "    kind: binding.kind,",
    "    schemaId: binding.schemaId,",
    "    semanticValidatorExport: binding.semanticValidatorExport",
    "  });",
    "}",
    "",
    "export function validateSharedResource(apiVersion, kind, value) {",
    "  const binding = bindingsByKey.get(`${apiVersion}\\0${kind}`);",
    "  if (!binding) {",
    "    return {",
    "      valid: false,",
    "      schemaId: null,",
    "      structuralErrors: [`unknown shared resource binding ${apiVersion}/${kind}`],",
    "      semanticIssues: []",
    "    };",
    "  }",
    "  const structural = validateById(binding.schemaId, value);",
    "  const structuralErrors = structural.valid ? [] : [...structural.errors];",
    "  const semanticIssues = structural.valid ? binding.validateSemantics(value) : [];",
    "  return {",
    "    valid: structural.valid && semanticIssues.length === 0,",
    "    schemaId: binding.schemaId,",
    "    structuralErrors,",
    "    semanticIssues",
    "  };",
    "}",
    ""
  ].join("\n");
}

function parseCli(argv) {
  const [command, ...rest] = argv;
  if (!["refresh", "check"].includes(command)) {
    fail("USAGE", "usage: ./shared-schemas.sh <refresh|check> [--source <schemas-root>]");
  }
  let authorityRoot;
  for (let index = 0; index < rest.length; index += 1) {
    if (rest[index] !== "--source" || authorityRoot !== undefined || index + 1 >= rest.length) {
      fail("USAGE", "usage: ./shared-schemas.sh <refresh|check> [--source <schemas-root>]");
    }
    authorityRoot = rest[index + 1];
    index += 1;
  }
  if (command === "refresh" && authorityRoot === undefined) {
    fail("USAGE", "refresh requires explicit --source <schemas-root>");
  }
  return { command, authorityRoot };
}

async function cliMain() {
  const { command, authorityRoot } = parseCli(process.argv.slice(2));
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
  const result = command === "refresh"
    ? await refreshSharedSchemaSnapshot({ packageRoot, authorityRoot })
    : await checkSharedSchemaSnapshot({ packageRoot, authorityRoot });
  process.stdout.write(
    `[survey-v2] shared schemas ${command} PASS: ${result.schemas.length} schemas, ` +
      `${result.manifest.validators.length} validator modules, ${result.resources.length} roots\n`
  );
  process.stdout.write(`[survey-v2] closure digest ${result.manifest.closureDigest}\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
if (invokedPath === fileURLToPath(import.meta.url)) {
  cliMain().catch((error) => {
    const code = error instanceof SharedSchemaClosureError ? ` ${error.code}` : "";
    process.stderr.write(`[survey-v2] shared schemas FAIL${code}: ${error.message}\n`);
    process.exit(error instanceof SharedSchemaClosureError && error.code === "USAGE" ? 64 : 1);
  });
}
