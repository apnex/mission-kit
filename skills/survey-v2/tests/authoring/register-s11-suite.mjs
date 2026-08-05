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
    fail(`unsafe S11 registration path: ${String(relativePath)}`);
  }
  const target = path.resolve(
    packageRoot,
    ...relativePath.split("/"),
  );
  const relative = path.relative(packageRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`S11 registration path escapes package root: ${relativePath}`);
  }
  return target;
}

async function readJson(relativePath) {
  return JSON.parse(
    await readFile(packagePath(relativePath), "utf8"),
  );
}

async function writeJson(relativePath, value) {
  await writeFile(
    packagePath(relativePath),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

async function discover(relativeDirectory) {
  const found = [];
  const entries = await readdir(
    packagePath(relativeDirectory),
    { withFileTypes: true },
  );
  entries.sort((left, right) =>
    compareUtf8(left.name, right.name));
  for (const entry of entries) {
    const relative = `${relativeDirectory}/${entry.name}`;
    if (entry.isDirectory()) {
      found.push(...await discover(relative));
    } else if (entry.isFile()) {
      found.push(relative);
    }
  }
  return found;
}

function descriptorId(executable) {
  const suffix = executable
    .slice("tests/".length, -".test.mjs".length)
    .split("/")
    .join(":");
  return `urn:mission-kit:survey-v2:test:${suffix}`;
}

const descriptorStatements = new Map();
for (const item of s11Suite) {
  const descriptorPath = item.executable.replace(
    /\.test\.mjs$/u,
    ".test.json",
  );
  const descriptor = await readJson(descriptorPath);
  if (
    descriptor.id !== descriptorId(item.executable) ||
    descriptor.obligationId !== item.obligationId ||
    descriptor.invariantIds.length !== 1 ||
    descriptor.invariantIds[0] !== item.invariantId ||
    descriptor.behavior.length === 0
  ) {
    fail(
      `${descriptorPath} differs from its S11 suite authority`,
    );
  }
  descriptorStatements.set(
    item.obligationId,
    descriptor.behavior,
  );
}

const requirementsPath =
  "source/requirements/survey-v2.requirements.json";
const requirements = await readJson(requirementsPath);
for (const item of s11Suite) {
  const invariant = requirements.invariants.find(
    ({ id }) => id === item.invariantId,
  );
  if (!invariant) {
    fail(`S11 suite names missing invariant ${item.invariantId}`);
  }
  const statement = descriptorStatements.get(
    item.obligationId,
  );
  const matches = requirements.invariants.flatMap(
    (entry) =>
      entry.acceptanceObligations
        .filter(({ id }) => id === item.obligationId)
        .map((obligation) => ({
          invariantId: entry.id,
          obligation,
        })),
  );
  if (matches.length === 0) {
    invariant.acceptanceObligations.push({
      id: item.obligationId,
      statement,
    });
  } else if (
    matches.length !== 1 ||
    matches[0].invariantId !== item.invariantId
  ) {
    fail(
      `${item.obligationId} conflicts with registered requirements`,
    );
  } else {
    matches[0].obligation.statement = statement;
  }
}

const evidencePath = "tests/test-evidence.manifest.json";
const evidence = await readJson(evidencePath);
const evidenceById = new Map(
  evidence.tests.map((entry) => [entry.id, entry]),
);
for (const item of s11Suite) {
  const entry = {
    id: descriptorId(item.executable),
    descriptorPath: item.executable.replace(
      /\.test\.mjs$/u,
      ".test.json",
    ),
  };
  const existing = evidenceById.get(entry.id);
  if (
    existing &&
    JSON.stringify(existing) !== JSON.stringify(entry)
  ) {
    fail(`${entry.id} conflicts with registered test evidence`);
  }
  evidenceById.set(entry.id, entry);
}
evidence.tests = [...evidenceById.values()].sort(
  (left, right) =>
    compareUtf8(left.descriptorPath, right.descriptorPath),
);

const packageManifestPath = "survey-v2.package.json";
const packageManifest = await readJson(packageManifestPath);
const newMembers = [
  "tests/authoring/generate-s11-descriptors.mjs",
  "tests/authoring/register-s11-suite.mjs",
  "tests/authoring/s11-suite-definition.mjs",
  ...await discover(
    "tests/authoring/request-input-bindings",
  ),
  ...await discover("tests/authoring/staged-authority"),
];
const memberByPath = new Map(
  packageManifest.members.map((entry) => [
    entry.path,
    entry,
  ]),
);
for (const relativePath of newMembers) {
  await readFile(packagePath(relativePath));
  const entry = {
    path: relativePath,
    kind: "authored",
  };
  const existing = memberByPath.get(relativePath);
  if (
    existing &&
    JSON.stringify(existing) !== JSON.stringify(entry)
  ) {
    fail(
      `${relativePath} conflicts with registered package ownership`,
    );
  }
  memberByPath.set(relativePath, entry);
}
packageManifest.members = [...memberByPath.values()].sort(
  (left, right) => compareUtf8(left.path, right.path),
);

await writeJson(requirementsPath, requirements);
await writeJson(evidencePath, evidence);
await writeJson(packageManifestPath, packageManifest);
