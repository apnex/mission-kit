import { constants } from "node:fs";
import {
  lstat,
  mkdir,
  open,
} from "node:fs/promises";
import {
  randomBytes as systemRandomBytes,
  timingSafeEqual,
} from "node:crypto";
import os from "node:os";
import path from "node:path";
import { types } from "node:util";

export const SURVEYCTL_SOURCE_MAX_FILES = 256;
export const SURVEYCTL_SOURCE_MAX_FILE_BYTES = 1_048_576;
export const SURVEYCTL_SOURCE_MAX_TOTAL_BYTES = 16_777_216;
export const SURVEYCTL_INPUT_MAX_BYTES = 1_048_576;

const digestPattern = /^sha256:[0-9a-f]{64}$/u;
const sourceNamePattern =
  /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/u;
const keyDirectoryMode = 0o700;
const keyFileMode = 0o600;
const statIdentityFields = [
  "dev",
  "ino",
  "mode",
  "nlink",
  "uid",
  "gid",
  "rdev",
  "size",
  "mtimeNs",
  "ctimeNs",
];
const pathIdentityFields = [
  "dev",
  "ino",
  "mode",
  "uid",
  "gid",
  "rdev",
];

export class SurveyctlIoError extends Error {
  constructor(code, message, cause) {
    super(message, cause === undefined ? undefined : { cause });
    this.name = "SurveyctlIoError";
    this.code = code;
  }
}

function fail(code, message, cause) {
  throw new SurveyctlIoError(code, message, cause);
}

function isRecord(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    !types.isProxy(value)
  );
}

function dataProperty(object, key, label) {
  if (!isRecord(object)) {
    fail("SURVEYCTL_IO_OPTIONS_INVALID", `${label} must be one object`);
  }
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  if (
    descriptor === undefined ||
    descriptor.enumerable !== true ||
    !Object.prototype.hasOwnProperty.call(descriptor, "value")
  ) {
    fail(
      "SURVEYCTL_IO_OPTIONS_INVALID",
      `${label}.${key} must be one enumerable data property`,
    );
  }
  return descriptor.value;
}

function optionalDataProperty(object, key, label) {
  if (!Object.hasOwn(object, key)) return undefined;
  return dataProperty(object, key, label);
}

function assertAbsolutePath(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.includes("\0") ||
    !path.isAbsolute(value)
  ) {
    fail(
      "SURVEYCTL_PATH_INVALID",
      `${label} must be one explicit absolute path`,
    );
  }
  return path.resolve(value);
}

function assertDenseArray(value, label) {
  if (!Array.isArray(value) || types.isProxy(value)) {
    fail("SURVEYCTL_IO_OPTIONS_INVALID", `${label} must be one array`);
  }
  const keys = Reflect.ownKeys(value);
  if (
    keys.some((key) => {
      if (key === "length") return false;
      return (
        typeof key !== "string" ||
        !/^(?:0|[1-9][0-9]*)$/u.test(key) ||
        Number(key) >= value.length
      );
    }) ||
    Array.from({ length: value.length }, (_, index) =>
      Object.getOwnPropertyDescriptor(value, String(index))
    ).some(
      (descriptor) =>
        descriptor?.enumerable !== true ||
        !Object.prototype.hasOwnProperty.call(descriptor, "value"),
    )
  ) {
    fail(
      "SURVEYCTL_IO_OPTIONS_INVALID",
      `${label} must be dense and contain no ambient properties`,
    );
  }
  return Array.from(
    { length: value.length },
    (_, index) => value[index],
  );
}

function sourceRelativePath(value, index) {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > 512 ||
    value.includes("\\") ||
    value.includes("\0") ||
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value) ||
    !sourceNamePattern.test(value) ||
    value.split("/").some(
      (segment) =>
        segment === "" || segment === "." || segment === "..",
    ) ||
    path.posix.normalize(value) !== value
  ) {
    fail(
      "SURVEYCTL_SOURCE_PATH_INVALID",
      `source ${index + 1} must be one normalized relative POSIX file path`,
    );
  }
  return value;
}

function statIdentity(stat) {
  return statIdentityFields.map((field) => {
    const value = stat[field];
    return value === undefined ? null : String(value);
  }).join("\u0000");
}

function modeOf(stat) {
  return Number(stat.mode & 0o777n);
}

function sameIdentity(left, right) {
  return statIdentity(left) === statIdentity(right);
}

function pathIdentity(stat) {
  return pathIdentityFields.map((field) =>
    String(stat[field])
  ).join("\u0000");
}

function samePathIdentity(left, right) {
  return pathIdentity(left) === pathIdentity(right);
}

function absoluteSegments(absolute) {
  const parsed = path.parse(absolute);
  const relative = absolute.slice(parsed.root.length);
  const segments = relative.split(path.sep).filter(Boolean);
  const paths = [parsed.root];
  let current = parsed.root;
  for (const segment of segments) {
    current = path.join(current, segment);
    paths.push(current);
  }
  return paths;
}

async function inspectAbsoluteChain(
  absolute,
  {
    finalType,
    label,
  },
) {
  const observed = [];
  const members = absoluteSegments(absolute);
  for (const [index, member] of members.entries()) {
    let stat;
    try {
      stat = await lstat(member, { bigint: true });
    } catch (error) {
      fail(
        "SURVEYCTL_PATH_UNAVAILABLE",
        `${label} is unavailable`,
        error,
      );
    }
    if (stat.isSymbolicLink()) {
      fail(
        "SURVEYCTL_SYMLINK_FORBIDDEN",
        `${label} traverses a symbolic link`,
      );
    }
    const final = index === members.length - 1;
    if (!final && !stat.isDirectory()) {
      fail(
        "SURVEYCTL_PATH_INVALID",
        `${label} traverses a non-directory ancestor`,
      );
    }
    if (
      final &&
      (
        (finalType === "directory" && !stat.isDirectory()) ||
        (finalType === "file" && !stat.isFile())
      )
    ) {
      fail(
        "SURVEYCTL_PATH_INVALID",
        `${label} must be a regular ${finalType}`,
      );
    }
    observed.push({ member, stat });
  }
  return observed;
}

function sameChain(left, right) {
  return (
    left.length === right.length &&
    left.every(
      (entry, index) =>
        entry.member === right[index].member &&
        samePathIdentity(entry.stat, right[index].stat),
    )
  );
}

async function readOnePass(
  absolute,
  {
    label,
    maxBytes,
    validateStat,
  },
) {
  const chainBefore = await inspectAbsoluteChain(absolute, {
    finalType: "file",
    label,
  });
  const observedLeaf = chainBefore.at(-1).stat;
  if (observedLeaf.size > BigInt(maxBytes)) {
    fail(
      "SURVEYCTL_FILE_BUDGET_EXCEEDED",
      `${label} exceeds ${maxBytes} bytes`,
    );
  }
  if (validateStat !== undefined) validateStat(observedLeaf);

  let handle;
  try {
    handle = await open(
      absolute,
      constants.O_RDONLY | constants.O_NOFOLLOW,
    );
  } catch (error) {
    fail(
      error?.code === "ELOOP"
        ? "SURVEYCTL_SYMLINK_FORBIDDEN"
        : "SURVEYCTL_FILE_UNREADABLE",
      `${label} cannot be opened without following links`,
      error,
    );
  }
  try {
    const opened = await handle.stat({ bigint: true });
    if (
      !opened.isFile() ||
      !samePathIdentity(opened, observedLeaf)
    ) {
      fail(
        "SURVEYCTL_FILE_UNSTABLE",
        `${label} changed before it was opened`,
      );
    }
    if (validateStat !== undefined) validateStat(opened);
    const bytes = await handle.readFile();
    const completed = await handle.stat({ bigint: true });
    if (
      bytes.byteLength > maxBytes ||
      BigInt(bytes.byteLength) !== completed.size ||
      !sameIdentity(opened, completed)
    ) {
      fail(
        "SURVEYCTL_FILE_UNSTABLE",
        `${label} changed while it was read`,
      );
    }
    if (validateStat !== undefined) validateStat(completed);
    const chainAfter = await inspectAbsoluteChain(absolute, {
      finalType: "file",
      label,
    });
    if (
      !sameChain(chainBefore, chainAfter) ||
      !samePathIdentity(
        completed,
        chainAfter.at(-1).stat,
      )
    ) {
      fail(
        "SURVEYCTL_FILE_UNSTABLE",
        `${label} path identity changed while it was read`,
      );
    }
    return {
      bytes,
      stat: completed,
      chain: chainAfter,
    };
  } finally {
    await handle.close();
  }
}

async function readStableAbsoluteFile(
  absoluteInput,
  {
    label,
    maxBytes,
    validateStat,
  },
) {
  const absolute = assertAbsolutePath(absoluteInput, label);
  const first = await readOnePass(absolute, {
    label,
    maxBytes,
    validateStat,
  });
  const second = await readOnePass(absolute, {
    label,
    maxBytes,
    validateStat,
  });
  if (
    !samePathIdentity(first.stat, second.stat) ||
    !sameChain(first.chain, second.chain) ||
    !first.bytes.equals(second.bytes)
  ) {
    fail(
      "SURVEYCTL_FILE_UNSTABLE",
      `${label} changed between stable reads`,
    );
  }
  return {
    absolute,
    bytes: Buffer.from(second.bytes),
    stat: second.stat,
  };
}

/**
 * Capture the explicit source argv closure as ordered {logicalName,bytes}
 * values suitable for buildSurveySourceSnapshot.
 */
export async function captureSourceFiles(options) {
  const sourceRootInput = dataProperty(
    options,
    "sourceRoot",
    "source capture options",
  );
  const sourcesInput = dataProperty(
    options,
    "sources",
    "source capture options",
  );
  if (Reflect.ownKeys(options).length !== 2) {
    fail(
      "SURVEYCTL_IO_OPTIONS_INVALID",
      "source capture options require exactly sourceRoot and sources",
    );
  }
  const sourceRoot = assertAbsolutePath(
    sourceRootInput,
    "source root",
  );
  const rootBefore = await inspectAbsoluteChain(sourceRoot, {
    finalType: "directory",
    label: "source root",
  });
  const sources = assertDenseArray(sourcesInput, "sources");
  if (
    sources.length < 1 ||
    sources.length > SURVEYCTL_SOURCE_MAX_FILES
  ) {
    fail(
      "SURVEYCTL_SOURCE_COUNT_INVALID",
      `source capture requires 1..${SURVEYCTL_SOURCE_MAX_FILES} files`,
    );
  }

  const logicalNames = [];
  const seenNames = new Set();
  for (const [index, value] of sources.entries()) {
    const logicalName = sourceRelativePath(value, index);
    if (seenNames.has(logicalName)) {
      fail(
        "SURVEYCTL_SOURCE_DUPLICATE",
        `source ${index + 1} duplicates ${logicalName}`,
      );
    }
    seenNames.add(logicalName);
    logicalNames.push(logicalName);
  }

  const entries = [];
  const seenFiles = new Set();
  let aggregateBytes = 0;
  for (const [index, logicalName] of logicalNames.entries()) {
    const absolute = path.join(
      sourceRoot,
      ...logicalName.split("/"),
    );
    const relative = path.relative(sourceRoot, absolute);
    if (
      relative === "" ||
      relative.startsWith(`..${path.sep}`) ||
      relative === ".." ||
      path.isAbsolute(relative)
    ) {
      fail(
        "SURVEYCTL_SOURCE_PATH_INVALID",
        `source ${index + 1} escapes the source root`,
      );
    }
    const observed = await readStableAbsoluteFile(absolute, {
      label: `source ${index + 1}`,
      maxBytes: SURVEYCTL_SOURCE_MAX_FILE_BYTES,
    });
    const fileIdentity =
      `${observed.stat.dev}\u0000${observed.stat.ino}`;
    if (seenFiles.has(fileIdentity)) {
      fail(
        "SURVEYCTL_SOURCE_DUPLICATE",
        `source ${index + 1} aliases an already captured regular file`,
      );
    }
    seenFiles.add(fileIdentity);
    aggregateBytes += observed.bytes.byteLength;
    if (aggregateBytes > SURVEYCTL_SOURCE_MAX_TOTAL_BYTES) {
      fail(
        "SURVEYCTL_SOURCE_BUDGET_EXCEEDED",
        `source capture exceeds ${SURVEYCTL_SOURCE_MAX_TOTAL_BYTES} bytes`,
      );
    }
    entries.push(Object.freeze({
      logicalName,
      bytes: observed.bytes,
    }));
  }

  const rootAfter = await inspectAbsoluteChain(sourceRoot, {
    finalType: "directory",
    label: "source root",
  });
  if (!sameChain(rootBefore, rootAfter)) {
    fail(
      "SURVEYCTL_SOURCE_ROOT_UNSTABLE",
      "source root identity changed during capture",
    );
  }
  return Object.freeze(entries);
}

async function readBoundedStream(stream, maxBytes) {
  if (
    stream === null ||
    stream === undefined ||
    typeof stream[Symbol.asyncIterator] !== "function"
  ) {
    fail(
      "SURVEYCTL_STDIN_INVALID",
      "stdin must be one asynchronous byte stream",
    );
  }
  const chunks = [];
  let total = 0;
  for await (const chunk of stream) {
    if (!(chunk instanceof Uint8Array)) {
      fail(
        "SURVEYCTL_STDIN_INVALID",
        "stdin must remain in binary mode and emit byte chunks",
      );
    }
    const bytes = Buffer.from(chunk);
    total += bytes.byteLength;
    if (total > maxBytes) {
      fail(
        "SURVEYCTL_INPUT_BUDGET_EXCEEDED",
        `input exceeds ${maxBytes} bytes`,
      );
    }
    chunks.push(bytes);
  }
  return Buffer.concat(chunks, total);
}

/**
 * Read one exact submission carrier. "-" means stdin; file carriers must be
 * explicit absolute regular files and pass two no-follow observations.
 */
export async function readStrictInput(options) {
  const input = dataProperty(options, "input", "input options");
  const stdin =
    optionalDataProperty(options, "stdin", "input options") ??
    process.stdin;
  const maxBytes =
    optionalDataProperty(options, "maxBytes", "input options") ??
    SURVEYCTL_INPUT_MAX_BYTES;
  const allowed = new Set(["input", "stdin", "maxBytes"]);
  if (
    Reflect.ownKeys(options).some(
      (key) => typeof key !== "string" || !allowed.has(key),
    ) ||
    typeof input !== "string" ||
    input.length === 0 ||
    !Number.isSafeInteger(maxBytes) ||
    maxBytes < 1
  ) {
    fail(
      "SURVEYCTL_IO_OPTIONS_INVALID",
      "input options require input and optional stdin or positive maxBytes",
    );
  }
  if (input === "-") {
    return readBoundedStream(stdin, maxBytes);
  }
  if (!path.isAbsolute(input)) {
    fail(
      "SURVEYCTL_INPUT_PATH_INVALID",
      "input file must be '-' or one explicit absolute path",
    );
  }
  const observed = await readStableAbsoluteFile(input, {
    label: "input file",
    maxBytes,
  });
  return observed.bytes;
}

function assertDigest(value, label) {
  if (typeof value !== "string" || !digestPattern.test(value)) {
    fail(
      "SURVEYCTL_JOURNAL_KEY_DIGEST_INVALID",
      `${label} must be one canonical sha256 digest`,
    );
  }
  return value;
}

export function journalKeyFileName(identityBindingDigest) {
  const digest = assertDigest(
    identityBindingDigest,
    "identity binding digest",
  );
  return `sha256-${digest.slice("sha256:".length)}.key`;
}

function environmentValue(environment, key) {
  const value = environment?.[key];
  if (value === undefined || value === "") return undefined;
  if (typeof value !== "string") {
    fail(
      "SURVEYCTL_JOURNAL_KEY_LOCATION_INVALID",
      `${key} must be one string path`,
    );
  }
  return value;
}

export function defaultJournalKeyRoot({
  environment = process.env,
  platform = process.platform,
  homeDirectory = os.homedir(),
} = {}) {
  const xdgStateHome = environmentValue(
    environment,
    "XDG_STATE_HOME",
  );
  let stateRoot;
  if (xdgStateHome !== undefined) {
    stateRoot = assertAbsolutePath(
      xdgStateHome,
      "XDG_STATE_HOME",
    );
  } else if (platform === "win32") {
    const localAppData =
      environmentValue(environment, "LOCALAPPDATA") ??
      environmentValue(environment, "APPDATA");
    stateRoot = localAppData === undefined
      ? path.join(
        assertAbsolutePath(homeDirectory, "home directory"),
        "AppData",
        "Local",
      )
      : assertAbsolutePath(localAppData, "platform state directory");
  } else if (platform === "darwin") {
    stateRoot = path.join(
      assertAbsolutePath(homeDirectory, "home directory"),
      "Library",
      "Application Support",
    );
  } else {
    stateRoot = path.join(
      assertAbsolutePath(homeDirectory, "home directory"),
      ".local",
      "state",
    );
  }
  return path.join(
    stateRoot,
    "mission-kit",
    "survey-v2",
    "journal-keys",
  );
}

async function ensureSecureDirectory(absoluteInput, label) {
  const absolute = assertAbsolutePath(absoluteInput, label);
  const members = absoluteSegments(absolute);
  for (const [index, member] of members.entries()) {
    let stat;
    try {
      stat = await lstat(member, { bigint: true });
    } catch (error) {
      if (error?.code !== "ENOENT") {
        fail(
          "SURVEYCTL_JOURNAL_KEY_DIRECTORY_INVALID",
          `${label} cannot be inspected`,
          error,
        );
      }
      try {
        await mkdir(member, { mode: keyDirectoryMode });
      } catch (createError) {
        if (createError?.code !== "EEXIST") {
          fail(
            "SURVEYCTL_JOURNAL_KEY_DIRECTORY_INVALID",
            `${label} cannot be created`,
            createError,
          );
        }
      }
      stat = await lstat(member, { bigint: true });
    }
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      fail(
        "SURVEYCTL_JOURNAL_KEY_DIRECTORY_INVALID",
        `${label} traverses a symlink or non-directory`,
      );
    }
    if (
      index === members.length - 1 &&
      modeOf(stat) !== keyDirectoryMode
    ) {
      fail(
        "SURVEYCTL_JOURNAL_KEY_DIRECTORY_MODE_INVALID",
        `${label} must have mode 0700`,
      );
    }
  }
  return absolute;
}

async function assertSecureDirectory(absoluteInput, label) {
  const absolute = assertAbsolutePath(absoluteInput, label);
  const chain = await inspectAbsoluteChain(absolute, {
    finalType: "directory",
    label,
  });
  if (modeOf(chain.at(-1).stat) !== keyDirectoryMode) {
    fail(
      "SURVEYCTL_JOURNAL_KEY_DIRECTORY_MODE_INVALID",
      `${label} must have mode 0700`,
    );
  }
  return absolute;
}

function validateKeyStat(stat) {
  if (
    !stat.isFile() ||
    modeOf(stat) !== keyFileMode ||
    stat.nlink !== 1n ||
    (
      typeof process.getuid === "function" &&
      stat.uid !== BigInt(process.getuid())
    )
  ) {
    fail(
      "SURVEYCTL_JOURNAL_KEY_FILE_INVALID",
      "journal key must be one owner-held mode-0600 regular file with one link",
    );
  }
}

async function readJournalKey(absolute) {
  const observed = await readStableAbsoluteFile(absolute, {
    label: "journal key file",
    maxBytes: 32,
    validateStat: validateKeyStat,
  });
  if (observed.bytes.byteLength !== 32) {
    observed.bytes.fill(0);
    fail(
      "SURVEYCTL_JOURNAL_KEY_LENGTH_INVALID",
      "journal key file must contain exactly 32 bytes",
    );
  }
  return observed.bytes;
}

async function fsyncDirectory(absolute) {
  let handle;
  try {
    handle = await open(
      absolute,
      constants.O_RDONLY |
        constants.O_DIRECTORY |
        constants.O_NOFOLLOW,
    );
    await handle.sync();
  } finally {
    await handle?.close();
  }
}

async function publishJournalKey(absolute, key) {
  let handle;
  let opened = false;
  let writeError;
  try {
    handle = await open(
      absolute,
      constants.O_WRONLY |
        constants.O_CREAT |
        constants.O_EXCL |
        constants.O_NOFOLLOW,
      keyFileMode,
    );
    opened = true;
    await handle.writeFile(key);
    await handle.sync();
  } catch (error) {
    if (error?.code === "EEXIST") return false;
    writeError = error;
  } finally {
    try {
      await handle?.close();
    } catch (error) {
      writeError ??= error;
    }
  }
  if (writeError !== undefined) {
    fail(
      "SURVEYCTL_JOURNAL_KEY_CREATE_FAILED",
      opened
        ? "journal key publication failed and its fail-closed exclusive path was retained"
        : "journal key could not be created exclusively",
      writeError,
    );
  }
  await fsyncDirectory(path.dirname(absolute));
  const retained = await readJournalKey(absolute);
  try {
    if (!timingSafeEqual(retained, key)) {
      fail(
        "SURVEYCTL_JOURNAL_KEY_CREATE_FAILED",
        "published journal key differs from generated bytes",
      );
    }
  } finally {
    retained.fill(0);
  }
  return true;
}

function assertNoRawBytes(value, seen = new Set()) {
  if (
    value instanceof ArrayBuffer ||
    ArrayBuffer.isView(value)
  ) {
    fail(
      "SURVEYCTL_JOURNAL_IDENTITY_INVALID",
      "identity configuration must not expose raw byte carriers",
    );
  }
  if (
    value === null ||
    (
      typeof value !== "object" &&
      typeof value !== "function"
    ) ||
    seen.has(value)
  ) {
    return;
  }
  seen.add(value);
  for (const key of Reflect.ownKeys(value)) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (Object.prototype.hasOwnProperty.call(descriptor ?? {}, "value")) {
      assertNoRawBytes(descriptor.value, seen);
    }
  }
}

async function invokeIdentityFactory(
  createIdentityConfiguration,
  key,
) {
  if (typeof createIdentityConfiguration !== "function") {
    fail(
      "SURVEYCTL_JOURNAL_IDENTITY_FACTORY_INVALID",
      "createIdentityConfiguration must be one function",
    );
  }
  const disclosed = Buffer.from(key);
  let configuration;
  try {
    configuration =
      await createIdentityConfiguration(disclosed);
  } catch {
    fail(
      "SURVEYCTL_JOURNAL_IDENTITY_CREATE_FAILED",
      "journal identity configuration could not be constructed",
    );
  } finally {
    disclosed.fill(0);
  }
  if (
    !isRecord(configuration) ||
    !isRecord(configuration.identityBinding)
  ) {
    fail(
      "SURVEYCTL_JOURNAL_IDENTITY_INVALID",
      "identity factory must return a configuration with identityBinding",
    );
  }
  const bindingDigest = assertDigest(
    configuration.identityBinding.digest,
    "constructed identity binding digest",
  );
  assertNoRawBytes(configuration);
  return { configuration, bindingDigest };
}

function selectedKeyLocation({
  keyRoot,
  keyFile,
  environment,
  platform,
  homeDirectory,
}) {
  if (keyRoot !== undefined && keyFile !== undefined) {
    fail(
      "SURVEYCTL_JOURNAL_KEY_LOCATION_CONFLICT",
      "keyRoot and keyFile are mutually exclusive",
    );
  }
  if (keyRoot !== undefined) {
    return {
      kind: "key-root",
      root: assertAbsolutePath(keyRoot, "journal key root"),
    };
  }
  if (keyFile !== undefined) {
    return {
      kind: "key-file",
      file: assertAbsolutePath(keyFile, "journal key file"),
    };
  }
  const environmentRoot = environmentValue(
    environment,
    "SURVEYCTL_KEY_ROOT",
  );
  const environmentFile = environmentValue(
    environment,
    "SURVEYCTL_JOURNAL_KEY_FILE",
  );
  if (
    environmentRoot !== undefined &&
    environmentFile !== undefined
  ) {
    fail(
      "SURVEYCTL_JOURNAL_KEY_LOCATION_CONFLICT",
      "SURVEYCTL_KEY_ROOT and SURVEYCTL_JOURNAL_KEY_FILE are mutually exclusive",
    );
  }
  if (environmentRoot !== undefined) {
    return {
      kind: "environment-key-root",
      root: assertAbsolutePath(
        environmentRoot,
        "SURVEYCTL_KEY_ROOT",
      ),
    };
  }
  if (environmentFile !== undefined) {
    return {
      kind: "environment-key-file",
      file: assertAbsolutePath(
        environmentFile,
        "SURVEYCTL_JOURNAL_KEY_FILE",
      ),
    };
  }
  return {
    kind: "default-key-root",
    root: defaultJournalKeyRoot({
      environment,
      platform,
      homeDirectory,
    }),
  };
}

function randomKey(randomBytes) {
  if (typeof randomBytes !== "function") {
    fail(
      "SURVEYCTL_JOURNAL_KEY_RANDOM_INVALID",
      "randomBytes must be one function",
    );
  }
  let value;
  try {
    value = randomBytes(32);
  } catch (error) {
    fail(
      "SURVEYCTL_JOURNAL_KEY_RANDOM_FAILED",
      "journal key generation failed",
      error,
    );
  }
  if (
    value instanceof Promise ||
    !(value instanceof Uint8Array) ||
    value.byteLength !== 32
  ) {
    fail(
      "SURVEYCTL_JOURNAL_KEY_RANDOM_INVALID",
      "randomBytes must synchronously return exactly 32 bytes",
    );
  }
  return Buffer.from(value);
}

function identityResult({
  configuration,
  bindingDigest,
  location,
  created,
}) {
  return Object.freeze({
    identityConfiguration: configuration,
    registry: Object.freeze({
      identityBindingDigest: bindingDigest,
      locationClass: location.kind,
      created,
    }),
  });
}

/**
 * Resolve a session journal identity without returning or retaining key bytes.
 * The injected identity factory receives a temporary 32-byte copy which is
 * zeroed as soon as its synchronous/asynchronous construction settles.
 */
export async function resolveJournalIdentity(options) {
  if (!isRecord(options)) {
    fail(
      "SURVEYCTL_IO_OPTIONS_INVALID",
      "journal identity options must be one object",
    );
  }
  const allowed = new Set([
    "expectedIdentityBindingDigest",
    "keyRoot",
    "keyFile",
    "createIdentityConfiguration",
    "environment",
    "platform",
    "homeDirectory",
    "randomBytes",
  ]);
  if (
    Reflect.ownKeys(options).some(
      (key) => typeof key !== "string" || !allowed.has(key),
    )
  ) {
    fail(
      "SURVEYCTL_IO_OPTIONS_INVALID",
      "journal identity options contain an unknown field",
    );
  }
  const expectedInput = optionalDataProperty(
    options,
    "expectedIdentityBindingDigest",
    "journal identity options",
  );
  const expected = expectedInput === undefined
    ? undefined
    : assertDigest(expectedInput, "expected identity binding digest");
  const createIdentityConfiguration = dataProperty(
    options,
    "createIdentityConfiguration",
    "journal identity options",
  );
  const keyRoot = optionalDataProperty(
    options,
    "keyRoot",
    "journal identity options",
  );
  const keyFile = optionalDataProperty(
    options,
    "keyFile",
    "journal identity options",
  );
  const environment =
    optionalDataProperty(
      options,
      "environment",
      "journal identity options",
    ) ?? process.env;
  const platform =
    optionalDataProperty(
      options,
      "platform",
      "journal identity options",
    ) ?? process.platform;
  const homeDirectory =
    optionalDataProperty(
      options,
      "homeDirectory",
      "journal identity options",
    ) ?? os.homedir();
  const randomBytes =
    optionalDataProperty(
      options,
      "randomBytes",
      "journal identity options",
    ) ?? systemRandomBytes;
  const location = selectedKeyLocation({
    keyRoot,
    keyFile,
    environment,
    platform,
    homeDirectory,
  });

  if (expected !== undefined) {
    let target;
    if (Object.hasOwn(location, "file")) {
      await assertSecureDirectory(
        path.dirname(location.file),
        "journal key directory",
      );
      target = location.file;
    } else {
      const root = await assertSecureDirectory(
        location.root,
        "journal key root",
      );
      target = path.join(root, journalKeyFileName(expected));
    }
    const key = await readJournalKey(target);
    try {
      const constructed = await invokeIdentityFactory(
        createIdentityConfiguration,
        key,
      );
      if (constructed.bindingDigest !== expected) {
        fail(
          "SURVEYCTL_JOURNAL_KEY_BINDING_MISMATCH",
          "journal key differs from the persisted identity binding",
        );
      }
      return identityResult({
        ...constructed,
        location,
        created: false,
      });
    } finally {
      key.fill(0);
    }
  }

  if (Object.hasOwn(location, "file")) {
    const directory = await ensureSecureDirectory(
      path.dirname(location.file),
      "journal key directory",
    );
    let existing;
    try {
      existing = await readJournalKey(location.file);
    } catch (error) {
      if (
        error?.code !== "SURVEYCTL_PATH_UNAVAILABLE" &&
        error?.cause?.code !== "ENOENT"
      ) {
        throw error;
      }
    }
    if (existing !== undefined) {
      try {
        const constructed = await invokeIdentityFactory(
          createIdentityConfiguration,
          existing,
        );
        return identityResult({
          ...constructed,
          location,
          created: false,
        });
      } finally {
        existing.fill(0);
      }
    }
    const generated = randomKey(randomBytes);
    try {
      const constructed = await invokeIdentityFactory(
        createIdentityConfiguration,
        generated,
      );
      const created = await publishJournalKey(
        location.file,
        generated,
      );
      if (!created) {
        const raced = await readJournalKey(location.file);
        try {
          if (!timingSafeEqual(raced, generated)) {
            fail(
              "SURVEYCTL_JOURNAL_KEY_CREATE_CONFLICT",
              "journal key file was concurrently created with different bytes",
            );
          }
        } finally {
          raced.fill(0);
        }
      }
      await fsyncDirectory(directory);
      return identityResult({
        ...constructed,
        location,
        created,
      });
    } finally {
      generated.fill(0);
    }
  }

  const root = await ensureSecureDirectory(
    location.root,
    "journal key root",
  );
  const generated = randomKey(randomBytes);
  try {
    const constructed = await invokeIdentityFactory(
      createIdentityConfiguration,
      generated,
    );
    const target = path.join(
      root,
      journalKeyFileName(constructed.bindingDigest),
    );
    const created = await publishJournalKey(target, generated);
    if (!created) {
      const existing = await readJournalKey(target);
      try {
        if (!timingSafeEqual(existing, generated)) {
          fail(
            "SURVEYCTL_JOURNAL_KEY_CREATE_CONFLICT",
            "identity-bound journal key path already contains different bytes",
          );
        }
      } finally {
        existing.fill(0);
      }
    }
    return identityResult({
      ...constructed,
      location,
      created,
    });
  } finally {
    generated.fill(0);
  }
}
