import { constants } from "node:fs";
import { lstat, opendir, open, realpath } from "node:fs/promises";
import path from "node:path";
import { isUtf8RoundTrip, sha256Bytes, sha256Value } from "./canonical.mjs";

export class DependencyError extends Error {
  constructor(code, message, terminal = false) {
    super(message);
    this.name = "DependencyError";
    this.code = code;
    this.terminal = terminal;
  }
}

function fail(code, message, terminal = false) {
  throw new DependencyError(code, message, terminal);
}

export function validateSelector(selector) {
  if (
    !selector ||
    selector.kind !== "subdirectory" ||
    typeof selector.path !== "string" ||
    selector.path.length === 0 ||
    path.posix.isAbsolute(selector.path) ||
    selector.path.includes("\\") ||
    selector.path.includes("\0") ||
    selector.path.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    fail("UNSAFE_SELECTOR", "selector must be a normalized repository-relative POSIX subdirectory", true);
  }
  return selector.path;
}

async function verifyNoFollowPath(repositoryRoot, selectorPath) {
  let current = repositoryRoot;
  for (const segment of selectorPath.split("/")) {
    current = path.join(current, segment);
    const stat = await lstat(current).catch((error) => {
      fail("SOURCE_UNAVAILABLE", `selector member unavailable: ${segment}: ${error.code}`);
    });
    if (stat.isSymbolicLink()) fail("TRUST_BOUNDARY_VIOLATION", `selector traverses symlink: ${segment}`, true);
    if (!stat.isDirectory()) fail("SOURCE_INVALID", `selector member is not a directory: ${segment}`);
  }
  const repositoryReal = await realpath(repositoryRoot);
  const selectorReal = await realpath(current);
  if (selectorReal !== repositoryReal && !selectorReal.startsWith(`${repositoryReal}${path.sep}`)) {
    fail("TRUST_BOUNDARY_VIOLATION", "selector resolves outside repository root", true);
  }
  return { repositoryReal, selectorReal };
}

async function enumerateFiles(directory, prefix = "") {
  const entries = [];
  const handle = await opendir(directory);
  for await (const entry of handle) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(directory, entry.name);
    const stat = await lstat(absolute, { bigint: true });
    if (stat.isSymbolicLink()) fail("TRUST_BOUNDARY_VIOLATION", `selected tree contains symlink: ${relative}`, true);
    if (stat.isDirectory()) {
      entries.push(...await enumerateFiles(absolute, relative));
    } else if (stat.isFile()) {
      entries.push({
        relative,
        absolute,
        mode: Number(stat.mode & 0o777n),
        device: stat.dev,
        inode: stat.ino
      });
    } else {
      fail("SOURCE_INVALID", `selected tree contains special file: ${relative}`);
    }
  }
  return entries.sort((left, right) => Buffer.from(left.relative).compare(Buffer.from(right.relative)));
}

async function observePass(selectorRoot, policy, afterEnumeration) {
  const entries = await enumerateFiles(selectorRoot);
  if (afterEnumeration) await afterEnumeration(entries.map(({ relative, absolute }) => ({ relative, absolute })));
  if (entries.length > policy.maxFiles) fail("SOURCE_BUDGET", `file count ${entries.length} exceeds ${policy.maxFiles}`);
  let totalBytes = 0;
  const items = [];
  for (const entry of entries) {
    let handle;
    try {
      handle = await open(entry.absolute, constants.O_RDONLY | constants.O_NOFOLLOW);
    } catch (error) {
      if (error.code === "ELOOP") {
        fail("TRUST_BOUNDARY_VIOLATION", `selected file became a symlink: ${entry.relative}`, true);
      }
      fail("SOURCE_UNSTABLE", `selected file could not be opened stably: ${entry.relative}: ${error.code}`);
    }
    let buffer;
    try {
      const opened = await handle.stat({ bigint: true });
      if (!opened.isFile()) fail("SOURCE_UNSTABLE", `opened member is no longer regular: ${entry.relative}`);
      if (opened.dev !== entry.device || opened.ino !== entry.inode) {
        fail("SOURCE_UNSTABLE", `selected member identity changed before open: ${entry.relative}`);
      }
      if (opened.size > BigInt(policy.maxFileBytes)) {
        fail("SOURCE_BUDGET", `${entry.relative} exceeds ${policy.maxFileBytes} bytes`);
      }
      if (
        BigInt(totalBytes) + opened.size >
          BigInt(policy.maxTotalBytes)
      ) {
        fail("SOURCE_BUDGET", `total bytes exceed ${policy.maxTotalBytes}`);
      }
      buffer = await handle.readFile();
      const completed = await handle.stat({ bigint: true });
      if (
        completed.dev !== opened.dev ||
        completed.ino !== opened.ino ||
        BigInt(buffer.length) !== completed.size
      ) {
        fail("SOURCE_UNSTABLE", `selected member changed while reading: ${entry.relative}`);
      }
    } finally {
      await handle.close();
    }
    if (buffer.length > policy.maxFileBytes) {
      fail("SOURCE_BUDGET", `${entry.relative} exceeds ${policy.maxFileBytes} bytes`);
    }
    totalBytes += buffer.length;
    if (totalBytes > policy.maxTotalBytes) fail("SOURCE_BUDGET", `total bytes exceed ${policy.maxTotalBytes}`);
    const utf8 = isUtf8RoundTrip(buffer);
    items.push({
      path: entry.relative.split(path.sep).join("/"),
      type: "regular-file",
      mode: entry.mode,
      mediaType: entry.relative.endsWith(".md") ? "text/markdown" : "application/octet-stream",
      contentEncoding: utf8 ? "utf8" : "base64",
      content: utf8 ? buffer.toString("utf8") : buffer.toString("base64"),
      byteLength: buffer.length,
      digest: sha256Bytes(buffer)
    });
  }
  return {
    items,
    totalBytes,
    inventoryDigest: sha256Value(items.map(({ path: itemPath, type, mode, byteLength, digest }) => ({
      path: itemPath,
      type,
      mode,
      byteLength,
      digest
    })))
  };
}

function validateCompatibility(observation, compatibility) {
  const paths = new Set(observation.items.map((item) => item.path));
  if (!paths.has(compatibility.requiredIndex)) {
    fail("SOURCE_INCOMPLETE", `required index ${compatibility.requiredIndex} is absent`);
  }
  const pattern = new RegExp(compatibility.entryPattern.expression);
  const entries = observation.items.filter((item) => pattern.test(item.path));
  if (entries.length === 0) fail("SOURCE_INCOMPLETE", "no compatible axiom entries were observed");
  for (const item of observation.items) {
    if (item.path === compatibility.requiredIndex) continue;
    if (!pattern.test(item.path)) fail("SOURCE_INCOMPATIBLE", `unexpected corpus member: ${item.path}`);
    if (item.mediaType !== compatibility.mediaType) fail("SOURCE_INCOMPATIBLE", `wrong media type: ${item.path}`);
  }
}

export async function captureReferenceSnapshot(descriptor, registry, observationHooks = {}) {
  if (descriptor.source.kind !== "git-repository" || descriptor.source.repository !== "apnex/mission-kit") {
    fail("WRONG_REPOSITORY", "descriptor repository identity is not apnex/mission-kit");
  }
  const selectorPath = validateSelector(descriptor.selector);
  const binding = registry?.bindings?.[descriptor.resolution.bindingKey];
  if (!binding) fail("MISSING_BINDING", `missing binding ${descriptor.resolution.bindingKey}`);
  if (
    binding.kind !== "host-registry" ||
    binding.repository !== descriptor.source.repository ||
    typeof binding.root !== "string" ||
    !path.isAbsolute(binding.root)
  ) {
    fail("WRONG_BINDING", "binding must attest the declared repository with one absolute host-registry root");
  }
  const rootStat = await lstat(binding.root).catch((error) => {
    fail("SOURCE_UNAVAILABLE", `repository root unavailable: ${error.code}`);
  });
  if (!rootStat.isDirectory() || rootStat.isSymbolicLink()) fail("WRONG_BINDING", "repository root is not a no-follow directory");
  const gitMarker = await lstat(path.join(binding.root, ".git")).catch(() => null);
  if (!gitMarker || gitMarker.isSymbolicLink() || (!gitMarker.isDirectory() && !gitMarker.isFile())) {
    fail("WRONG_BINDING", "host-registry target is not a Git worktree root");
  }

  const { repositoryReal, selectorReal } = await verifyNoFollowPath(binding.root, selectorPath);
  const observationStarted = new Date().toISOString();
  const first = await observePass(selectorReal, descriptor.snapshotPolicy, observationHooks.afterFirstEnumeration);
  const secondPath = await verifyNoFollowPath(repositoryReal, selectorPath);
  const second = await observePass(secondPath.selectorReal, descriptor.snapshotPolicy, observationHooks.afterSecondEnumeration);
  const observationCompleted = new Date().toISOString();
  if (
    first.inventoryDigest !== second.inventoryDigest ||
    sha256Value(first.items) !== sha256Value(second.items)
  ) {
    fail("SOURCE_UNSTABLE", "selected repository bytes or membership changed between full observation passes");
  }
  validateCompatibility(first, descriptor.compatibility);

  return {
    dependencyId: descriptor.id,
    repository: descriptor.source.repository,
    selector: descriptor.selector,
    resolverEvidence: {
      kind: "host-registry",
      bindingKey: descriptor.resolution.bindingKey,
      repositoryAssertion: binding.repository
    },
    observationInterval: {
      startedAt: observationStarted,
      completedAt: observationCompleted
    },
    inventory: first.items,
    fileCount: first.items.length,
    totalBytes: first.totalBytes,
    inventoryDigest: first.inventoryDigest,
    aggregateDigest: sha256Value(first.items),
    captureTool: {
      id: "urn:mission-kit:survey-v2:runtime:dependency-snapshot",
      profile: "two-full-byte-passes"
    }
  };
}
