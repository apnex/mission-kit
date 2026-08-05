#!/usr/bin/env node
import {
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { k12Suite } from "./k12-suite-definition.mjs";

const authoringTestRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(authoringTestRoot, "../..");
const k12Directories = Object.freeze([
  "tests/authoring/context-resolution",
  "tests/authoring/mutation-planning",
  "tests/authoring/reducer",
]);

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
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
    fail(`unsafe K12 package path: ${String(relativePath)}`);
  }
  const target = path.resolve(packageRoot, ...relativePath.split("/"));
  const relative = path.relative(packageRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`K12 package path escapes the package root: ${relativePath}`);
  }
  return target;
}

function assertCanonicalPaths(values, label, { nonEmpty = false } = {}) {
  if (
    !Array.isArray(values) ||
    (nonEmpty && values.length === 0) ||
    values.some((value) => typeof value !== "string")
  ) {
    fail(`${label} is not one canonical path array`);
  }
  if (new Set(values).size !== values.length) {
    fail(`${label} contains duplicate paths`);
  }
  if (
    JSON.stringify(values) !==
    JSON.stringify([...values].sort(compareUtf8))
  ) {
    fail(`${label} is not in canonical UTF-8 byte order`);
  }
  values.forEach(packagePath);
}

async function discover(directory) {
  const found = [];
  const entries = await readdir(packagePath(directory), {
    withFileTypes: true,
  });
  entries.sort((left, right) => compareUtf8(left.name, right.name));
  for (const entry of entries) {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      found.push(...await discover(relative));
    } else if (entry.isFile() && entry.name.endsWith(".test.mjs")) {
      found.push(relative);
    }
  }
  return found;
}

function literalTestTitle(source, executable) {
  const matches = [
    ...source.matchAll(/(?:^|\n)test\s*\(\s*"([^"\n]+)"\s*,/gu),
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

function descriptorFor(item, statement) {
  return {
    $schema: "urn:mission-kit:survey-v2:schema:test-evidence:v2",
    schemaVersion: "2.0.0",
    id: descriptorId(item.executable),
    obligationId: item.obligationId,
    requirementIds: [],
    invariantIds: [item.invariantId],
    verification: {
      precondition:
        "The mapped K12 authorities and immutable fixtures exist as package-owned files.",
      stimulus: `Execute ${item.executable} with node:test.`,
      expectedSemanticState:
        `No durable authoring runtime state transition is claimed by ${item.obligationId}.`,
      expectedEvidenceState:
        `The test runner reports the literal assertion: ${statement}`,
      forbiddenMutation:
        "Do not infer persistence, locking, commit authority, journaling, adapter parity, transport behavior, Survey semantics, or cold-resume behavior beyond the literal assertion.",
      applicability: {
        mode: "not-applicable",
        transports: [],
        adapters: [],
      },
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
}

const catalogExecutables = k12Suite.map((item) => item.executable);
if (new Set(catalogExecutables).size !== catalogExecutables.length) {
  fail("K12 suite catalog contains a duplicate executable");
}
const obligationIds = k12Suite.map((item) => item.obligationId);
if (new Set(obligationIds).size !== obligationIds.length) {
  fail("K12 suite catalog contains a duplicate obligation");
}

const discoveredExecutables = (
  await Promise.all(k12Directories.map(discover))
).flat().sort(compareUtf8);
const expectedExecutables = [...catalogExecutables].sort(compareUtf8);
if (
  JSON.stringify(discoveredExecutables) !==
  JSON.stringify(expectedExecutables)
) {
  const discovered = new Set(discoveredExecutables);
  const expected = new Set(expectedExecutables);
  fail(
    "K12 catalog/test inventory diverges: " +
    `uncatalogued=${JSON.stringify(
      discoveredExecutables.filter((item) => !expected.has(item)),
    )} missing=${JSON.stringify(
      expectedExecutables.filter((item) => !discovered.has(item)),
    )}`,
  );
}

const pendingWrites = [];
for (const item of k12Suite) {
  assertCanonicalPaths(
    item.authorities,
    `${item.executable} authorities`,
    { nonEmpty: true },
  );
  assertCanonicalPaths(item.fixtures, `${item.executable} fixtures`);
  for (const ownedInput of [...item.authorities, ...item.fixtures]) {
    await readFile(packagePath(ownedInput));
  }
  const source = await readFile(packagePath(item.executable), "utf8");
  const statement = literalTestTitle(source, item.executable);
  pendingWrites.push([
    packagePath(item.executable.replace(/\.test\.mjs$/u, ".test.json")),
    `${JSON.stringify(descriptorFor(item, statement), null, 2)}\n`,
  ]);
}

await Promise.all(
  pendingWrites.map(([target, content]) =>
    writeFile(target, content, "utf8")),
);
