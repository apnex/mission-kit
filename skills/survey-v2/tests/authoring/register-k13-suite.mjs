#!/usr/bin/env node
import {
  readFile,
  readdir,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { k13Suite } from "./k13-suite-definition.mjs";

const authoringTestRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(authoringTestRoot, "../..");

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
    relativePath.includes("\\") ||
    relativePath.includes("\0") ||
    path.posix.isAbsolute(relativePath) ||
    relativePath.split("/").some(
      (part) => part === "" || part === "." || part === "..",
    )
  ) {
    fail(
      `unsafe K13 registration path: ${String(relativePath)}`,
    );
  }
  const target = path.resolve(
    packageRoot,
    ...relativePath.split("/"),
  );
  const relative = path.relative(packageRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(
      `K13 registration path escapes package root: ${relativePath}`,
    );
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
for (const item of k13Suite) {
  const descriptorPath = item.executable.replace(
    /\.test\.mjs$/u,
    ".test.json",
  );
  const descriptor = await readJson(descriptorPath);
  if (
    descriptor.id !== descriptorId(item.executable) ||
    descriptor.obligationId !== item.obligationId ||
    descriptor.behavior.length === 0
  ) {
    fail(
      `${descriptorPath} differs from its K13 suite authority`,
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
for (const item of k13Suite) {
  const invariant = requirements.invariants.find(
    (entry) => entry.id === item.invariantId,
  );
  if (!invariant) {
    fail(
      `K13 suite names missing invariant ${item.invariantId}`,
    );
  }
  const statement = descriptorStatements.get(
    item.obligationId,
  );
  const matches = requirements.invariants.flatMap(
    (entry) =>
      entry.acceptanceObligations.filter(
        (obligation) =>
          obligation.id === item.obligationId,
      ),
  );
  if (matches.length === 0) {
    invariant.acceptanceObligations.push({
      id: item.obligationId,
      statement,
    });
  } else if (
    matches.length !== 1 ||
    matches[0].statement !== statement
  ) {
    fail(
      `${item.obligationId} conflicts with registered requirements`,
    );
  }
}

const evidencePath = "tests/test-evidence.manifest.json";
const evidence = await readJson(evidencePath);
const evidenceById = new Map(
  evidence.tests.map((entry) => [entry.id, entry]),
);
for (const item of k13Suite) {
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
    fail(
      `${entry.id} conflicts with registered test evidence`,
    );
  }
  evidenceById.set(entry.id, entry);
}
evidence.tests = [...evidenceById.values()].sort(
  (left, right) =>
    compareUtf8(left.descriptorPath, right.descriptorPath),
);

const packageManifestPath = "survey-v2.package.json";
const packageManifest = await readJson(packageManifestPath);
const k13SchemaPaths = [
  "schemas/authoring/v1alpha1/authoring-workspace-effect.schema.json",
];
for (const schemaPath of k13SchemaPaths) {
  const schema = await readJson(schemaPath);
  const registration = {
    id: schema.$id,
    path: schemaPath,
  };
  const existing = packageManifest.schemas.find(
    (entry) =>
      entry.id === registration.id ||
      entry.path === registration.path,
  );
  if (
    existing &&
    JSON.stringify(existing) !== JSON.stringify(registration)
  ) {
    fail(
      `${schemaPath} conflicts with registered schema authority`,
    );
  }
  if (!existing) packageManifest.schemas.push(registration);
}
const newMembers = [
  "tests/fixtures/authoring/contracts/k10-authoring-schema-closure.snapshot.json",
  "tests/authoring/generate-k13-descriptors.mjs",
  "tests/authoring/k13-suite-definition.mjs",
  "tests/authoring/register-k13-suite.mjs",
  ...await discover("schemas/authoring/v1alpha1"),
  ...await discover("source/authoring/adapters"),
  ...await discover("source/authoring/runtime"),
  ...await discover("tests/authoring/journal"),
  ...await discover("tests/authoring/persistence/core"),
  ...await discover("tests/authoring/persistence/in-memory"),
  ...await discover("tests/authoring/transactions"),
  ...await discover(
    "tests/fixtures/authoring/contracts/positive",
  ),
  ...k13Suite.flatMap((item) => [
    item.executable,
    item.executable.replace(/\.test\.mjs$/u, ".test.json"),
    ...item.authorities,
    ...item.fixtures,
  ]),
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
