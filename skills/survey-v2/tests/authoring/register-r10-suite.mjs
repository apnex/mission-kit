#!/usr/bin/env node
import {
  readFile,
} from "node:fs/promises";
import path from "node:path";
import {
  fileURLToPath,
} from "node:url";
import {
  r10OwnedMembers,
  r10Suite,
} from "./r10-suite-definition.mjs";

const authoringRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(authoringRoot, "../..");

function fail(message) {
  throw new Error(`R10 registration invalid: ${message}`);
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
    fail(`unsafe path ${String(relativePath)}`);
  }
  const target = path.resolve(
    packageRoot,
    ...relativePath.split("/"),
  );
  const relative = path.relative(packageRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`path escapes package root: ${relativePath}`);
  }
  return target;
}

async function readJson(relativePath) {
  return JSON.parse(
    await readFile(packagePath(relativePath), "utf8"),
  );
}

function descriptorId(executable) {
  const suffix = executable
    .slice("tests/".length, -".test.mjs".length)
    .split("/")
    .join(":");
  return `urn:mission-kit:survey-v2:test:${suffix}`;
}

if (
  process.argv.length !== 2 &&
  !(
    process.argv.length === 3 &&
    process.argv[2] === "--check"
  )
) {
  fail("usage: node tests/authoring/register-r10-suite.mjs [--check]");
}

const [
  requirements,
  evidence,
  packageManifest,
] = await Promise.all([
  readJson("source/requirements/survey-v2.requirements.json"),
  readJson("tests/test-evidence.manifest.json"),
  readJson("survey-v2.package.json"),
]);
const evidenceById = new Map(
  evidence.tests.map((item) => [item.id, item]),
);
const members = new Map(
  packageManifest.members.map((item) => [item.path, item]),
);
const seenObligations = new Set();

for (const item of r10Suite) {
  if (seenObligations.has(item.obligationId)) {
    fail(`duplicate suite obligation ${item.obligationId}`);
  }
  seenObligations.add(item.obligationId);
  const descriptor = await readJson(item.descriptorPath);
  const expectedId = descriptorId(item.executable);
  if (
    descriptor.id !== expectedId ||
    descriptor.executable !== item.executable ||
    descriptor.obligationId !== item.obligationId ||
    descriptor.invariantIds.length !== 1 ||
    descriptor.invariantIds[0] !== item.invariantId ||
    descriptor.behavior.length === 0
  ) {
    fail(`${item.descriptorPath} differs from its suite definition`);
  }
  const evidenceEntry = evidenceById.get(expectedId);
  if (
    evidenceEntry?.descriptorPath !== item.descriptorPath
  ) {
    fail(`${expectedId} lacks exact test-evidence registration`);
  }
  const obligationMatches = requirements.invariants.flatMap(
    (invariant) =>
      invariant.acceptanceObligations
        .filter(({ id }) => id === item.obligationId)
        .map((obligation) => ({
          invariantId: invariant.id,
          obligation,
        })),
  );
  if (
    obligationMatches.length !== 1 ||
    obligationMatches[0].invariantId !== item.invariantId ||
    obligationMatches[0].obligation.statement !==
      descriptor.behavior
  ) {
    fail(`${item.obligationId} lacks exact requirement registration`);
  }
}

for (const relativePath of r10OwnedMembers) {
  await readFile(packagePath(relativePath));
  const member = members.get(relativePath);
  if (member?.kind !== "authored") {
    fail(`${relativePath} lacks authored package ownership`);
  }
}

process.stdout.write(
  `${JSON.stringify({
    ok: true,
    ownedMembers: r10OwnedMembers.length,
    tests: r10Suite.length,
  })}\n`,
);
