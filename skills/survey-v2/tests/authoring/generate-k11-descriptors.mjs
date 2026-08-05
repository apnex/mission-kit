#!/usr/bin/env node
import {
  readFile,
  readdir,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { k11Suite } from "./k11-suite-definition.mjs";

const authoringTestRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(authoringTestRoot, "../..");
const k11Directories = Object.freeze([
  "tests/authoring/assignment-dag",
  "tests/authoring/text-forms"
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
      (part) => part === "" || part === "." || part === ".."
    )
  ) {
    fail(`unsafe K11 package path: ${String(relativePath)}`);
  }
  const target = path.resolve(packageRoot, ...relativePath.split("/"));
  const relative = path.relative(packageRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`K11 package path escapes the package root: ${relativePath}`);
  }
  return target;
}

function assertCanonicalPaths(values, label, { nonEmpty = false } = {}) {
  if (
    !Array.isArray(values) ||
    (nonEmpty && values.length === 0) ||
    values.some((value) => typeof value !== "string")
  ) {
    fail(`${label} must be ${nonEmpty ? "a non-empty" : "an"} array of paths`);
  }
  if (new Set(values).size !== values.length) {
    fail(`${label} contains duplicate paths`);
  }
  const ordered = [...values].sort(compareUtf8);
  if (JSON.stringify(values) !== JSON.stringify(ordered)) {
    fail(`${label} is not in canonical UTF-8 byte order`);
  }
  for (const value of values) packagePath(value);
}

async function discoverK11Executables() {
  async function discover(directory) {
    const found = [];
    const entries = await readdir(packagePath(directory), {
      withFileTypes: true
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

  const found = [];
  for (const directory of k11Directories) {
    found.push(...await discover(directory));
  }
  return found.sort(compareUtf8);
}

function literalTestTitle(source, executable) {
  const matches = [
    ...source.matchAll(/(?:^|\n)test\s*\(\s*"([^"\n]+)"\s*,/g)
  ];
  if (matches.length !== 1) {
    fail(
      `${executable} must contain exactly one literal-named top-level test(), ` +
      `got ${matches.length}`
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

function descriptorFor(item) {
  return {
    $schema: "urn:mission-kit:survey-v2:schema:test-evidence:v2",
    schemaVersion: "2.0.0",
    id: descriptorId(item.executable),
    obligationId: item.obligationId,
    requirementIds: [],
    invariantIds: [item.invariantId],
    verification: {
      precondition:
        "The mapped K11 authorities and fixtures exist as package-owned files.",
      stimulus: `Execute ${item.executable} with node:test.`,
      expectedSemanticState:
        `No durable authoring runtime state transition is claimed by ${item.obligationId}.`,
      expectedEvidenceState:
        `The test runner reports the literal assertion: ${item.statement}`,
      forbiddenMutation:
        "Do not infer runtime dispatch, persistence, journaling, atomic commit, adapter parity, transport behavior, or cold-resume behavior beyond the literal assertion.",
      applicability: {
        mode: "not-applicable",
        transports: [],
        adapters: []
      },
      inspectedAuthorities: [...item.authorities]
    },
    behavior: item.statement,
    evidenceClass: item.evidenceClass,
    runner: "node:test",
    executable: item.executable,
    fixtures: [...item.fixtures],
    prerequisites: [],
    resultSchema: "urn:mission-kit:survey-v2:test-result:v2"
  };
}

const catalogExecutables = k11Suite.map((item) => item.executable);
if (new Set(catalogExecutables).size !== catalogExecutables.length) {
  fail("K11 suite catalog contains a duplicate executable");
}
const obligationIds = k11Suite.map((item) => item.obligationId);
if (new Set(obligationIds).size !== obligationIds.length) {
  fail("K11 suite catalog contains a duplicate obligation");
}

const discoveredExecutables = await discoverK11Executables();
const expectedExecutables = [...catalogExecutables].sort(compareUtf8);
if (
  JSON.stringify(discoveredExecutables) !==
  JSON.stringify(expectedExecutables)
) {
  const discovered = new Set(discoveredExecutables);
  const expected = new Set(expectedExecutables);
  const uncatalogued = discoveredExecutables.filter(
    (executable) => !expected.has(executable)
  );
  const missing = expectedExecutables.filter(
    (executable) => !discovered.has(executable)
  );
  fail(
    "K11 catalog/test inventory diverges: " +
    `uncatalogued=${JSON.stringify(uncatalogued)} ` +
    `missing=${JSON.stringify(missing)}`
  );
}

const pendingWrites = [];
for (const item of k11Suite) {
  if (
    item.obligationId.split("-")[1] !== item.invariantId ||
    !/^O-AS(?:04|05|06|07|08)-[0-9]{2}$/.test(item.obligationId)
  ) {
    fail(
      `${item.executable} has inconsistent invariant/obligation ownership`
    );
  }
  assertCanonicalPaths(
    item.authorities,
    `${item.executable} authorities`,
    { nonEmpty: true }
  );
  assertCanonicalPaths(item.fixtures, `${item.executable} fixtures`);
  const source = await readFile(packagePath(item.executable), "utf8");
  const title = literalTestTitle(source, item.executable);
  if (title !== item.statement) {
    fail(
      `${item.executable} literal title diverges from its catalog statement: ` +
      `${JSON.stringify(title)} !== ${JSON.stringify(item.statement)}`
    );
  }
  for (const ownedInput of [...item.authorities, ...item.fixtures]) {
    await readFile(packagePath(ownedInput));
  }
  const descriptorPath = item.executable.replace(/\.test\.mjs$/u, ".test.json");
  pendingWrites.push([
    packagePath(descriptorPath),
    `${JSON.stringify(descriptorFor(item), null, 2)}\n`
  ]);
}

await Promise.all(
  pendingWrites.map(([target, content]) => writeFile(target, content, "utf8"))
);
