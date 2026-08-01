#!/usr/bin/env node
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  mkdtemp,
  readFile,
  readdir,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  prettyJson,
  sha256Bytes,
  sha256Value,
  withoutKey
} from "../source/executables/runtime/lib/canonical.mjs";
import { validateById } from "../generated/validators.mjs";
import { surveyRoot } from "./fixtures/root.mjs";

const schemaId = "urn:mission-kit:survey-v2:schema:test-evidence:v1";

function safeOwnedPath(relativePath) {
  const target = path.resolve(surveyRoot, ...relativePath.split("/"));
  const relative = path.relative(surveyRoot, target);
  if (
    relative.startsWith("..") ||
    path.isAbsolute(relative) ||
    relativePath.includes("\\") ||
    relativePath.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`unsafe test evidence path: ${relativePath}`);
  }
  return target;
}

async function discover(directory, suffix, prefix = "") {
  const found = [];
  const entries = await readdir(directory, { withFileTypes: true });
  entries.sort((left, right) => Buffer.from(left.name).compare(Buffer.from(right.name)));
  for (const entry of entries) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      found.push(...await discover(absolute, suffix, relative));
    } else if (entry.isFile() && entry.name.endsWith(suffix)) {
      found.push(`tests/${relative}`);
    }
  }
  return found;
}

function runOne(executable) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--test", executable], {
      cwd: surveyRoot,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (exitCode, signal) => {
      resolve({
        exitCode,
        signal,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr)
      });
    });
  });
}

const packageManifestBytes = await readFile(path.join(surveyRoot, "survey-v2.package.json"));
const packageManifest = JSON.parse(packageManifestBytes);
const projectionLock = JSON.parse(await readFile(path.join(surveyRoot, "generated/projection-lock.json"), "utf8"));
const evidenceManifest = JSON.parse(
  await readFile(safeOwnedPath(packageManifest.testEvidenceManifest), "utf8")
);
const manifestValidation = validateById(schemaId, evidenceManifest);
if (!manifestValidation.valid) throw new Error(`invalid test manifest: ${manifestValidation.errors.join("; ")}`);

const entries = [];
for (const entry of evidenceManifest.tests) {
  const descriptorBytes = await readFile(safeOwnedPath(entry.descriptorPath));
  const descriptor = JSON.parse(descriptorBytes);
  const validation = validateById(schemaId, descriptor);
  if (!validation.valid) throw new Error(`${entry.descriptorPath}: ${validation.errors.join("; ")}`);
  if (descriptor.id !== entry.id) throw new Error(`test descriptor identity mismatch: ${entry.descriptorPath}`);
  entries.push({ entry, descriptor, descriptorBytes });
}
const executables = entries.map(({ descriptor }) => descriptor.executable);
if (new Set(executables).size !== executables.length) throw new Error("test executable membership is not one-to-one");
const registeredDescriptors = new Set(entries.map(({ entry }) => entry.descriptorPath));
const discoveredTests = new Set(await discover(path.join(surveyRoot, "tests"), ".test.mjs"));
const discoveredDescriptors = new Set(await discover(path.join(surveyRoot, "tests"), ".test.json"));
const registeredTests = new Set(executables);
for (const discovered of discoveredTests) {
  if (!registeredTests.has(discovered)) throw new Error(`unregistered test executable: ${discovered}`);
}
for (const registered of registeredTests) {
  if (!discoveredTests.has(registered)) throw new Error(`registered test executable is missing: ${registered}`);
}
for (const discovered of discoveredDescriptors) {
  if (!registeredDescriptors.has(discovered)) throw new Error(`unregistered test descriptor: ${discovered}`);
}
for (const registered of registeredDescriptors) {
  if (!discoveredDescriptors.has(registered)) throw new Error(`registered test descriptor is missing: ${registered}`);
}

const evidenceDirectory = await mkdtemp(path.join(os.tmpdir(), `survey-v2-test-evidence-${randomUUID()}-`));
let failed = false;
try {
  for (let index = 0; index < entries.length; index += 1) {
    const { entry, descriptor, descriptorBytes } = entries[index];
    const sourceBytes = await readFile(safeOwnedPath(descriptor.executable));
    const fixtures = [];
    for (const fixture of descriptor.fixtures) {
      fixtures.push({
        path: fixture,
        digest: sha256Bytes(await readFile(safeOwnedPath(fixture)))
      });
    }
    const execution = await runOne(descriptor.executable);
    process.stdout.write(execution.stdout);
    process.stderr.write(execution.stderr);
    const result = {
      $schema: schemaId,
      schemaVersion: "1.0.0",
      id: `urn:mission-kit:survey-v2:test-result:${String(index + 1).padStart(3, "0")}`,
      kind: "test-result",
      descriptor: {
        id: descriptor.id,
        path: entry.descriptorPath,
        digest: sha256Bytes(descriptorBytes),
        obligationId: descriptor.obligationId
      },
      source: {
        path: descriptor.executable,
        digest: sha256Bytes(sourceBytes)
      },
      fixtures,
      package: {
        id: packageManifest.id,
        version: packageManifest.version,
        projectionDigest: projectionLock.aggregateDigest,
        packageDigest: projectionLock.packageDigest
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch
      },
      runner: {
        id: "node:test",
        invocation: [process.execPath, "--test", descriptor.executable],
        exitCode: execution.exitCode,
        signal: execution.signal
      },
      output: {
        stdoutDigest: sha256Bytes(execution.stdout),
        stderrDigest: sha256Bytes(execution.stderr),
        stdoutBytes: execution.stdout.length,
        stderrBytes: execution.stderr.length
      },
      status: execution.exitCode === 0 && execution.signal === null ? "pass" : "fail",
      resultDigest: "sha256:".padEnd(71, "0")
    };
    result.resultDigest = sha256Value(withoutKey(result, "resultDigest"));
    const validation = validateById(schemaId, result);
    if (!validation.valid) throw new Error(`result for ${descriptor.id} is invalid: ${validation.errors.join("; ")}`);
    if (result.resultDigest !== sha256Value(withoutKey(result, "resultDigest"))) {
      throw new Error(`result digest failed self-excluding verification: ${descriptor.id}`);
    }
    await writeFile(path.join(evidenceDirectory, `${String(index + 1).padStart(3, "0")}.json`), prettyJson(result));
    if (result.status !== "pass") failed = true;
  }
} finally {
  await rm(evidenceDirectory, { recursive: true, force: true });
}
if (failed) process.exitCode = 1;
