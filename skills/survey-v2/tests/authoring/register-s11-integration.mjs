#!/usr/bin/env node
import {
  copyFile,
  readFile,
  readdir,
  rename,
  unlink,
  writeFile,
} from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const authoringRoot = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(authoringRoot, "../..");
const mode = process.argv[2] ?? "--write";

if (
  !["--check", "--write"].includes(mode) ||
  process.argv.length > 3
) {
  process.stderr.write(
    "usage: node tests/authoring/register-s11-integration.mjs [--check|--write]\n",
  );
  process.exit(64);
}

const integrationRoots = Object.freeze([
  "tests/authoring/event-input-bindings",
  "tests/authoring/request-input-bindings",
  "tests/authoring/transactions/commit-sidecars",
  "tests/survey/initialization",
  "tests/survey/profile",
]);

const integrationExecutables = Object.freeze([
  "tests/authoring/assignment-dag/generation-unicode-scalar-bound.test.mjs",
  "tests/authoring/assignment-dag/projector-async-result.test.mjs",
  "tests/authoring/assignment-dag/projector-deterministic-view.test.mjs",
  "tests/authoring/assignment-dag/projector-divergent-reproduction.test.mjs",
  "tests/authoring/assignment-dag/projector-omission.test.mjs",
  "tests/authoring/transactions/coordinator/cancel-reissued-assignment-epoch.test.mjs",
  "tests/authoring/transactions/coordinator/cancel-reference-operation-envelope-idempotency.test.mjs",
  "tests/authoring/transactions/coordinator/event-operation-envelope-idempotency.test.mjs",
  "tests/authoring/transactions/coordinator/executable-closure-preflight.test.mjs",
  "tests/authoring/transactions/coordinator/executable-registry-required-before-coordination.test.mjs",
  "tests/authoring/transactions/coordinator/projector-cold-divergence.test.mjs",
  "tests/authoring/transactions/coordinator/projector-digest-mismatch-before-retention.test.mjs",
  "tests/authoring/transactions/coordinator/projector-dispatch-exact-view.test.mjs",
  "tests/authoring/transactions/coordinator/projector-missing-before-retention.test.mjs",
  "tests/authoring/transactions/coordinator/operation-digest-persistence-tamper.test.mjs",
  "tests/authoring/transactions/coordinator/submit-coupling-operation-envelope-idempotency.test.mjs",
]);

const sourceMembers = Object.freeze([
  "source/authoring/kernel/limits.mjs",
  "source/authoring/runtime/command-admission.mjs",
  "source/authoring/runtime/commit-sidecars.mjs",
  "source/authoring/survey/generation-record.mjs",
  "source/authoring/survey/initialization-adapter.mjs",
  "source/authoring/survey/profile-authority.mjs",
  "source/authoring/survey/profile-executables.mjs",
  "source/authoring/survey/source-snapshot.mjs",
  "source/authoring/survey/survey-frame-authority.mjs",
  "source/authoring/survey/survey-frame-projection-admission.mjs",
  "source/authoring/survey/survey-frame-projector.mjs",
  "source/authoring/survey/survey-policy-snapshot.mjs",
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
    fail(`unsafe S11 integration path: ${String(relativePath)}`);
  }
  const target = path.resolve(
    packageRoot,
    ...relativePath.split("/"),
  );
  const relative = path.relative(packageRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    fail(`S11 integration path escapes package root: ${relativePath}`);
  }
  return target;
}

async function readJson(relativePath) {
  return JSON.parse(
    await readFile(packagePath(relativePath), "utf8"),
  );
}

function renderJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

async function removeIfPresent(target) {
  try {
    await unlink(target);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function publishJsonTransaction(outputs) {
  const transactionId = randomUUID();
  const entries = [];
  for (const [relativePath, value] of outputs) {
    const target = packagePath(relativePath);
    const original = await readFile(target, "utf8");
    const rendered = renderJson(value);
    entries.push({
      backup: `${target}.s11-${transactionId}.backup`,
      original,
      relativePath,
      rendered,
      staged: `${target}.s11-${transactionId}.staged`,
      target,
    });
  }
  const changed = entries.filter(
    ({ original, rendered }) => original !== rendered,
  );
  if (mode === "--check") {
    if (changed.length > 0) {
      fail(
        `S11 integration registration drift: ${changed
          .map(({ relativePath }) => relativePath)
          .join(", ")}`,
      );
    }
    return [];
  }
  if (changed.length === 0) return [];

  const staged = [];
  const backedUp = [];
  const published = [];
  let rollbackFailed = false;
  try {
    for (const entry of changed) {
      await writeFile(
        entry.staged,
        entry.rendered,
        { encoding: "utf8", flag: "wx" },
      );
      staged.push(entry);
    }
    for (const entry of changed) {
      const current = await readFile(entry.target, "utf8");
      if (current !== entry.original) {
        fail(
          `${entry.relativePath} changed during S11 registration`,
        );
      }
    }
    for (const entry of changed) {
      await copyFile(entry.target, entry.backup);
      backedUp.push(entry);
    }
    for (const entry of changed) {
      await rename(entry.staged, entry.target);
      published.push(entry);
    }
  } catch (error) {
    const rollbackFailures = [];
    for (const entry of [...published].reverse()) {
      try {
        await rename(entry.backup, entry.target);
      } catch (rollbackError) {
        rollbackFailures.push(rollbackError);
      }
    }
    if (rollbackFailures.length > 0) {
      rollbackFailed = true;
      throw new AggregateError(
        [error, ...rollbackFailures],
        "S11 integration registration and rollback failed",
      );
    }
    throw error;
  } finally {
    for (const entry of staged) {
      await removeIfPresent(entry.staged);
    }
    if (!rollbackFailed) {
      for (const entry of backedUp) {
        await removeIfPresent(entry.backup);
      }
    }
  }
  return changed.map(({ relativePath }) => relativePath);
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

const rootFiles = (
  await Promise.all(integrationRoots.map(discover))
).flat();
const rootExecutables = rootFiles.filter(
  (relativePath) => relativePath.endsWith(".test.mjs"),
);
const executables = [
  ...new Set([
    ...integrationExecutables,
    ...rootExecutables,
  ]),
].sort(compareUtf8);

const descriptors = [];
for (const executable of executables) {
  await readFile(packagePath(executable));
  const descriptorPath = executable.replace(
    /\.test\.mjs$/u,
    ".test.json",
  );
  const descriptor = await readJson(descriptorPath);
  if (
    descriptor.id !== descriptorId(executable) ||
    descriptor.executable !== executable ||
    typeof descriptor.obligationId !== "string" ||
    !Array.isArray(descriptor.invariantIds) ||
    descriptor.invariantIds.length !== 1 ||
    typeof descriptor.behavior !== "string" ||
    descriptor.behavior.length === 0
  ) {
    fail(
      `${descriptorPath} differs from its executable and closed evidence authority`,
    );
  }
  descriptors.push({
    descriptor,
    descriptorPath,
    executable,
  });
}

for (const relativePath of rootFiles.filter(
  (value) => value.endsWith(".test.json"),
)) {
  const executable = relativePath.replace(
    /\.test\.json$/u,
    ".test.mjs",
  );
  if (!executables.includes(executable)) {
    fail(`orphan S11 descriptor: ${relativePath}`);
  }
}

const obligationIds = descriptors.map(
  ({ descriptor }) => descriptor.obligationId,
);
// The active AS/SV registry requires one descriptor for each new
// obligation. This is deliberately local: legacy obligations may have
// several orthogonal evidence descriptors.
if (new Set(obligationIds).size !== obligationIds.length) {
  fail("S11 integration descriptors repeat one obligationId");
}

const requirementsPath =
  "source/requirements/survey-v2.requirements.json";
const requirements = await readJson(requirementsPath);
const requirementAuthorities = [
  ...requirements.requirements,
  ...requirements.invariants,
];
for (const { descriptor } of descriptors) {
  const invariantId = descriptor.invariantIds[0];
  const invariant = requirements.invariants.find(
    ({ id }) => id === invariantId,
  );
  if (invariant === undefined) {
    fail(
      `${descriptor.obligationId} names missing invariant ${invariantId}`,
    );
  }
  if (
    !descriptor.obligationId.startsWith(`O-${invariantId}-`)
  ) {
    fail(
      `${descriptor.obligationId} does not belong to ${invariantId}`,
    );
  }
  const matches = requirementAuthorities.flatMap(
    (entry) =>
      entry.acceptanceObligations
        .filter(({ id }) => id === descriptor.obligationId)
        .map((obligation) => ({
          invariantId: entry.id,
          obligation,
        })),
  );
  if (matches.length === 0) {
    invariant.acceptanceObligations.push({
      id: descriptor.obligationId,
      statement: descriptor.behavior,
    });
  } else if (
    matches.length !== 1 ||
    matches[0].invariantId !== invariantId ||
    matches[0].obligation.statement !== descriptor.behavior
  ) {
    fail(
      `${descriptor.obligationId} conflicts with the requirements registry`,
    );
  }
}

const evidencePath = "tests/test-evidence.manifest.json";
const evidence = await readJson(evidencePath);
const evidenceById = new Map();
const evidenceByPath = new Map();
// Evidence identities and descriptor paths are unique. Obligation IDs
// are not globally unique evidence identities.
for (const entry of evidence.tests) {
  const registered = await readJson(entry.descriptorPath);
  if (registered.id !== entry.id) {
    fail(
      `${entry.descriptorPath} ID differs from its evidence entry`,
    );
  }
  if (evidenceById.has(entry.id)) {
    fail(`repeated registered test evidence ID: ${entry.id}`);
  }
  if (evidenceByPath.has(entry.descriptorPath)) {
    fail(
      `repeated registered descriptor path: ${entry.descriptorPath}`,
    );
  }
  evidenceById.set(entry.id, entry);
  evidenceByPath.set(entry.descriptorPath, entry);
}
for (const {
  descriptor,
  descriptorPath,
} of descriptors) {
  const entry = {
    id: descriptor.id,
    descriptorPath,
  };
  const existingById = evidenceById.get(entry.id);
  if (
    existingById !== undefined &&
    JSON.stringify(existingById) !== JSON.stringify(entry)
  ) {
    fail(`${entry.id} conflicts with registered test evidence`);
  }
  const existingByPath = evidenceByPath.get(
    entry.descriptorPath,
  );
  if (
    existingByPath !== undefined &&
    existingByPath.id !== entry.id
  ) {
    fail(
      `${entry.descriptorPath} is already registered as ${existingByPath.id}`,
    );
  }
  evidenceById.set(entry.id, entry);
  evidenceByPath.set(entry.descriptorPath, entry);
}
evidence.tests = [...evidenceById.values()].sort(
  (left, right) =>
    compareUtf8(left.descriptorPath, right.descriptorPath),
);

const packageManifestPath = "survey-v2.package.json";
const packageManifest = await readJson(packageManifestPath);
const newMembers = [
  "tests/authoring/register-s11-integration.mjs",
  ...sourceMembers,
  ...rootFiles,
  ...integrationExecutables.flatMap((executable) => [
    executable,
    executable.replace(/\.test\.mjs$/u, ".test.json"),
  ]),
];
const memberByPath = new Map();
for (const entry of packageManifest.members) {
  if (memberByPath.has(entry.path)) {
    fail(`repeated registered package path: ${entry.path}`);
  }
  memberByPath.set(entry.path, entry);
}
for (const relativePath of newMembers) {
  await readFile(packagePath(relativePath));
  const entry = {
    path: relativePath,
    kind: "authored",
  };
  const existing = memberByPath.get(relativePath);
  if (
    existing !== undefined &&
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

const changed = await publishJsonTransaction(new Map([
  [requirementsPath, requirements],
  [evidencePath, evidence],
  [packageManifestPath, packageManifest],
]));
process.stdout.write(JSON.stringify({
  changed,
  mode: mode === "--check" ? "check" : "write",
}) + "\n");
