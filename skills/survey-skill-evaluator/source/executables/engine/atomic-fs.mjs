import {
  constants as fsConstants,
  open,
  rename,
  link,
  unlink,
  mkdir,
  lstat,
} from "node:fs/promises";
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
import { randomUUID } from "node:crypto";
import { canonicalBytes, parseStrictJson } from "./canonical-json.mjs";
import { ConflictError, IntegrityError, ValidationError } from "./errors.mjs";

const SAFE_SEGMENT = /^[A-Za-z0-9][A-Za-z0-9._-]{0,199}$/;
const DIRECTORY_OPEN_FLAGS =
  fsConstants.O_RDONLY |
  fsConstants.O_DIRECTORY |
  fsConstants.O_NOFOLLOW;
const FILE_READ_FLAGS = fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW;

function sameInode(left, right) {
  return left?.dev === right?.dev && left?.ino === right?.ino;
}

function sameFileObservation(left, right) {
  return (
    sameInode(left, right) &&
    left.size === right.size &&
    left.mtimeNs === right.mtimeNs &&
    left.ctimeNs === right.ctimeNs
  );
}

function isInside(root, target) {
  const rel = relative(root, target);
  return (
    rel === "" ||
    (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel))
  );
}

function missingPathError(path) {
  const error = new Error(`No such file or directory: ${path}`);
  error.code = "ENOENT";
  return error;
}

function normalizePayload(bytes) {
  return Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
}

function translateNoFollowError(error, path, expected = "file") {
  if (["ELOOP", "ENOTDIR"].includes(error?.code)) {
    return new IntegrityError(`Expected a no-follow ${expected}`, { path });
  }
  return error;
}

export function assertSafeSegment(value, label = "path segment") {
  if (
    typeof value !== "string" ||
    !SAFE_SEGMENT.test(value) ||
    value === "." ||
    value === ".."
  ) {
    throw new ValidationError(`Invalid ${label}`, { value });
  }
  return value;
}

export function resolveContained(root, ...segments) {
  const absoluteRoot = resolve(root);
  const target = resolve(absoluteRoot, ...segments);
  if (isInside(absoluteRoot, target)) return target;
  throw new ValidationError("Resolved path escapes its authority root", {
    root: absoluteRoot,
    target,
  });
}

async function openDirectoryNoFollow(path) {
  let before;
  let handle;
  try {
    before = await lstat(path, { bigint: true });
    if (before.isSymbolicLink() || !before.isDirectory()) {
      throw new IntegrityError("Expected a regular no-follow directory", { path });
    }
    handle = await open(path, DIRECTORY_OPEN_FLAGS);
    const after = await handle.stat({ bigint: true });
    if (!after.isDirectory() || !sameInode(before, after)) {
      throw new IntegrityError("Directory identity changed while opening", {
        path,
      });
    }
    return handle;
  } catch (error) {
    await handle?.close().catch(() => {});
    throw translateNoFollowError(error, path, "directory");
  }
}

function directoryEntryPath(handle, lexicalDirectory, name) {
  if (process.platform === "linux") {
    return join("/proc/self/fd", String(handle.fd), name);
  }
  return join(lexicalDirectory, name);
}

function directoryContext(handle, lexicalDirectory) {
  return {
    handle,
    lexicalDirectory,
    pathFor: (name) => directoryEntryPath(handle, lexicalDirectory, name),
  };
}

async function openChildDirectory(
  parent,
  segment,
  { create, mode },
) {
  const lexicalDirectory = join(parent.lexicalDirectory, segment);
  const entryPath = parent.pathFor(segment);
  if (create) {
    await mkdir(entryPath, { mode }).catch((error) => {
      if (error?.code !== "EEXIST") throw error;
    });
  }
  let before;
  try {
    before = await lstat(entryPath, { bigint: true });
  } catch (error) {
    if (!create && error?.code === "ENOENT") return null;
    throw error;
  }
  if (before.isSymbolicLink() || !before.isDirectory()) {
    throw new IntegrityError(
      "Contained directory path has a symlink or non-directory component",
      { directory: lexicalDirectory },
    );
  }
  let child;
  try {
    child = await open(entryPath, DIRECTORY_OPEN_FLAGS);
    const after = await child.stat({ bigint: true });
    if (!after.isDirectory() || !sameInode(before, after)) {
      throw new IntegrityError(
        "Contained directory identity changed during traversal",
        { directory: lexicalDirectory },
      );
    }
  } catch (error) {
    await child?.close().catch(() => {});
    throw translateNoFollowError(error, lexicalDirectory, "directory");
  }
  return directoryContext(child, lexicalDirectory);
}

async function openAbsoluteDirectory(
  directory,
  { create, mode },
) {
  const absoluteDirectory = resolve(directory);
  const root = parse(absoluteDirectory).root;
  let context = directoryContext(
    await openDirectoryNoFollow(root),
    root,
  );
  const segments = absoluteDirectory
    .slice(root.length)
    .split(sep)
    .filter(Boolean);
  try {
    for (const segment of segments) {
      const child = await openChildDirectory(context, segment, {
        create,
        mode,
      });
      if (child === null) {
        await context.handle.close();
        return null;
      }
      const parent = context;
      context = child;
      await parent.handle.close();
    }
    return context;
  } catch (error) {
    await context.handle.close().catch(() => {});
    throw error;
  }
}

async function openContainedDirectory(
  root,
  directory,
  { create = false, mode = 0o750 } = {},
) {
  const absoluteRoot = resolve(root);
  const absoluteDirectory = resolve(directory);
  if (!isInside(absoluteRoot, absoluteDirectory)) {
    throw new ValidationError("Directory escapes its authority root", {
      root: absoluteRoot,
      directory: absoluteDirectory,
    });
  }
  let context;
  try {
    context = await openAbsoluteDirectory(absoluteRoot, { create, mode });
  } catch (error) {
    if (!create && error?.code === "ENOENT") return null;
    throw error;
  }
  if (context === null) return null;
  const segments = relative(absoluteRoot, absoluteDirectory)
    .split(sep)
    .filter(Boolean);
  try {
    for (const segment of segments) {
      const child = await openChildDirectory(context, segment, {
        create,
        mode,
      });
      if (child === null) {
        await context.handle.close();
        return null;
      }
      const parent = context;
      context = child;
      await parent.handle.close();
    }
    return context;
  } catch (error) {
    await context.handle.close().catch(() => {});
    throw error;
  }
}

async function withTargetParent(
  target,
  { authorityRoot = null, create = false, mode = 0o750 } = {},
) {
  const parent = dirname(resolve(target));
  if (authorityRoot !== null) {
    const context = await openContainedDirectory(authorityRoot, parent, {
      create,
      mode,
    });
    if (context === null) throw missingPathError(parent);
    return context;
  }
  if (create) {
    await mkdir(parent, { recursive: true, mode });
  }
  const handle = await openDirectoryNoFollow(parent);
  return {
    handle,
    lexicalDirectory: parent,
    pathFor: (name) => directoryEntryPath(handle, parent, name),
  };
}

export async function ensureContainedDirectory(
  root,
  directory,
  { mode = 0o750 } = {},
) {
  const context = await openContainedDirectory(root, directory, {
    create: true,
    mode,
  });
  await context.handle.close();
  return resolve(directory);
}

export async function createContainedDirectoryOnce(
  root,
  directory,
  { mode = 0o700 } = {},
) {
  const absoluteDirectory = resolveContained(root, relative(resolve(root), resolve(directory)));
  const parent = await openContainedDirectory(root, dirname(absoluteDirectory), {
    create: true,
    mode,
  });
  const name = basename(absoluteDirectory);
  try {
    const entryPath = parent.pathFor(name);
    await mkdir(entryPath, { mode });
    const child = await openDirectoryNoFollow(entryPath);
    await child.close();
    await parent.handle.sync();
    return absoluteDirectory;
  } finally {
    await parent.handle.close();
  }
}

export async function fsyncDirectoryNoFollow(
  path,
  { authorityRoot = null } = {},
) {
  const context =
    authorityRoot === null
      ? {
          handle: await openDirectoryNoFollow(path),
        }
      : await openContainedDirectory(authorityRoot, path);
  if (context === null) throw missingPathError(path);
  try {
    await context.handle.sync();
  } finally {
    await context.handle.close();
  }
}

async function readEntryIdentity(context, name) {
  const path = context.pathFor(name);
  let handle;
  try {
    handle = await open(path, FILE_READ_FLAGS);
    const before = await handle.stat({ bigint: true });
    if (!before.isFile()) {
      throw new IntegrityError("Expected a regular no-follow file", {
        path: join(context.lexicalDirectory, name),
      });
    }
    const bytes = await handle.readFile();
    const after = await handle.stat({ bigint: true });
    if (
      !sameFileObservation(before, after) ||
      BigInt(bytes.length) !== after.size
    ) {
      throw new IntegrityError("File identity changed while reading", {
        path: join(context.lexicalDirectory, name),
      });
    }
    const linked = await lstat(path, { bigint: true });
    if (
      linked.isSymbolicLink() ||
      !linked.isFile() ||
      !sameFileObservation(after, linked)
    ) {
      throw new IntegrityError("File path changed while reading", {
        path: join(context.lexicalDirectory, name),
      });
    }
    return { bytes, stat: after };
  } catch (error) {
    throw translateNoFollowError(
      error,
      join(context.lexicalDirectory, name),
    );
  } finally {
    await handle?.close().catch(() => {});
  }
}

async function unlinkEntryIfIdentity(context, name, identity) {
  const path = context.pathFor(name);
  try {
    const observed = await lstat(path, { bigint: true });
    if (
      observed.isSymbolicLink() ||
      !observed.isFile() ||
      !sameInode(observed, identity)
    ) {
      throw new IntegrityError("Refusing to unlink a changed file identity", {
        path: join(context.lexicalDirectory, name),
      });
    }
    await unlink(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

async function writeTemp(context, targetName, bytes, mode) {
  const temporaryName = `.${targetName}.${process.pid}.${randomUUID()}.tmp`;
  const temporaryPath = context.pathFor(temporaryName);
  let handle;
  let identity;
  try {
    handle = await open(
      temporaryPath,
      fsConstants.O_CREAT |
        fsConstants.O_EXCL |
        fsConstants.O_WRONLY |
        fsConstants.O_NOFOLLOW,
      mode,
    );
    identity = await handle.stat({ bigint: true });
    if (!identity.isFile()) {
      throw new IntegrityError("Atomic temporary target is not a regular file", {
        path: join(context.lexicalDirectory, temporaryName),
      });
    }
    await handle.writeFile(bytes);
    await handle.sync();
    const completeIdentity = await handle.stat({ bigint: true });
    if (
      !sameInode(identity, completeIdentity) ||
      completeIdentity.size !== BigInt(bytes.length)
    ) {
      throw new IntegrityError("Atomic temporary file changed while writing", {
        path: join(context.lexicalDirectory, temporaryName),
      });
    }
    identity = completeIdentity;
    await handle.close();
    handle = null;
    return { name: temporaryName, stat: identity };
  } catch (error) {
    await handle?.close().catch(() => {});
    if (identity) {
      await unlinkEntryIfIdentity(context, temporaryName, identity).catch(() => {});
    }
    throw error;
  }
}

export async function atomicReplace(
  target,
  bytes,
  { mode = 0o640, authorityRoot = null } = {},
) {
  const payload = normalizePayload(bytes);
  const context = await withTargetParent(target, {
    authorityRoot,
    create: true,
  });
  const targetName = basename(target);
  let temporary;
  try {
    temporary = await writeTemp(context, targetName, payload, mode);
    await rename(context.pathFor(temporary.name), context.pathFor(targetName));
    const published = await lstat(context.pathFor(targetName), { bigint: true });
    if (
      published.isSymbolicLink() ||
      !published.isFile() ||
      !sameInode(published, temporary.stat)
    ) {
      throw new IntegrityError("Atomic replacement published a changed inode", {
        target,
      });
    }
    await context.handle.sync();
  } catch (error) {
    if (temporary) {
      await unlinkEntryIfIdentity(context, temporary.name, temporary.stat).catch(
        () => {},
      );
    }
    throw error;
  } finally {
    await context.handle.close();
  }
}

export async function atomicCreateOnce(
  target,
  bytes,
  {
    mode = 0o640,
    identicalIsNoop = true,
    authorityRoot = null,
  } = {},
) {
  const payload = normalizePayload(bytes);
  const context = await withTargetParent(target, {
    authorityRoot,
    create: true,
  });
  const targetName = basename(target);
  let temporary;
  try {
    temporary = await writeTemp(context, targetName, payload, mode);
    try {
      await link(context.pathFor(temporary.name), context.pathFor(targetName));
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      await unlinkEntryIfIdentity(context, temporary.name, temporary.stat);
      temporary = null;
      if (!identicalIsNoop) {
        throw new ConflictError(
          "Create-once target already exists with different bytes",
          { target },
        );
      }
      const existing = await readEntryIdentity(context, targetName);
      if (Buffer.compare(existing.bytes, payload) === 0) {
        return { created: false, identical: true };
      }
      throw new ConflictError(
        "Create-once target already exists with different bytes",
        { target },
      );
    }
    const published = await lstat(context.pathFor(targetName), { bigint: true });
    if (
      published.isSymbolicLink() ||
      !published.isFile() ||
      !sameInode(published, temporary.stat)
    ) {
      throw new IntegrityError("Create-once publication linked a changed inode", {
        target,
      });
    }
    await unlinkEntryIfIdentity(context, temporary.name, temporary.stat);
    temporary = null;
    await context.handle.sync();
    return { created: true, identical: false };
  } catch (error) {
    if (temporary) {
      await unlinkEntryIfIdentity(context, temporary.name, temporary.stat).catch(
        () => {},
      );
    }
    throw error;
  } finally {
    await context.handle.close();
  }
}

export async function readFileNoFollow(path, { authorityRoot = null } = {}) {
  const context = await withTargetParent(path, { authorityRoot });
  try {
    return (await readEntryIdentity(context, basename(path))).bytes;
  } finally {
    await context.handle.close();
  }
}

export async function readJsonFile(path, options = {}) {
  return parseStrictJson(
    (await readFileNoFollow(path, options)).toString("utf8"),
  );
}

export async function writeCanonicalJson(path, value, options = {}) {
  const bytes = canonicalBytes(value);
  if (options.createOnce) {
    return atomicCreateOnce(path, bytes, options);
  }
  await atomicReplace(path, bytes, options);
  return { created: true, identical: false };
}

function processExists(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) return true;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code !== "ESRCH";
  }
}

function verifyLockOwner(owner, lockPath) {
  if (
    !owner ||
    typeof owner !== "object" ||
    Array.isArray(owner) ||
    Object.keys(owner).sort().join(",") !== "createdAtMs,pid,token" ||
    typeof owner.token !== "string" ||
    owner.token.length === 0 ||
    !Number.isSafeInteger(owner.pid) ||
    owner.pid <= 0 ||
    !Number.isSafeInteger(owner.createdAtMs) ||
    owner.createdAtMs < 0
  ) {
    throw new IntegrityError("Lock owner record is malformed", { lockPath });
  }
  return owner;
}

async function observeLock(lockPath, authorityRoot) {
  const context = await withTargetParent(lockPath, { authorityRoot });
  try {
    const observation = await readEntryIdentity(context, basename(lockPath));
    return {
      ...observation,
      owner: verifyLockOwner(
        parseStrictJson(observation.bytes.toString("utf8")),
        lockPath,
      ),
    };
  } finally {
    await context.handle.close();
  }
}

async function retireObservedLock(
  lockPath,
  observation,
  kind,
  authorityRoot,
) {
  const context = await withTargetParent(lockPath, { authorityRoot });
  const lockName = basename(lockPath);
  const retiredName = `.evaluator-lock.${kind}.${randomUUID()}`;
  const retiredPath = join(dirname(lockPath), retiredName);
  try {
    const immediatelyBefore = await lstat(context.pathFor(lockName), {
      bigint: true,
    }).catch((error) => {
      if (error?.code === "ENOENT") return null;
      throw error;
    });
    if (
      immediatelyBefore === null ||
      immediatelyBefore.isSymbolicLink() ||
      !immediatelyBefore.isFile() ||
      !sameInode(immediatelyBefore, observation.stat)
    ) {
      return null;
    }
    try {
      await rename(
        context.pathFor(lockName),
        context.pathFor(retiredName),
      );
    } catch (error) {
      if (error?.code === "ENOENT") return null;
      throw error;
    }
    await context.handle.sync();
    const moved = await readEntryIdentity(context, retiredName);
    if (
      !sameInode(moved.stat, observation.stat) ||
      Buffer.compare(moved.bytes, observation.bytes) !== 0
    ) {
      throw new IntegrityError(
        "Lock path changed during retirement; unexpected inode was preserved",
        { lockPath, retainedPath: retiredPath },
      );
    }
    return { name: retiredName, path: retiredPath, stat: moved.stat };
  } finally {
    await context.handle.close();
  }
}

async function removeRetiredLock(retired, observation, authorityRoot) {
  const context = await withTargetParent(retired.path, { authorityRoot });
  try {
    const current = await readEntryIdentity(context, retired.name);
    if (
      !sameInode(current.stat, observation.stat) ||
      Buffer.compare(current.bytes, observation.bytes) !== 0
    ) {
      throw new IntegrityError(
        "Retired lock changed before cleanup and was preserved",
        { retainedPath: retired.path },
      );
    }
    await unlinkEntryIfIdentity(context, retired.name, observation.stat);
    await context.handle.sync();
  } finally {
    await context.handle.close();
  }
}

async function acquireLock(
  lockPath,
  { timeoutMs, pollMs, staleMs, authorityRoot },
) {
  const started = Date.now();
  const owner = {
    token: randomUUID(),
    pid: process.pid,
    createdAtMs: Date.now(),
  };
  const bytes = canonicalBytes(owner);
  while (true) {
    try {
      await atomicCreateOnce(lockPath, bytes, {
        identicalIsNoop: false,
        mode: 0o600,
        authorityRoot,
      });
      const observation = await observeLock(lockPath, authorityRoot);
      if (
        observation.owner.token !== owner.token ||
        Buffer.compare(observation.bytes, bytes) !== 0
      ) {
        throw new IntegrityError("Published lock ownership changed", {
          lockPath,
        });
      }
      return observation;
    } catch (error) {
      if (!(error instanceof ConflictError)) throw error;
    }
    if (Date.now() - started >= timeoutMs) {
      throw new ConflictError("Timed out acquiring object lock", {
        lockPath,
        timeoutMs,
      });
    }
    let observation = null;
    try {
      observation = await observeLock(lockPath, authorityRoot);
    } catch (inspectionError) {
      if (inspectionError?.code === "ENOENT") continue;
      if (
        !(
          inspectionError instanceof IntegrityError ||
          inspectionError instanceof ValidationError
        )
      ) {
        throw inspectionError;
      }
      // Ambiguous or hostile lock state fails closed until timeout.
    }
    if (observation !== null) {
      const age = Date.now() - observation.owner.createdAtMs;
      if (age > staleMs && !processExists(observation.owner.pid)) {
        const retired = await retireObservedLock(
          lockPath,
          observation,
          "stale",
          authorityRoot,
        );
        if (retired === null) continue;
        await writeCanonicalJson(
          `${retired.path}.recovery.json`,
          {
            kind: "dead_process_lock_recovered",
            lockPath,
            observedOwner: observation.owner,
            recoveredAtMs: Date.now(),
          },
          { createOnce: true, mode: 0o600, authorityRoot },
        );
        await removeRetiredLock(retired, observation, authorityRoot);
        continue;
      }
    }
    await new Promise((resolvePromise) =>
      setTimeout(resolvePromise, pollMs),
    );
  }
}

async function releaseLock(lockPath, acquired, authorityRoot) {
  const observation = await observeLock(lockPath, authorityRoot);
  if (
    observation.owner.token !== acquired.owner.token ||
    !sameInode(observation.stat, acquired.stat)
  ) {
    throw new IntegrityError("Lock ownership changed before release", {
      lockPath,
      expectedToken: acquired.owner.token,
      actualToken: observation.owner.token,
    });
  }
  const retired = await retireObservedLock(
    lockPath,
    observation,
    "release",
    authorityRoot,
  );
  if (retired === null) {
    throw new IntegrityError("Lock path changed during release", { lockPath });
  }
  await removeRetiredLock(retired, observation, authorityRoot);
}

export async function withFileLock(
  target,
  operation,
  {
    timeoutMs = 10_000,
    pollMs = 10,
    staleMs = 120_000,
    authorityRoot = null,
  } = {},
) {
  const lockPath = `${target}.lock`;
  const acquired = await acquireLock(lockPath, {
    timeoutMs,
    pollMs,
    staleMs,
    authorityRoot,
  });
  try {
    return await operation();
  } finally {
    await releaseLock(lockPath, acquired, authorityRoot);
  }
}

export async function assertNoSymlinkAncestors(root, target) {
  const absoluteRoot = resolve(root);
  const absoluteTarget = resolve(target);
  if (!isInside(absoluteRoot, absoluteTarget)) {
    throw new ValidationError("Target escapes canonical root", {
      root: absoluteRoot,
      target: absoluteTarget,
    });
  }
  const parent =
    absoluteTarget === absoluteRoot ? absoluteRoot : dirname(absoluteTarget);
  const context = await openContainedDirectory(absoluteRoot, parent);
  await context?.handle.close();
}

export async function exists(path, { authorityRoot = null } = {}) {
  let context;
  try {
    context = await withTargetParent(path, { authorityRoot });
    await lstat(context.pathFor(basename(path)));
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw translateNoFollowError(error, path);
  } finally {
    await context?.handle.close().catch(() => {});
  }
}
