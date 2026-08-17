import {
  constants as fsConstants,
  chmod,
  lstat,
  mkdir,
  open,
  readdir,
  realpath,
  rm,
} from "node:fs/promises";
import {
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";
import {
  assertNoSymlinkAncestors,
  atomicCreateOnce,
  exists,
  readFileNoFollow,
  readJsonFile,
  resolveContained,
  withFileLock,
} from "../engine/atomic-fs.mjs";
import {
  canonicalBytes,
  canonicalize,
  deepCloneCanonical,
  deepFreeze,
} from "../engine/canonical-json.mjs";
import {
  ConflictError,
  IntegrityError,
  ValidationError,
} from "../engine/errors.mjs";
import {
  HASH_PROFILE_ID,
  foldPackageInventory,
  hashCanonical,
  rawSha256,
} from "../engine/hash.mjs";
import {
  verifySurveySubjectAdapterDescriptor,
} from "./subject-adapter-contract.mjs";

export const CANDIDATE_CAPTURE_ALGORITHM_ID =
  "stable-hostile-input-capture/v1";

export const DEFAULT_CANDIDATE_CAPTURE_LIMITS = Object.freeze({
  maximumDepth: 48,
  maximumFileCount: 4096,
  maximumFileBytes: 16 * 1024 * 1024,
  maximumTotalBytes: 128 * 1024 * 1024,
});

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/u;
const DIGEST = /^[a-f0-9]{64}$/u;
const UTF8_DECODER = new TextDecoder("utf-8", { fatal: true });

function compareUtf8(left, right) {
  return Buffer.from(left, "utf8").compare(Buffer.from(right, "utf8"));
}

function assertPlainObject(value, label) {
  if (
    value === null ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    ![Object.prototype, null].includes(Object.getPrototypeOf(value))
  ) {
    throw new ValidationError(`${label} must be a plain object`);
  }
}

function assertExactKeys(value, expected, label) {
  assertPlainObject(value, label);
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (canonicalize(actual) !== canonicalize(required)) {
    throw new ValidationError(`${label} has an unauthorized field set`, {
      expected: required,
      actual,
    });
  }
}

function assertIdentifier(value, label) {
  if (typeof value !== "string" || !IDENTIFIER.test(value)) {
    throw new ValidationError(`${label} must be an identifier`);
  }
}

function validateLimits(value) {
  assertExactKeys(
    value,
    [
      "maximumDepth",
      "maximumFileCount",
      "maximumFileBytes",
      "maximumTotalBytes",
    ],
    "candidate capture limits",
  );
  for (const [key, limit] of Object.entries(value)) {
    if (!Number.isSafeInteger(limit) || limit <= 0) {
      throw new ValidationError(`Candidate capture ${key} is invalid`);
    }
  }
  if (value.maximumFileBytes > value.maximumTotalBytes) {
    throw new ValidationError(
      "Candidate per-file limit cannot exceed its total-byte limit",
    );
  }
  if (
    canonicalize(value) !==
      canonicalize(DEFAULT_CANDIDATE_CAPTURE_LIMITS)
  ) {
    throw new ValidationError(
      "Candidate capture limits must match the evaluator policy",
    );
  }
  return deepFreeze(deepCloneCanonical(value));
}

function validateRelativePath(path) {
  if (
    typeof path !== "string" ||
    path.length === 0 ||
    path.startsWith("/") ||
    path.includes("\\") ||
    path.includes("\0")
  ) {
    throw new ValidationError("Candidate package path is unsafe", { path });
  }
  if (
    path.split("/").some((segment) =>
      segment === "" || segment === "." || segment === ".."
    )
  ) {
    throw new ValidationError("Candidate package path has an unsafe segment", {
      path,
    });
  }
  return path;
}

function decodePathSegment(bytes) {
  let value;
  try {
    value = UTF8_DECODER.decode(bytes);
  } catch (error) {
    throw new ValidationError(
      "Candidate package contains a non-UTF-8 path segment",
      {},
      { cause: error },
    );
  }
  if (
    value.length === 0 ||
    value === "." ||
    value === ".." ||
    value.includes("/") ||
    value.includes("\\") ||
    value.includes("\0")
  ) {
    throw new ValidationError("Candidate package path segment is unsafe", {
      segment: value,
    });
  }
  if (Buffer.compare(Buffer.from(value, "utf8"), bytes) !== 0) {
    throw new ValidationError(
      "Candidate package path is not a unique UTF-8 scalar encoding",
    );
  }
  return value;
}

function containedRelative(root, target, label) {
  const rel = relative(root, target);
  if (
    rel === "" ||
    rel === ".." ||
    rel.startsWith(`..${sep}`) ||
    isAbsolute(rel)
  ) {
    throw new ValidationError(`${label} must be beneath its authority root`, {
      root,
      target,
    });
  }
  return rel;
}

function assertNoOverlap(left, right) {
  const leftToRight = relative(left, right);
  const rightToLeft = relative(right, left);
  const leftContainsRight =
    leftToRight === "" ||
    (!leftToRight.startsWith(`..${sep}`) &&
      leftToRight !== ".." &&
      !isAbsolute(leftToRight));
  const rightContainsLeft =
    rightToLeft === "" ||
    (!rightToLeft.startsWith(`..${sep}`) &&
      rightToLeft !== ".." &&
      !isAbsolute(rightToLeft));
  if (leftContainsRight || rightContainsLeft) {
    throw new ValidationError(
      "Candidate source and snapshot destinations must not overlap",
      { sourceRoot: left, destinationRoot: right },
    );
  }
}

function metadataFingerprint(metadata) {
  return canonicalize({
    device: metadata.dev.toString(),
    inode: metadata.ino.toString(),
    mode: metadata.mode.toString(),
    linkCount: metadata.nlink.toString(),
    size: metadata.size.toString(),
    modifiedNs: metadata.mtimeNs.toString(),
    changedNs: metadata.ctimeNs.toString(),
  });
}

function portableMode(metadata, relativePath) {
  const executeBits = Number(metadata.mode & 0o111n);
  if (executeBits === 0) return "0644";
  if (executeBits === 0o111) return "0755";
  throw new IntegrityError(
    "Candidate file has inconsistent partial execute-bit mode",
    {
      path: relativePath,
      mode: Number(metadata.mode & 0o777n).toString(8),
    },
  );
}

async function assertCanonicalMember(canonicalRoot, memberPath) {
  const canonicalMember = await realpath(memberPath);
  const rel = relative(canonicalRoot, canonicalMember);
  if (
    rel === ".." ||
    rel.startsWith(`..${sep}`) ||
    isAbsolute(rel)
  ) {
    throw new IntegrityError("Candidate member escapes its supplied root", {
      memberPath,
      canonicalMember,
    });
  }
}

async function readStableRegularFile(
  canonicalRoot,
  filePath,
  relativePath,
  metadata,
  limits,
) {
  if (metadata.nlink !== 1n) {
    throw new IntegrityError("Candidate package hard-link aliases are forbidden", {
      path: relativePath,
      linkCount: metadata.nlink.toString(),
    });
  }
  if (metadata.size > BigInt(limits.maximumFileBytes)) {
    throw new ValidationError("Candidate file exceeds its byte limit", {
      path: relativePath,
      byteLength: metadata.size.toString(),
      limit: limits.maximumFileBytes,
    });
  }
  await assertCanonicalMember(canonicalRoot, filePath);
  const handle = await open(
    filePath,
    fsConstants.O_RDONLY | fsConstants.O_NOFOLLOW,
  );
  try {
    const opened = await handle.stat({ bigint: true });
    if (
      !opened.isFile() ||
      opened.dev !== metadata.dev ||
      opened.ino !== metadata.ino ||
      metadataFingerprint(opened) !== metadataFingerprint(metadata)
    ) {
      throw new IntegrityError(
        "Candidate file identity changed before its no-follow read",
        { path: relativePath },
      );
    }
    const bytes = await handle.readFile();
    const after = await handle.stat({ bigint: true });
    if (
      bytes.length !== Number(opened.size) ||
      metadataFingerprint(after) !== metadataFingerprint(opened)
    ) {
      throw new IntegrityError("Candidate file changed during capture", {
        path: relativePath,
      });
    }
    return {
      path: relativePath,
      mode: portableMode(opened, relativePath),
      bytes,
    };
  } finally {
    await handle.close();
  }
}

function validatePathCollisions(entries) {
  const asciiFolded = new Map();
  const normalized = new Map();
  for (const entry of entries) {
    validateRelativePath(entry.path);
    const asciiKey = entry.path.replace(/[A-Z]/gu, (character) =>
      character.toLowerCase()
    );
    if (asciiFolded.has(asciiKey)) {
      throw new IntegrityError(
        "Candidate paths collide under ASCII case folding",
        { first: asciiFolded.get(asciiKey), second: entry.path },
      );
    }
    asciiFolded.set(asciiKey, entry.path);
    const normalizedKey = entry.path.normalize("NFC");
    if (normalized.has(normalizedKey)) {
      throw new IntegrityError(
        "Candidate paths collide under target Unicode normalization",
        { first: normalized.get(normalizedKey), second: entry.path },
      );
    }
    normalized.set(normalizedKey, entry.path);
  }
}

async function collectCandidatePass(canonicalRoot, limits) {
  const entries = [];
  const pending = [{ absolutePath: canonicalRoot, relativePath: "", depth: 0 }];
  let totalBytes = 0;
  while (pending.length > 0) {
    const directory = pending.shift();
    if (directory.depth > limits.maximumDepth) {
      throw new ValidationError("Candidate package exceeds its depth limit", {
        path: directory.relativePath,
        limit: limits.maximumDepth,
      });
    }
    const before = await lstat(directory.absolutePath, { bigint: true });
    if (!before.isDirectory() || before.isSymbolicLink()) {
      throw new IntegrityError(
        "Candidate traversal expected a no-link directory",
        { path: directory.relativePath || "." },
      );
    }
    await assertCanonicalMember(canonicalRoot, directory.absolutePath);
    const members = await readdir(directory.absolutePath, {
      encoding: "buffer",
      withFileTypes: true,
    });
    members.sort((left, right) =>
      Buffer.compare(left.name, right.name)
    );
    for (const member of members) {
      const segment = decodePathSegment(member.name);
      const relativePath = directory.relativePath.length === 0
        ? segment
        : `${directory.relativePath}/${segment}`;
      validateRelativePath(relativePath);
      const absolutePath = join(directory.absolutePath, segment);
      const metadata = await lstat(absolutePath, { bigint: true });
      if (metadata.isSymbolicLink()) {
        throw new IntegrityError("Candidate package symlinks are forbidden", {
          path: relativePath,
        });
      }
      if (metadata.isDirectory()) {
        pending.push({
          absolutePath,
          relativePath,
          depth: directory.depth + 1,
        });
        continue;
      }
      if (!metadata.isFile()) {
        throw new IntegrityError(
          "Candidate package contains a forbidden special file",
          { path: relativePath },
        );
      }
      if (entries.length >= limits.maximumFileCount) {
        throw new ValidationError(
          "Candidate package exceeds its file-count limit",
          { limit: limits.maximumFileCount },
        );
      }
      const entry = await readStableRegularFile(
        canonicalRoot,
        absolutePath,
        relativePath,
        metadata,
        limits,
      );
      totalBytes += entry.bytes.length;
      if (totalBytes > limits.maximumTotalBytes) {
        throw new ValidationError(
          "Candidate package exceeds its total-byte limit",
          { limit: limits.maximumTotalBytes },
        );
      }
      entries.push(entry);
    }
    const after = await lstat(directory.absolutePath, { bigint: true });
    if (metadataFingerprint(after) !== metadataFingerprint(before)) {
      throw new IntegrityError(
        "Candidate directory changed during enumeration",
        { path: directory.relativePath || "." },
      );
    }
  }
  if (entries.length === 0) {
    throw new ValidationError("Candidate package contains no regular files");
  }
  entries.sort((left, right) => compareUtf8(left.path, right.path));
  validatePathCollisions(entries);
  const folded = foldPackageInventory("candidate-package", entries, []);
  return {
    entries,
    inventory: folded.inventory,
    candidatePackageRoot: folded.root,
  };
}

function stablePassView(captured) {
  return {
    inventory: captured.inventory,
    candidatePackageRoot: captured.candidatePackageRoot,
  };
}

function assertEqualPasses(left, right) {
  if (
    canonicalize(stablePassView(left)) !==
      canonicalize(stablePassView(right))
  ) {
    throw new IntegrityError(
      "Candidate package changed between independent capture passes",
      {
        firstRoot: left.candidatePackageRoot,
        secondRoot: right.candidatePackageRoot,
      },
    );
  }
}

function parseSkillIdentity(bytes) {
  let text;
  try {
    text = UTF8_DECODER.decode(bytes);
  } catch (error) {
    throw new ValidationError("Candidate SKILL.md is not UTF-8", {}, {
      cause: error,
    });
  }
  const lines = text.split(/\r?\n/u);
  if (lines[0] !== "---") {
    throw new ValidationError("Candidate SKILL.md has no YAML frontmatter");
  }
  const end = lines.indexOf("---", 1);
  if (end < 2) {
    throw new ValidationError("Candidate SKILL.md frontmatter is unterminated");
  }
  const names = lines.slice(1, end).filter((line) =>
    /^name\s*:/u.test(line)
  );
  if (names.length !== 1) {
    throw new ValidationError(
      "Candidate SKILL.md must declare exactly one simple name",
    );
  }
  const raw = names[0].replace(/^name\s*:\s*/u, "").trim();
  const name =
    (raw.startsWith("\"") && raw.endsWith("\"")) ||
    (raw.startsWith("'") && raw.endsWith("'"))
      ? raw.slice(1, -1)
      : raw;
  assertIdentifier(name, "candidate skill identity");
  return name;
}

function selectedProjectionEntries(descriptor, inventory) {
  const selected = new Map();
  for (const selector of descriptor.compiledProjectionSelectors) {
    const matches = selector.kind === "file"
      ? inventory.filter((entry) => entry.path === selector.path)
      : inventory.filter((entry) =>
          entry.path.startsWith(`${selector.path}/`)
        );
    if (matches.length === 0) {
      throw new ValidationError(
        "Candidate is missing a required compiled projection",
        { adapterId: descriptor.adapterId, selector },
      );
    }
    for (const match of matches) selected.set(match.path, match);
  }
  return [...selected.values()].sort((left, right) =>
    compareUtf8(left.path, right.path)
  );
}

function compiledProjectionRoot(descriptor, inventory) {
  return hashCanonical("candidate-compiled-projection-set/v1", {
    adapterDescriptorDigest: descriptor.adapterDescriptorDigest,
    selectors: descriptor.compiledProjectionSelectors,
    entries: selectedProjectionEntries(descriptor, inventory),
  });
}

function acquisitionProvenance(packageRoot, limits) {
  const limitsDigest = hashCanonical("candidate-capture-limits/v1", limits);
  return {
    acquisitionClass: "explicit-local-directory",
    captureAlgorithmId: CANDIDATE_CAPTURE_ALGORITHM_ID,
    sourceRootExplicitlySupplied: true,
    repositoryDiscoveryPerformed: false,
    archiveExpansionPerformed: false,
    stablePassCount: 3,
    stablePassRoots: [packageRoot, packageRoot, packageRoot],
    captureLimitsDigest: limitsDigest,
    sourceMutationObserved: false,
  };
}

function buildSnapshot({
  captured,
  descriptor,
  limits,
}) {
  const skillEntry = captured.entries.find((entry) =>
    entry.path === "SKILL.md"
  );
  if (!skillEntry) {
    throw new ValidationError("Candidate package has no SKILL.md");
  }
  const observedSkillIdentity = parseSkillIdentity(skillEntry.bytes);
  if (observedSkillIdentity !== descriptor.skillIdentity) {
    throw new IntegrityError(
      "Candidate skill identity does not match its selected adapter",
      {
        observedSkillIdentity,
        expectedSkillIdentity: descriptor.skillIdentity,
      },
    );
  }
  const projectionRoots = [
    compiledProjectionRoot(descriptor, captured.inventory),
  ];
  const provenance = acquisitionProvenance(
    captured.candidatePackageRoot,
    limits,
  );
  const acquisitionRoots = [
    hashCanonical("candidate-acquisition-evidence/v1", provenance),
  ];
  const candidateSnapshotId = hashCanonical("candidate-snapshot-id/v1", {
    skillIdentity: observedSkillIdentity,
    candidatePackageRoot: captured.candidatePackageRoot,
    adapterDescriptorDigest: descriptor.adapterDescriptorDigest,
    compiledProjectionRoots: projectionRoots,
    acquisitionEvidenceRoots: acquisitionRoots,
  });
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    candidateSnapshotId,
    skillIdentity: observedSkillIdentity,
    capabilities: descriptor.capabilities,
    adapter: descriptor,
    rootKind: "complete_regular_file_inventory",
    entries: captured.inventory,
    candidatePackageRoot: captured.candidatePackageRoot,
    foldDomain: "candidate-package-fold/v1",
    compiledProjectionRoots: projectionRoots,
    acquisitionProvenance: provenance,
    acquisitionEvidenceRoots: acquisitionRoots,
    snapshotLayout: {
      schemaVersion: "1.0.0",
      payloadDirectory: "payload",
      manifestFile: "candidate-snapshot.json",
      readOnly: true,
    },
    implicitExclusionsPermitted: false,
  };
}

async function ensureContainedDirectory(authorityRoot, target) {
  const canonicalAuthority = await realpath(authorityRoot);
  const absoluteTarget = resolve(target);
  const rel = containedRelative(
    canonicalAuthority,
    absoluteTarget,
    "candidate snapshot parent",
  );
  let cursor = canonicalAuthority;
  for (const segment of rel.split(sep).filter(Boolean)) {
    cursor = join(cursor, segment);
    try {
      const metadata = await lstat(cursor);
      if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
        throw new IntegrityError(
          "Candidate snapshot parent contains a non-directory or link",
          { path: cursor },
        );
      }
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
      await mkdir(cursor, { mode: 0o750 });
    }
  }
  return absoluteTarget;
}

async function writeCapturedFile(path, bytes, mode) {
  const handle = await open(
    path,
    fsConstants.O_CREAT |
      fsConstants.O_EXCL |
      fsConstants.O_WRONLY |
      fsConstants.O_NOFOLLOW,
    mode === "0755" ? 0o700 : 0o600,
  );
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await chmod(path, mode === "0755" ? 0o555 : 0o444);
}

async function materializeReadOnlyPayload(payloadRoot, entries) {
  await mkdir(payloadRoot, { mode: 0o700 });
  const directoryPaths = new Set();
  for (const entry of entries) {
    const segments = entry.path.split("/");
    for (let index = 1; index < segments.length; index += 1) {
      directoryPaths.add(segments.slice(0, index).join("/"));
    }
  }
  const orderedDirectories = [...directoryPaths].sort((left, right) => {
    const depthDifference =
      left.split("/").length - right.split("/").length;
    return depthDifference === 0 ? compareUtf8(left, right) : depthDifference;
  });
  for (const relativePath of orderedDirectories) {
    await mkdir(resolveContained(payloadRoot, ...relativePath.split("/")), {
      mode: 0o700,
    });
  }
  for (const entry of entries) {
    await writeCapturedFile(
      resolveContained(payloadRoot, ...entry.path.split("/")),
      entry.bytes,
      entry.mode,
    );
  }
  for (const relativePath of [...orderedDirectories].reverse()) {
    await chmod(
      resolveContained(payloadRoot, ...relativePath.split("/")),
      0o555,
    );
  }
  await chmod(payloadRoot, 0o555);
}

async function capturePayloadView(payloadRoot, limits) {
  const rootMetadata = await lstat(payloadRoot);
  if (rootMetadata.isSymbolicLink() || !rootMetadata.isDirectory()) {
    throw new IntegrityError("Candidate snapshot payload is not a directory");
  }
  return collectCandidatePass(await realpath(payloadRoot), limits);
}

function validateSnapshotSemantics(snapshot, descriptor, captured, limits) {
  if (
    snapshot.skillIdentity !== descriptor.skillIdentity ||
    canonicalize(snapshot.capabilities) !==
      canonicalize(descriptor.capabilities) ||
    canonicalize(snapshot.adapter) !== canonicalize(descriptor)
  ) {
    throw new IntegrityError(
      "Candidate snapshot does not bind its exact adapter capabilities",
    );
  }
  if (
    snapshot.rootKind !== "complete_regular_file_inventory" ||
    snapshot.foldDomain !== "candidate-package-fold/v1" ||
    snapshot.implicitExclusionsPermitted !== false ||
    canonicalize(snapshot.entries) !== canonicalize(captured.inventory) ||
    snapshot.candidatePackageRoot !== captured.candidatePackageRoot
  ) {
    throw new IntegrityError(
      "Candidate snapshot inventory does not match its exact payload",
    );
  }
  const expectedProjectionRoots = [
    compiledProjectionRoot(descriptor, captured.inventory),
  ];
  if (
    canonicalize(snapshot.compiledProjectionRoots) !==
      canonicalize(expectedProjectionRoots)
  ) {
    throw new IntegrityError(
      "Candidate snapshot compiled projection root is invalid",
    );
  }
  const provenance = acquisitionProvenance(
    captured.candidatePackageRoot,
    limits,
  );
  const evidenceRoots = [
    hashCanonical("candidate-acquisition-evidence/v1", provenance),
  ];
  if (
    canonicalize(snapshot.acquisitionProvenance) !==
      canonicalize(provenance) ||
    canonicalize(snapshot.acquisitionEvidenceRoots) !==
      canonicalize(evidenceRoots)
  ) {
    throw new IntegrityError(
      "Candidate snapshot acquisition provenance is invalid",
    );
  }
  const expectedSnapshotId = hashCanonical("candidate-snapshot-id/v1", {
    skillIdentity: snapshot.skillIdentity,
    candidatePackageRoot: snapshot.candidatePackageRoot,
    adapterDescriptorDigest: descriptor.adapterDescriptorDigest,
    compiledProjectionRoots: expectedProjectionRoots,
    acquisitionEvidenceRoots: evidenceRoots,
  });
  if (snapshot.candidateSnapshotId !== expectedSnapshotId) {
    throw new IntegrityError("Candidate snapshot ID is not content-derived");
  }
  return snapshot;
}

function assertDigestArray(value, label, { minimum = 0 } = {}) {
  if (
    !Array.isArray(value) ||
    value.length < minimum ||
    new Set(value).size !== value.length ||
    value.some((entry) => typeof entry !== "string" || !DIGEST.test(entry))
  ) {
    throw new ValidationError(`${label} is not a closed digest array`);
  }
}

function validateCandidateSnapshotShape(value) {
  assertExactKeys(
    value,
    [
      "schemaVersion",
      "hashProfileId",
      "candidateSnapshotId",
      "skillIdentity",
      "capabilities",
      "adapter",
      "rootKind",
      "entries",
      "candidatePackageRoot",
      "foldDomain",
      "compiledProjectionRoots",
      "acquisitionProvenance",
      "acquisitionEvidenceRoots",
      "snapshotLayout",
      "implicitExclusionsPermitted",
    ],
    "candidate snapshot",
  );
  if (
    value.schemaVersion !== "1.0.0" ||
    value.hashProfileId !== HASH_PROFILE_ID ||
    typeof value.candidateSnapshotId !== "string" ||
    !DIGEST.test(value.candidateSnapshotId) ||
    typeof value.skillIdentity !== "string" ||
    !IDENTIFIER.test(value.skillIdentity) ||
    value.rootKind !== "complete_regular_file_inventory" ||
    typeof value.candidatePackageRoot !== "string" ||
    !DIGEST.test(value.candidatePackageRoot) ||
    value.foldDomain !== "candidate-package-fold/v1" ||
    value.implicitExclusionsPermitted !== false
  ) {
    throw new ValidationError("Candidate snapshot identity is invalid");
  }
  if (
    !Array.isArray(value.capabilities) ||
    value.capabilities.length === 0 ||
    new Set(value.capabilities).size !== value.capabilities.length ||
    value.capabilities.some((entry) =>
      typeof entry !== "string" || !IDENTIFIER.test(entry)
    )
  ) {
    throw new ValidationError("Candidate snapshot capabilities are invalid");
  }
  if (!Array.isArray(value.entries) || value.entries.length === 0) {
    throw new ValidationError("Candidate snapshot inventory is empty");
  }
  for (const entry of value.entries) {
    assertExactKeys(
      entry,
      ["path", "mode", "byteLength", "rawFileSha256"],
      "candidate snapshot inventory entry",
    );
    validateRelativePath(entry.path);
    if (
      !["0644", "0755"].includes(entry.mode) ||
      !Number.isSafeInteger(entry.byteLength) ||
      entry.byteLength < 0 ||
      typeof entry.rawFileSha256 !== "string" ||
      !DIGEST.test(entry.rawFileSha256)
    ) {
      throw new ValidationError(
        "Candidate snapshot inventory entry is invalid",
        { path: entry.path },
      );
    }
  }
  assertDigestArray(
    value.compiledProjectionRoots,
    "compiled projection roots",
    { minimum: 1 },
  );
  assertDigestArray(
    value.acquisitionEvidenceRoots,
    "acquisition evidence roots",
    { minimum: 1 },
  );
  assertExactKeys(
    value.acquisitionProvenance,
    [
      "acquisitionClass",
      "captureAlgorithmId",
      "sourceRootExplicitlySupplied",
      "repositoryDiscoveryPerformed",
      "archiveExpansionPerformed",
      "stablePassCount",
      "stablePassRoots",
      "captureLimitsDigest",
      "sourceMutationObserved",
    ],
    "candidate acquisition provenance",
  );
  const provenance = value.acquisitionProvenance;
  if (
    provenance.acquisitionClass !== "explicit-local-directory" ||
    provenance.captureAlgorithmId !== CANDIDATE_CAPTURE_ALGORITHM_ID ||
    provenance.sourceRootExplicitlySupplied !== true ||
    provenance.repositoryDiscoveryPerformed !== false ||
    provenance.archiveExpansionPerformed !== false ||
    provenance.stablePassCount !== 3 ||
    provenance.sourceMutationObserved !== false ||
    typeof provenance.captureLimitsDigest !== "string" ||
    !DIGEST.test(provenance.captureLimitsDigest) ||
    !Array.isArray(provenance.stablePassRoots) ||
    provenance.stablePassRoots.length !== 3 ||
    provenance.stablePassRoots.some((entry) =>
      typeof entry !== "string" || !DIGEST.test(entry)
    )
  ) {
    throw new ValidationError(
      "Candidate snapshot acquisition provenance is invalid",
    );
  }
  assertExactKeys(
    value.snapshotLayout,
    [
      "schemaVersion",
      "payloadDirectory",
      "manifestFile",
      "readOnly",
    ],
    "candidate snapshot layout",
  );
  return value;
}

export async function validateCandidateSnapshot({
  snapshot,
  payloadRoot,
  schemaValidator,
  adapterDescriptor = null,
  limits = DEFAULT_CANDIDATE_CAPTURE_LIMITS,
}) {
  const safeLimits = validateLimits(limits);
  const value = deepCloneCanonical(snapshot);
  validateCandidateSnapshotShape(value);
  if (schemaValidator) {
    if (typeof schemaValidator.assert !== "function") {
      throw new ValidationError("Candidate schema validator is invalid");
    }
    schemaValidator.assert("candidate-snapshot", value);
  }
  const descriptor = verifySurveySubjectAdapterDescriptor(
    adapterDescriptor ?? value.adapter,
  );
  if (adapterDescriptor !== null &&
      canonicalize(value.adapter) !== canonicalize(descriptor)) {
    throw new IntegrityError(
      "Candidate snapshot is bound to another subject adapter",
    );
  }
  if (
    value.snapshotLayout?.schemaVersion !== "1.0.0" ||
    value.snapshotLayout?.payloadDirectory !== "payload" ||
    value.snapshotLayout?.manifestFile !== "candidate-snapshot.json" ||
    value.snapshotLayout?.readOnly !== true
  ) {
    throw new ValidationError("Candidate snapshot layout is unsupported");
  }
  const captured = await capturePayloadView(payloadRoot, safeLimits);
  validateSnapshotSemantics(value, descriptor, captured, safeLimits);
  return deepFreeze({
    snapshot: value,
    snapshotDigest: hashCanonical("candidate-snapshot/v1", value),
    payloadRoot: await realpath(payloadRoot),
    adapterDescriptor: descriptor,
  });
}

async function loadExistingCapture({
  destinationRoot,
  canonicalSource,
  schemaValidator,
  descriptor,
  limits,
}) {
  const manifestPath = join(destinationRoot, "candidate-snapshot.json");
  const payloadRoot = join(destinationRoot, "payload");
  if (!(await exists(manifestPath)) || !(await exists(payloadRoot))) {
    throw new ConflictError(
      "Candidate capture destination contains an incomplete prior capture",
      { destinationRoot },
    );
  }
  const validated = await validateCandidateSnapshot({
    snapshot: await readJsonFile(manifestPath),
    payloadRoot,
    schemaValidator,
    adapterDescriptor: descriptor,
    limits,
  });
  const first = await collectCandidatePass(canonicalSource, limits);
  const second = await collectCandidatePass(canonicalSource, limits);
  assertEqualPasses(first, second);
  if (
    second.candidatePackageRoot !== validated.snapshot.candidatePackageRoot ||
    canonicalize(second.inventory) !==
      canonicalize(validated.snapshot.entries)
  ) {
    throw new ConflictError(
      "Candidate capture destination is bound to different source bytes",
      {
        destinationRoot,
        existingRoot: validated.snapshot.candidatePackageRoot,
        requestedRoot: second.candidatePackageRoot,
      },
    );
  }
  return deepFreeze({
    ...validated,
    manifestPath,
    replayed: true,
  });
}

export async function captureCandidatePackage({
  authorityRoot,
  sourceRoot,
  destinationRoot,
  adapter,
  schemaValidator = null,
  limits = DEFAULT_CANDIDATE_CAPTURE_LIMITS,
  onCapturePass = null,
}) {
  if (
    !authorityRoot ||
    !sourceRoot ||
    !destinationRoot ||
    !adapter ||
    typeof adapter.describe !== "function"
  ) {
    throw new ValidationError(
      "Candidate capture requires authority, source, destination, and adapter",
    );
  }
  if (onCapturePass !== null && typeof onCapturePass !== "function") {
    throw new ValidationError("Candidate capture pass observer is invalid");
  }
  const safeLimits = validateLimits(limits);
  const sourceMetadata = await lstat(sourceRoot);
  if (sourceMetadata.isSymbolicLink() || !sourceMetadata.isDirectory()) {
    throw new IntegrityError(
      "Candidate source must be an explicitly supplied no-link directory",
    );
  }
  const canonicalSource = await realpath(sourceRoot);
  const canonicalAuthority = await realpath(authorityRoot);
  const absoluteDestination = resolve(destinationRoot);
  containedRelative(
    canonicalAuthority,
    absoluteDestination,
    "candidate snapshot destination",
  );
  assertNoOverlap(canonicalSource, absoluteDestination);
  await ensureContainedDirectory(canonicalAuthority, dirname(absoluteDestination));
  await assertNoSymlinkAncestors(canonicalAuthority, absoluteDestination);
  const descriptor = verifySurveySubjectAdapterDescriptor(adapter.describe());
  const lockTarget = `${absoluteDestination}.capture`;
  return withFileLock(lockTarget, async () => {
    if (await exists(absoluteDestination)) {
      return loadExistingCapture({
        destinationRoot: absoluteDestination,
        canonicalSource,
        schemaValidator,
        descriptor,
        limits: safeLimits,
      });
    }
    const first = await collectCandidatePass(canonicalSource, safeLimits);
    if (onCapturePass) {
      await onCapturePass({ pass: 1, candidatePackageRoot: first.candidatePackageRoot });
    }
    const second = await collectCandidatePass(canonicalSource, safeLimits);
    assertEqualPasses(first, second);
    if (onCapturePass) {
      await onCapturePass({ pass: 2, candidatePackageRoot: second.candidatePackageRoot });
    }
    const snapshot = buildSnapshot({
      captured: second,
      descriptor,
      limits: safeLimits,
    });
    if (schemaValidator) {
      schemaValidator.assert("candidate-snapshot", snapshot);
    }
    let created = false;
    try {
      await mkdir(absoluteDestination, { mode: 0o700 });
      created = true;
      const payloadRoot = join(absoluteDestination, "payload");
      await materializeReadOnlyPayload(payloadRoot, second.entries);
      const staged = await capturePayloadView(payloadRoot, safeLimits);
      assertEqualPasses(second, staged);
      const third = await collectCandidatePass(canonicalSource, safeLimits);
      assertEqualPasses(second, third);
      if (onCapturePass) {
        await onCapturePass({
          pass: 3,
          candidatePackageRoot: third.candidatePackageRoot,
        });
      }
      const manifestPath = join(
        absoluteDestination,
        "candidate-snapshot.json",
      );
      await atomicCreateOnce(manifestPath, canonicalBytes(snapshot), {
        mode: 0o444,
        authorityRoot: absoluteDestination,
      });
      await chmod(manifestPath, 0o444);
      await chmod(absoluteDestination, 0o555);
      const validated = await validateCandidateSnapshot({
        snapshot,
        payloadRoot,
        schemaValidator,
        adapterDescriptor: descriptor,
        limits: safeLimits,
      });
      return deepFreeze({
        ...validated,
        manifestPath,
        replayed: false,
      });
    } catch (error) {
      if (created) {
        await chmod(absoluteDestination, 0o700).catch(() => {});
        await rm(absoluteDestination, { recursive: true, force: true })
          .catch(() => {});
      }
      throw error;
    }
  }, { authorityRoot: canonicalAuthority });
}

async function entryBytesFromPayload(payloadRoot, entries) {
  const captured = [];
  for (const entry of entries) {
    const path = resolveContained(payloadRoot, ...entry.path.split("/"));
    await assertNoSymlinkAncestors(payloadRoot, path);
    const bytes = await readFileNoFollow(path);
    if (
      bytes.length !== entry.byteLength ||
      rawSha256(bytes) !== entry.rawFileSha256
    ) {
      throw new IntegrityError("Captured candidate payload changed before stage", {
        path: entry.path,
      });
    }
    captured.push({ path: entry.path, mode: entry.mode, bytes });
  }
  return captured;
}

export async function stageCapturedCandidate({
  candidateBundle,
  attemptRoot,
  adapterDescriptor,
}) {
  assertExactKeys(
    candidateBundle,
    ["snapshot", "payloadRoot", "schemaValidator"],
    "candidate bundle",
  );
  const descriptor = verifySurveySubjectAdapterDescriptor(adapterDescriptor);
  const validated = await validateCandidateSnapshot({
    snapshot: candidateBundle.snapshot,
    payloadRoot: candidateBundle.payloadRoot,
    schemaValidator: candidateBundle.schemaValidator,
    adapterDescriptor: descriptor,
  });
  const attemptMetadata = await lstat(attemptRoot);
  if (attemptMetadata.isSymbolicLink() || !attemptMetadata.isDirectory()) {
    throw new IntegrityError("Survey attempt root must be a no-link directory");
  }
  const canonicalAttempt = await realpath(attemptRoot);
  const skillsRoot = join(canonicalAttempt, "skills");
  await ensureContainedDirectory(canonicalAttempt, skillsRoot);
  const stagedRoot = join(skillsRoot, validated.snapshot.skillIdentity);
  await assertNoSymlinkAncestors(canonicalAttempt, stagedRoot);
  if (await exists(stagedRoot)) {
    const existing = await capturePayloadView(
      stagedRoot,
      DEFAULT_CANDIDATE_CAPTURE_LIMITS,
    );
    if (
      canonicalize(existing.inventory) !==
        canonicalize(validated.snapshot.entries) ||
      existing.candidatePackageRoot !== validated.snapshot.candidatePackageRoot
    ) {
      throw new ConflictError(
        "Survey attempt already contains another candidate package",
      );
    }
    return deepFreeze({
      replayed: true,
      stagedSkillRoot: await realpath(stagedRoot),
      skillIdentity: validated.snapshot.skillIdentity,
      candidateSnapshotId: validated.snapshot.candidateSnapshotId,
      candidatePackageRoot: validated.snapshot.candidatePackageRoot,
      adapterDescriptorDigest: descriptor.adapterDescriptorDigest,
    });
  }
  const entries = await entryBytesFromPayload(
    validated.payloadRoot,
    validated.snapshot.entries,
  );
  await materializeReadOnlyPayload(stagedRoot, entries);
  const staged = await capturePayloadView(
    stagedRoot,
    DEFAULT_CANDIDATE_CAPTURE_LIMITS,
  );
  if (
    canonicalize(staged.inventory) !==
      canonicalize(validated.snapshot.entries) ||
    staged.candidatePackageRoot !== validated.snapshot.candidatePackageRoot
  ) {
    throw new IntegrityError("Survey staged package failed exact verification");
  }
  return deepFreeze({
    replayed: false,
    stagedSkillRoot: await realpath(stagedRoot),
    skillIdentity: validated.snapshot.skillIdentity,
    candidateSnapshotId: validated.snapshot.candidateSnapshotId,
    candidatePackageRoot: validated.snapshot.candidatePackageRoot,
    adapterDescriptorDigest: descriptor.adapterDescriptorDigest,
  });
}
