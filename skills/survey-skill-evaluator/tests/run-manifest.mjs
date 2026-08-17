#!/usr/bin/env node
import { spawn } from "node:child_process";
import { mkdir, readdir, realpath } from "node:fs/promises";
import { endianness, tmpdir } from "node:os";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  parse,
  relative,
  resolve,
  sep,
} from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertNoSymlinkAncestors,
  atomicCreateOnce,
  readFileNoFollow,
  readJsonFile,
  resolveContained,
} from "../source/executables/engine/atomic-fs.mjs";
import {
  canonicalBytes,
  parseStrictJson,
} from "../source/executables/engine/canonical-json.mjs";
import {
  HASH_PROFILE_ID,
  hashCanonical,
  rawSha256,
} from "../source/executables/engine/hash.mjs";
import { SchemaValidator } from "../source/executables/engine/schema-validator.mjs";
import {
  assertSchemaInstance,
  lintSchema,
} from "../source/executables/shared/schema-validator.mjs";

const packageRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);
const RUNNER_ID = "survey-evaluator-manifest-runner/v1";
const RUNNER_SOURCE_PATH = "tests/run-manifest.mjs";
const RUNNER_CONCURRENCY = 4;

function usage() {
  return [
    "Usage: node tests/run-manifest.mjs [options]",
    "  --evidence-root <absolute-or-relative-outside-package>",
    "  --manifest <relative-manifest-path>",
    "  --release-check",
  ].join("\n");
}

function parseArguments(argv) {
  const options = {
    evidenceRoot: null,
    manifestPath: "source/manifests/tests.json",
    releaseCheck: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--release-check") {
      options.releaseCheck = true;
    } else if (argument === "--evidence-root") {
      options.evidenceRoot = argv[++index];
    } else if (argument === "--manifest") {
      options.manifestPath = argv[++index];
    } else if (argument === "--help" || argument === "-h") {
      process.stdout.write(`${usage()}\n`);
      process.exit(0);
    } else {
      throw new Error(`Unknown runner argument: ${argument}`);
    }
  }
  if (
    typeof options.manifestPath !== "string" ||
    isAbsolute(options.manifestPath) ||
    options.manifestPath.split(/[\\/]/u).some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    throw new Error("Manifest path must be a portable package-relative path");
  }
  return options;
}

function isInside(root, target) {
  const rel = relative(root, target);
  return (
    rel === "" ||
    (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))
  );
}

async function listFiles(directory, prefix) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = [];
  for (const entry of entries.sort((left, right) =>
    Buffer.from(left.name, "utf8").compare(Buffer.from(right.name, "utf8")),
  )) {
    const absolute = join(directory, entry.name);
    const relativePath = `${prefix}/${entry.name}`;
    if (entry.isSymbolicLink()) {
      throw new Error(`Manifest discovery encountered a symbolic link: ${relativePath}`);
    }
    if (entry.isDirectory()) {
      paths.push(...(await listFiles(absolute, relativePath)));
    } else if (entry.isFile()) {
      paths.push(relativePath);
    } else {
      throw new Error(`Manifest discovery encountered a special file: ${relativePath}`);
    }
  }
  return paths;
}

function assertOneBehavior(source, executable) {
  const count = [
    ...source.matchAll(/^\s*test(?:\.(?:skip|todo|only))?\s*\(/gmu),
  ].length;
  if (!/from\s+["']node:test["']/u.test(source) || count !== 1) {
    throw new Error(
      `${executable} must own exactly one top-level node:test behavior`,
    );
  }
}

async function resolvePackageFile(relativePath, label) {
  if (
    typeof relativePath !== "string" ||
    isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath.split("/").some(
      (segment) => segment === "" || segment === "." || segment === "..",
    )
  ) {
    throw new Error(`${label} is not a portable package-relative path`);
  }
  const path = resolveContained(packageRoot, relativePath);
  await assertNoSymlinkAncestors(packageRoot, path);
  const canonical = await realpath(path);
  if (!isInside(packageRoot, canonical)) {
    throw new Error(`${label} escapes the package root`);
  }
  return path;
}

async function fileIdentity(relativePath, label) {
  const path = await resolvePackageFile(relativePath, label);
  const bytes = await readFileNoFollow(path);
  return {
    path: relativePath,
    rawFileSha256: rawSha256(bytes),
    byteLength: bytes.length,
  };
}

async function createExternalEvidenceRoot(requestedPath) {
  const lexicalRoot = resolve(requestedPath);
  const canonicalPackageRoot = await realpath(packageRoot);
  if (isInside(canonicalPackageRoot, lexicalRoot)) {
    throw new Error(
      "Test evidence root must be outside the evaluator package identity",
    );
  }
  await assertNoSymlinkAncestors(parse(lexicalRoot).root, lexicalRoot);
  const canonicalParent = await realpath(dirname(lexicalRoot));
  const physicalRoot = join(canonicalParent, basename(lexicalRoot));
  if (isInside(canonicalPackageRoot, physicalRoot)) {
    throw new Error(
      "Physical test evidence root must be outside the evaluator package identity",
    );
  }
  await mkdir(lexicalRoot, { recursive: false, mode: 0o700 });
  const createdRoot = await realpath(lexicalRoot);
  if (
    createdRoot !== physicalRoot ||
    isInside(canonicalPackageRoot, createdRoot)
  ) {
    throw new Error(
      "Created test evidence root does not match its no-follow physical path",
    );
  }
  return createdRoot;
}

function candidateControlIdentities(fixtures) {
  const candidates = fixtures.filter((entry) =>
    /(?:^|\/)candidate(?:[.-]|$)/u.test(entry.path),
  );
  const controls = fixtures.filter((entry) =>
    /(?:^|\/)control(?:[.-]|$)/u.test(entry.path),
  );
  if (candidates.length === 1 && controls.length === 1) {
    return {
      applicability: "applicable",
      candidatePackageIdentity: candidates[0].rawFileSha256,
      controlPackageIdentity: controls[0].rawFileSha256,
      identityClass: "raw_fixture_bytes",
    };
  }
  return {
    applicability: "not_applicable",
    reason:
      "Descriptor does not consume one registered candidate/control fixture pair.",
  };
}

function executeTest(executable, environment) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, ["--test", executable], {
      cwd: packageRoot,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", (chunk) => stderr.push(Buffer.from(chunk)));
    child.on("error", rejectPromise);
    child.on("close", (exitCode, signal) => {
      resolvePromise({
        exitCode,
        signal,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
      });
    });
  });
}

async function mapConcurrent(values, concurrency, operation) {
  const results = new Array(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await operation(values[index], index);
    }
  }
  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, values.length) },
      () => worker(),
    ),
  );
  return results;
}

export async function runDescriptorSchedule(
  records,
  concurrency,
  operation,
) {
  const results = new Array(records.length);
  let readOnlyBatch = [];
  async function flushReadOnlyBatch() {
    const batch = readOnlyBatch;
    readOnlyBatch = [];
    const batchResults = await mapConcurrent(
      batch,
      concurrency,
      ({ record, index }) => operation(record, index),
    );
    for (let position = 0; position < batch.length; position += 1) {
      results[batch[position].index] = batchResults[position];
    }
  }
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    const isolationClass = record.descriptor.executionIsolationClass;
    if (isolationClass === "read-only-package") {
      readOnlyBatch.push({ record, index });
      continue;
    }
    if (isolationClass !== "package-root-mutating") {
      throw new Error(
        `${record.descriptor.testId} has an invalid implemented isolation class`,
      );
    }
    await flushReadOnlyBatch();
    results[index] = await operation(record, index);
  }
  await flushReadOnlyBatch();
  return results;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const manifestPath = await resolvePackageFile(
    options.manifestPath,
    "test manifest",
  );
  const manifestBytes = await readFileNoFollow(manifestPath);
  const manifest = parseStrictJson(manifestBytes.toString("utf8"));
  const manifestSchemaPath = await resolvePackageFile(
    "source/schemas/test-manifest.schema.json",
    "test manifest schema",
  );
  const manifestSchema = await readJsonFile(manifestSchemaPath);
  lintSchema(manifestSchema, "test-manifest.schema.json");
  assertSchemaInstance(manifestSchema, manifest, "tests.json");
  if (
    manifest.discovery !== "manifest-only" ||
    manifest.hashProfileId !== HASH_PROFILE_ID
  ) {
    throw new Error("Test manifest does not authorize exact sidecar discovery");
  }

  const descriptorSchemaPath = await resolvePackageFile(
    "source/schemas/test-descriptor.schema.json",
    "test descriptor schema",
  );
  const descriptorSchema = await readJsonFile(descriptorSchemaPath);
  lintSchema(descriptorSchema, "test-descriptor.schema.json");
  const descriptorFiles = await listFiles(
    resolveContained(packageRoot, "source/test-descriptors"),
    "source/test-descriptors",
  );
  if (
    descriptorFiles.length !== manifest.descriptorPaths.length ||
    descriptorFiles.some(
      (descriptorPath) => !manifest.descriptorPaths.includes(descriptorPath),
    )
  ) {
    throw new Error(
      "Manifest descriptor paths are not an exact sidecar inventory",
    );
  }
  const sortedDescriptorPaths = [...manifest.descriptorPaths].sort(
    (left, right) =>
      Buffer.from(left, "utf8").compare(Buffer.from(right, "utf8")),
  );
  if (
    JSON.stringify(sortedDescriptorPaths) !==
    JSON.stringify(manifest.descriptorPaths)
  ) {
    throw new Error("Manifest descriptor paths are not bytewise sorted");
  }

  const descriptorRecords = [];
  const descriptorIds = new Set();
  for (const descriptorPath of manifest.descriptorPaths) {
    const resolvedDescriptorPath = await resolvePackageFile(
      descriptorPath,
      "test descriptor",
    );
    const descriptorBytes = await readFileNoFollow(resolvedDescriptorPath);
    const descriptor = parseStrictJson(descriptorBytes.toString("utf8"));
    assertSchemaInstance(
      descriptorSchema,
      descriptor,
      `test descriptor ${descriptorPath}`,
    );
    if (descriptorIds.has(descriptor.testId)) {
      throw new Error(`Duplicate test descriptor ID: ${descriptor.testId}`);
    }
    descriptorIds.add(descriptor.testId);
    if (
      (descriptor.status === "implemented") !==
        descriptorPath.startsWith("source/test-descriptors/implemented/") ||
      (descriptor.status === "planned-unimplemented") !==
        descriptorPath.startsWith("source/test-descriptors/planned/")
    ) {
      throw new Error(
        `${descriptor.testId} status does not match its sidecar registry`,
      );
    }
    descriptorRecords.push({
      descriptorPath,
      descriptor,
      rawSourceSha256: rawSha256(descriptorBytes),
    });
  }

  const requirements = await readJsonFile(
    await resolvePackageFile(
      "source/manifests/requirements.json",
      "requirements manifest",
    ),
  );
  const requirementById = new Map(
    requirements.requirements.map((requirement) => [
      requirement.requirementId,
      requirement,
    ]),
  );
  const expectedObligations = [
    ...Array.from(
      { length: 32 },
      (_, index) => `TE${String(index + 1).padStart(2, "0")}`,
    ),
    ...Array.from(
      { length: 21 },
      (_, index) => `EI${String(index + 1).padStart(2, "0")}`,
    ),
    ...Array.from(
      { length: 20 },
      (_, index) => `EM${String(index + 1).padStart(2, "0")}`,
    ),
  ];
  const actualObligations = [
    ...new Set(
      descriptorRecords.map(({ descriptor }) => descriptor.obligationId),
    ),
  ].sort();
  if (
    JSON.stringify(actualObligations) !==
    JSON.stringify([...expectedObligations].sort())
  ) {
    throw new Error("Descriptor sidecars do not cover the exact obligation set");
  }
  const knownGroups = new Set(manifest.groups.map((group) => group.groupId));
  for (const { descriptor } of descriptorRecords) {
    if (!knownGroups.has(descriptor.groupId)) {
      throw new Error(`${descriptor.testId} references an unknown test group`);
    }
    if (
      descriptor.obligationId.startsWith("EM") &&
      descriptor.mechanismId !== descriptor.obligationId
    ) {
      throw new Error(
        `${descriptor.testId} does not test its own mechanism identity`,
      );
    }
    if (
      !descriptor.obligationId.startsWith("EM") &&
      !requirementById
        .get(descriptor.obligationId)
        ?.mechanismIds.includes(descriptor.mechanismId)
    ) {
      throw new Error(
        `${descriptor.testId} mechanism is not traced by its requirement`,
      );
    }
    if (
      (descriptor.status === "planned-unimplemented") !==
      (descriptor.executable === null)
    ) {
      throw new Error(
        `${descriptor.testId} status/executable pair is inconsistent`,
      );
    }
    if (
      (descriptor.status === "planned-unimplemented" &&
        descriptor.executionIsolationClass !== "not-applicable") ||
      (descriptor.status === "implemented" &&
        ![
          "read-only-package",
          "package-root-mutating",
        ].includes(descriptor.executionIsolationClass))
    ) {
      throw new Error(
        `${descriptor.testId} status/isolation-class pair is inconsistent`,
      );
    }
  }

  const implemented = descriptorRecords.filter(
    ({ descriptor }) => descriptor.status === "implemented",
  );
  const planned = descriptorRecords.filter(
    ({ descriptor }) => descriptor.status === "planned-unimplemented",
  );
  const executableSet = new Set();
  for (const { descriptor } of implemented) {
    if (
      typeof descriptor.executable !== "string" ||
      executableSet.has(descriptor.executable)
    ) {
      throw new Error(
        `${descriptor.testId} has a missing or duplicate executable`,
      );
    }
    executableSet.add(descriptor.executable);
  }
  const discovered = (
    await listFiles(resolveContained(packageRoot, "tests"), "tests")
  ).filter((path) => path.endsWith(".test.mjs"));
  const unregistered = discovered.filter((path) => !executableSet.has(path));
  const missing = [...executableSet].filter(
    (path) => !discovered.includes(path),
  );
  if (unregistered.length > 0 || missing.length > 0) {
    throw new Error(
      `Manifest-only discovery mismatch: unregistered=${JSON.stringify(
        unregistered,
      )} missing=${JSON.stringify(missing)}`,
    );
  }
  const releaseReady = planned.length === 0;
  if (
    (releaseReady && manifest.releaseStatus !== "evidence-complete") ||
    (!releaseReady && manifest.releaseStatus !== "incomplete")
  ) {
    throw new Error("Manifest release status is inconsistent with its sidecars");
  }

  let evidenceRoot;
  if (options.evidenceRoot) {
    evidenceRoot = options.evidenceRoot;
  } else {
    evidenceRoot = join(
      await realpath(tmpdir()),
      `survey-evaluator-test-evidence-${process.pid}-${Date.now()}`,
    );
  }
  evidenceRoot = await createExternalEvidenceRoot(evidenceRoot);

  const schemaValidator = await SchemaValidator.fromPackageRoot(packageRoot);
  const runnerIdentity = await fileIdentity(
    RUNNER_SOURCE_PATH,
    "test runner",
  );
  const childEnvironment = {
    LANG: "C",
    LC_ALL: "C",
    PATH: process.env.PATH ?? "/usr/bin:/bin",
    ...(process.env.SURVEY_EVALUATOR_RELOCATION_CHILD === "1"
      ? { SURVEY_EVALUATOR_RELOCATION_CHILD: "1" }
      : {}),
    TZ: "UTC",
  };
  const environmentCore = {
    nodeVersion: process.version,
    platform: process.platform,
    architecture: process.arch,
    endianness: endianness(),
  };
  const environment = {
    ...environmentCore,
    environmentDigest: hashCanonical("test-environment/v1", {
      ...environmentCore,
      childEnvironment,
    }),
  };
  const invocationDigest = hashCanonical("test-runner-invocation/v1", {
    runnerId: RUNNER_ID,
    nodeVersion: process.version,
    childArguments: ["--test", "<manifest-executable>"],
    executionConcurrency: RUNNER_CONCURRENCY,
    environmentDigest: environment.environmentDigest,
    manifestDigest: hashCanonical("test-manifest/v1", manifest),
    rawManifestSha256: rawSha256(manifestBytes),
    descriptorRegistryDigest: hashCanonical(
      "test-descriptor-registry/v1",
      descriptorRecords.map((record) => ({
        sourcePath: record.descriptorPath,
        rawSourceSha256: record.rawSourceSha256,
        descriptorDigest: hashCanonical(
          "test-evidence-descriptor/v1",
          record.descriptor,
        ),
      })),
    ),
  });

  const results = await runDescriptorSchedule(
    implemented,
    RUNNER_CONCURRENCY,
    async (record) => {
    const { descriptor } = record;
    const executableIdentity = await fileIdentity(
      descriptor.executable,
      `${descriptor.testId} executable`,
    );
    assertOneBehavior(
      (await readFileNoFollow(
        resolveContained(packageRoot, descriptor.executable),
      )).toString("utf8"),
      descriptor.executable,
    );
    const fixtures = [];
    for (const fixture of descriptor.fixtures) {
      fixtures.push(
        await fileIdentity(fixture, `${descriptor.testId} fixture`),
      );
    }
    const descriptorCore = {
      sourcePath: record.descriptorPath,
      testId: descriptor.testId,
      obligationId: descriptor.obligationId,
      mechanismId: descriptor.mechanismId,
      gate: descriptor.gate,
      groupId: descriptor.groupId,
      executionIsolationClass: descriptor.executionIsolationClass,
      rawSourceSha256: record.rawSourceSha256,
    };
    const descriptorBinding = {
      ...descriptorCore,
      descriptorDigest: hashCanonical(
        "test-evidence-descriptor/v1",
        descriptor,
      ),
    };
    const startedAtMs = Date.now();
    const execution = await executeTest(
      descriptor.executable,
      childEnvironment,
    );
    const endedAtMs = Math.max(Date.now(), startedAtMs);
    const finalExecutableIdentity = await fileIdentity(
      descriptor.executable,
      `${descriptor.testId} executable after execution`,
    );
    if (
      finalExecutableIdentity.rawFileSha256 !==
        executableIdentity.rawFileSha256 ||
      finalExecutableIdentity.byteLength !== executableIdentity.byteLength
    ) {
      throw new Error(
        `${descriptor.testId} executable changed during its evidence run`,
      );
    }
    for (const fixture of fixtures) {
      const finalFixtureIdentity = await fileIdentity(
        fixture.path,
        `${descriptor.testId} fixture after execution`,
      );
      if (
        finalFixtureIdentity.rawFileSha256 !== fixture.rawFileSha256 ||
        finalFixtureIdentity.byteLength !== fixture.byteLength
      ) {
        throw new Error(
          `${descriptor.testId} fixture changed during its evidence run`,
        );
      }
    }
    const finalDescriptorIdentity = await fileIdentity(
      record.descriptorPath,
      `${descriptor.testId} descriptor after execution`,
    );
    if (finalDescriptorIdentity.rawFileSha256 !== record.rawSourceSha256) {
      throw new Error(
        `${descriptor.testId} descriptor changed during its evidence run`,
      );
    }
    const output = {
      stdoutSha256: rawSha256(execution.stdout),
      stderrSha256: rawSha256(execution.stderr),
      tapSha256: rawSha256(execution.stdout),
      stdoutByteLength: execution.stdout.length,
      stderrByteLength: execution.stderr.length,
    };
    const core = {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      evidenceId: `${descriptor.testId}:${executableIdentity.rawFileSha256.slice(
        0,
        16,
      )}`,
      descriptor: descriptorBinding,
      executable: {
        path: executableIdentity.path,
        rawSourceSha256: executableIdentity.rawFileSha256,
        byteLength: executableIdentity.byteLength,
      },
      fixtures,
      candidateControlIdentities: candidateControlIdentities(fixtures),
      environment,
      runner: {
        runnerId: RUNNER_ID,
        sourcePath: RUNNER_SOURCE_PATH,
        rawSourceSha256: runnerIdentity.rawFileSha256,
        invocationDigest,
      },
      startedAtMs,
      endedAtMs,
      status: execution.exitCode === 0 ? "passed" : "failed",
      exitCode: execution.exitCode,
      signal: execution.signal,
      output,
    };
    const evidence = {
      ...core,
      evidenceDigest: hashCanonical("test-evidence/v1", core),
    };
    if (
      hashCanonical(
        "test-evidence/v1",
        Object.fromEntries(
          Object.entries(evidence).filter(
            ([key]) => key !== "evidenceDigest",
          ),
        ),
      ) !== evidence.evidenceDigest
    ) {
      throw new Error(`${descriptor.testId} evidence self-exclusion failed`);
    }
    schemaValidator.assert("test-evidence", evidence);
    await atomicCreateOnce(
      resolveContained(evidenceRoot, `${descriptor.testId}.json`),
      canonicalBytes(evidence),
      { mode: 0o600 },
    );
    const result = {
      testId: descriptor.testId,
      executable: descriptor.executable,
      status: evidence.status,
      evidenceDigest: evidence.evidenceDigest,
    };
    if (evidence.status === "failed") {
      process.stderr.write(execution.stdout);
      process.stderr.write(execution.stderr);
    }
      return result;
    },
  );
  const finalRunnerIdentity = await fileIdentity(
    RUNNER_SOURCE_PATH,
    "test runner after execution",
  );
  if (finalRunnerIdentity.rawFileSha256 !== runnerIdentity.rawFileSha256) {
    throw new Error("Test runner source changed during the manifest run");
  }
  if (rawSha256(await readFileNoFollow(manifestPath)) !== rawSha256(manifestBytes)) {
    throw new Error("Test manifest changed during the manifest run");
  }

  const summary = {
    runnerId: RUNNER_ID,
    evidenceRoot,
    implementedCount: implemented.length,
    passedCount: results.filter((result) => result.status === "passed").length,
    failedCount: results.filter((result) => result.status === "failed").length,
    plannedUnimplemented: planned.map(({ descriptor, descriptorPath }) => ({
      descriptorPath,
      testId: descriptor.testId,
      obligationId: descriptor.obligationId,
      mechanismId: descriptor.mechanismId,
      gate: descriptor.gate,
    })),
    releaseReady,
    results,
  };
  process.stdout.write(`${JSON.stringify(summary)}\n`);
  if (
    summary.failedCount > 0 ||
    (options.releaseCheck && !summary.releaseReady)
  ) {
    process.exitCode = 1;
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    const diagnostic = {
      runnerId: RUNNER_ID,
      status: "runner_failed",
      message: error.message,
    };
    process.stderr.write(`${JSON.stringify(diagnostic)}\n`);
    process.exitCode = 1;
  });
}
