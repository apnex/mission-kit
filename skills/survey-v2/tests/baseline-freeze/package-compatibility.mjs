import { constants } from "node:fs";
import { lstat, open, realpath } from "node:fs/promises";
import path from "node:path";
import {
  canonicalize,
  prettyJson,
  sha256Bytes,
  sha256Value
} from "../../source/executables/runtime/lib/canonical.mjs";

export class FrozenPackageRequiredError extends Error {
  constructor(message) {
    super(message);
    this.name = "FrozenPackageRequiredError";
    this.code = "FROZEN_PACKAGE_REQUIRED";
  }
}

function refuse(message) {
  throw new FrozenPackageRequiredError(message);
}

function compareUtf8(left, right) {
  return Buffer.compare(Buffer.from(left, "utf8"), Buffer.from(right, "utf8"));
}

function assertRequiredPackage(requiredPackage) {
  if (
    requiredPackage === null ||
    typeof requiredPackage !== "object" ||
    Array.isArray(requiredPackage) ||
    Object.keys(requiredPackage).sort().join(",") !==
      "id,projectionDigest,protocolDigest,version"
  ) {
    throw new TypeError("requiredPackage must be a closed package identity");
  }
  for (const field of ["id", "version"]) {
    if (typeof requiredPackage[field] !== "string" || requiredPackage[field].length === 0) {
      throw new TypeError(`requiredPackage.${field} must be a non-empty string`);
    }
  }
  for (const field of ["projectionDigest", "protocolDigest"]) {
    if (
      typeof requiredPackage[field] !== "string" ||
      !/^sha256:[0-9a-f]{64}$/u.test(requiredPackage[field])
    ) {
      throw new TypeError(`requiredPackage.${field} must be a prefixed SHA-256`);
    }
  }
  return requiredPackage;
}

function assertSafeMemberPath(relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    path.posix.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath.includes("\0") ||
    relativePath.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    refuse(`frozen package contains unsafe member path ${String(relativePath)}`);
  }
  return relativePath;
}

async function readPhysicalMember(root, relativePath) {
  assertSafeMemberPath(relativePath);
  let cursor = root;
  const parts = relativePath.split("/");
  for (const [index, part] of parts.entries()) {
    cursor = path.join(cursor, part);
    const stat = await lstat(cursor).catch((error) => {
      if (error.code === "ENOENT") {
        refuse(`frozen package member is missing: ${relativePath}`);
      }
      throw error;
    });
    if (stat.isSymbolicLink()) {
      refuse(`frozen package member traverses a symlink: ${relativePath}`);
    }
    if (index < parts.length - 1 && !stat.isDirectory()) {
      refuse(`frozen package member traverses a non-directory: ${relativePath}`);
    }
    if (index === parts.length - 1 && !stat.isFile()) {
      refuse(`frozen package member is not a regular file: ${relativePath}`);
    }
  }
  const handle = await open(cursor, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    return await handle.readFile();
  } finally {
    await handle.close();
  }
}

async function readJsonMember(root, relativePath) {
  try {
    return JSON.parse((await readPhysicalMember(root, relativePath)).toString("utf8"));
  } catch (error) {
    if (error instanceof FrozenPackageRequiredError) throw error;
    refuse(`frozen package member is not valid JSON: ${relativePath}`);
  }
}

function exactValue(actual, expected, label) {
  if (canonicalize(actual) !== canonicalize(expected)) {
    refuse(`frozen package ${label} differs from its projection lock`);
  }
}

export async function verifyFrozenPackageRoot({ subjectRoot, requiredPackage }) {
  assertRequiredPackage(requiredPackage);
  if (typeof subjectRoot !== "string" || !path.isAbsolute(subjectRoot)) {
    throw new TypeError("subjectRoot must be an absolute path");
  }
  const requestedStat = await lstat(subjectRoot);
  if (!requestedStat.isDirectory() || requestedStat.isSymbolicLink()) {
    refuse("frozen package root must be one physical directory");
  }
  const root = await realpath(subjectRoot);
  const packageManifest = await readJsonMember(root, "survey-v2.package.json");
  if (
    packageManifest?.id !== requiredPackage.id ||
    packageManifest?.version !== requiredPackage.version ||
    !Array.isArray(packageManifest.members)
  ) {
    refuse("selected package manifest does not identify the required frozen package");
  }

  const members = packageManifest.members;
  const memberPaths = new Set();
  for (const member of members) {
    if (
      member === null ||
      typeof member !== "object" ||
      Array.isArray(member) ||
      !["authored", "bootstrap", "generated", "supply-lock"].includes(member.kind)
    ) {
      refuse("selected package has an invalid registered member");
    }
    assertSafeMemberPath(member.path);
    if (memberPaths.has(member.path)) {
      refuse(`selected package repeats registered member ${member.path}`);
    }
    memberPaths.add(member.path);
  }

  const projectionLockBytes = await readPhysicalMember(
    root,
    "generated/projection-lock.json"
  );
  let projectionLock;
  try {
    projectionLock = JSON.parse(projectionLockBytes.toString("utf8"));
  } catch {
    refuse("selected package projection lock is not valid JSON");
  }
  const lockKeys = [
    "aggregateDigest",
    "canonicalDigests",
    "id",
    "packageDigest",
    "parentDesignSha256",
    "portableExclusions",
    "projectedDigests",
    "registeredInventory",
    "schemaVersion",
    "selfExcludedTarget"
  ];
  if (
    projectionLock === null ||
    typeof projectionLock !== "object" ||
    Array.isArray(projectionLock) ||
    canonicalize(Object.keys(projectionLock).sort()) !==
      canonicalize([...lockKeys].sort()) ||
    projectionLock.id !==
      "urn:mission-kit:survey-v2:projection-lock:survey-v2" ||
    projectionLock.schemaVersion !== "1.0.0" ||
    projectionLock.parentDesignSha256 !== packageManifest.parentDesignSha256 ||
    !projectionLockBytes.equals(
      Buffer.from(prettyJson(projectionLock), "utf8")
    )
  ) {
    refuse("selected package projection lock bytes or metadata are not canonical");
  }
  const registeredInventory = members
    .map(({ path: memberPath, kind, expectedId = null }) => ({
      path: memberPath,
      kind,
      expectedId
    }))
    .sort((left, right) => compareUtf8(left.path, right.path));
  exactValue(
    projectionLock.registeredInventory,
    registeredInventory,
    "registered inventory"
  );
  if (
    projectionLock.selfExcludedTarget !== "generated/projection-lock.json" ||
    !memberPaths.has(projectionLock.selfExcludedTarget)
  ) {
    refuse("selected package has an invalid self-excluded projection lock");
  }

  const canonicalDigests = [];
  for (const member of members.filter((entry) => entry.kind !== "generated")) {
    canonicalDigests.push({
      path: member.path,
      digest: sha256Bytes(await readPhysicalMember(root, member.path))
    });
  }
  canonicalDigests.sort((left, right) => compareUtf8(left.path, right.path));
  exactValue(
    projectionLock.canonicalDigests,
    canonicalDigests,
    "non-generated member digests"
  );

  const projectedByPath = new Map();
  if (!Array.isArray(projectionLock.projectedDigests)) {
    refuse("selected package projection digests are absent");
  }
  for (const entry of projectionLock.projectedDigests) {
    if (
      entry === null ||
      typeof entry !== "object" ||
      Array.isArray(entry) ||
      typeof entry.path !== "string" ||
      typeof entry.projectionId !== "string" ||
      projectedByPath.has(entry.path)
    ) {
      refuse("selected package has an invalid projected digest entry");
    }
    projectedByPath.set(entry.path, entry);
  }
  const expectedProjectedPaths = members
    .filter(
      (entry) =>
        entry.kind === "generated" &&
        entry.path !== projectionLock.selfExcludedTarget
    )
    .map((entry) => entry.path)
    .sort(compareUtf8);
  exactValue(
    [...projectedByPath.keys()].sort(compareUtf8),
    expectedProjectedPaths,
    "projected member paths"
  );
  for (const memberPath of expectedProjectedPaths) {
    if (
      projectedByPath.get(memberPath).digest !==
      sha256Bytes(await readPhysicalMember(root, memberPath))
    ) {
      refuse(`selected package generated member differs: ${memberPath}`);
    }
  }

  const packageIdentity = {
    packageId: packageManifest.id,
    packageVersion: packageManifest.version,
    publicSkillName: packageManifest.publicSkillName,
    parentDesignSha256: packageManifest.parentDesignSha256,
    portableMode: "whole-sovereign-root",
    portableExclusions: projectionLock.portableExclusions,
    registeredInventory,
    nongeneratedMemberDigests: canonicalDigests,
    generatedMemberDigests: projectionLock.projectedDigests,
    selfExcludedTarget: projectionLock.selfExcludedTarget
  };
  const packageDigest = sha256Value(packageIdentity);
  if (
    packageDigest !== requiredPackage.projectionDigest ||
    projectionLock.packageDigest !== packageDigest ||
    projectionLock.aggregateDigest !== packageDigest
  ) {
    refuse("selected package bytes do not fold to the required frozen digest");
  }

  return Object.freeze({
    verified: true,
    root,
    id: packageManifest.id,
    version: packageManifest.version,
    projectionDigest: packageDigest,
    registeredMemberCount: members.length
  });
}

export function admitFrozenPackage({ session, verifiedPackage, requiredPackage }) {
  assertRequiredPackage(requiredPackage);
  const sessionPackage = session?.package;
  const protocol = session?.protocol;
  if (
    verifiedPackage?.verified !== true ||
    verifiedPackage?.id !== requiredPackage.id ||
    verifiedPackage?.version !== requiredPackage.version ||
    verifiedPackage?.projectionDigest !== requiredPackage.projectionDigest ||
    sessionPackage?.id !== requiredPackage.id ||
    sessionPackage?.version !== requiredPackage.version ||
    sessionPackage?.projectionDigest !== requiredPackage.projectionDigest ||
    protocol?.digest !== requiredPackage.protocolDigest ||
    sha256Value(protocol?.snapshot) !== requiredPackage.protocolDigest
  ) {
    refuse(
      "session, protocol snapshot, and selected package must match the frozen protocol-v1 identity"
    );
  }
  return Object.freeze({
    admitted: true,
    policy: "characterization-only-pre-runtime-selection",
    package: Object.freeze({ ...requiredPackage })
  });
}
