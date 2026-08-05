#!/usr/bin/env node
import {
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { s11Suite } from "./s11-suite-definition.mjs";

const authoringRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(authoringRoot, "../..");
const testRoots = Object.freeze([
  "tests/authoring/request-input-bindings",
  "tests/authoring/staged-authority",
]);

function compareUtf8(left, right) {
  return Buffer.compare(
    Buffer.from(left, "utf8"),
    Buffer.from(right, "utf8"),
  );
}

function fail(message) {
  throw new Error(message);
}

function packagePath(relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    path.posix.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath.includes("\0") ||
    relativePath.split("/").some(
      (part) => part === "" || part === "." || part === "..",
    )
  ) {
    fail(`unsafe S11 package path: ${String(relativePath)}`);
  }
  const target = path.resolve(
    packageRoot,
    ...relativePath.split("/"),
  );
  const relative = path.relative(packageRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`S11 path escapes package root: ${relativePath}`);
  }
  return target;
}

function assertCanonicalPaths(values, label) {
  if (
    !Array.isArray(values) ||
    new Set(values).size !== values.length ||
    JSON.stringify(values) !==
      JSON.stringify([...values].sort(compareUtf8))
  ) {
    fail(`${label} is not one canonical unique path array`);
  }
  values.forEach(packagePath);
}

function literalTestTitle(source, executable) {
  const matches = [
    ...source.matchAll(
      /(?:^|\n)test\s*\(\s*"([^"\n]+)"\s*,/gu,
    ),
  ];
  if (matches.length !== 1) {
    fail(
      `${executable} must contain exactly one literal-named top-level test(), got ${matches.length}`,
    );
  }
  return matches[0][1];
}

function descriptorId(executable) {
  const suffix = executable
    .slice("tests/".length, -".test.mjs".length)
    .split("/")
    .join(":");
  return `urn:mission-kit:survey-v2:test:${suffix}`;
}

const discovered = (
  await Promise.all(testRoots.map(async (testRoot) =>
    (await readdir(packagePath(testRoot), {
      withFileTypes: true,
    }))
      .filter(
        (entry) =>
          entry.isFile() && entry.name.endsWith(".test.mjs"),
      )
      .map((entry) => `${testRoot}/${entry.name}`)))
).flat().sort(compareUtf8);
const catalog = s11Suite
  .map(({ executable }) => executable)
  .sort(compareUtf8);
if (JSON.stringify(discovered) !== JSON.stringify(catalog)) {
  fail(
    `S11 catalog/test inventory diverges: discovered=${JSON.stringify(discovered)} catalog=${JSON.stringify(catalog)}`,
  );
}
if (
  new Set(s11Suite.map(({ obligationId }) => obligationId))
    .size !== s11Suite.length
) {
  fail("S11 suite contains a duplicate obligation");
}

for (const item of s11Suite) {
  assertCanonicalPaths(
    item.authorities,
    `${item.executable} authorities`,
  );
  assertCanonicalPaths(
    item.fixtures,
    `${item.executable} fixtures`,
  );
  await Promise.all(
    [...item.authorities, ...item.fixtures].map(
      (relativePath) => readFile(packagePath(relativePath)),
    ),
  );
  const source = await readFile(
    packagePath(item.executable),
    "utf8",
  );
  const statement = literalTestTitle(
    source,
    item.executable,
  );
  const descriptor = {
    $schema: "urn:mission-kit:survey-v2:schema:test-evidence:v2",
    schemaVersion: "2.0.0",
    id: descriptorId(item.executable),
    obligationId: item.obligationId,
    requirementIds: [],
    invariantIds: [item.invariantId],
    verification: {
      precondition:
        "The neutral S11 profile authorities and immutable fixtures exist as package-owned files.",
      stimulus:
        `Execute ${item.executable} with node:test.`,
      expectedSemanticState:
        `Only the semantic-state effect asserted by ${item.obligationId} may occur.`,
      expectedEvidenceState:
        `The test runner reports the literal assertion: ${statement}`,
      forbiddenMutation:
        "Do not infer Survey semantics, storage writes, adapter behavior, transport behavior, or authority beyond the literal assertion.",
      applicability: item.applicability,
      inspectedAuthorities: [...item.authorities],
    },
    behavior: statement,
    evidenceClass: item.evidenceClass,
    runner: "node:test",
    executable: item.executable,
    fixtures: [...item.fixtures],
    prerequisites: [],
    resultSchema: "urn:mission-kit:survey-v2:test-result:v2",
  };
  await writeFile(
    packagePath(
      item.executable.replace(/\.test\.mjs$/u, ".test.json"),
    ),
    `${JSON.stringify(descriptor, null, 2)}\n`,
    "utf8",
  );
}
