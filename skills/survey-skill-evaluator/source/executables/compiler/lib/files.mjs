import {
  chmod,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  rm
} from "node:fs/promises";
import path from "node:path";

function asciiFold(value) {
  return value.replace(/[A-Z]/g, (character) => character.toLowerCase());
}

export function assertPortableRelativePath(relativePath) {
  if (
    relativePath.length === 0 ||
    path.isAbsolute(relativePath) ||
    relativePath.includes("\\") ||
    relativePath.includes("\0")
  ) {
    throw new Error(`invalid package path: ${JSON.stringify(relativePath)}`);
  }
  const segments = relativePath.split("/");
  if (segments.some((segment) => segment === "" || segment === "." || segment === "..")) {
    throw new Error(`invalid package path segment: ${relativePath}`);
  }
  if (Buffer.from(relativePath, "utf8").toString("utf8") !== relativePath) {
    throw new Error(`path is not valid UTF-8: ${relativePath}`);
  }
}

export function portableMode(stat, relativePath) {
  const execute = stat.mode & 0o111;
  if (execute === 0) return "0644";
  if (execute === 0o111) return "0755";
  throw new Error(`partial execute-bit mode is not portable: ${relativePath}`);
}

async function visit(root, relativeDirectory, records, exclusions) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  const names = await readdir(absoluteDirectory);
  names.sort((left, right) => Buffer.compare(Buffer.from(left), Buffer.from(right)));
  for (const name of names) {
    const relativePath = relativeDirectory
      ? `${relativeDirectory}/${name}`
      : name;
    assertPortableRelativePath(relativePath);
    if (exclusions.has(relativePath)) continue;
    const absolutePath = path.join(root, relativePath);
    const stat = await lstat(absolutePath);
    if (stat.isSymbolicLink()) {
      throw new Error(`symlink rejected from package inventory: ${relativePath}`);
    }
    if (stat.isDirectory()) {
      await visit(root, relativePath, records, exclusions);
      continue;
    }
    if (!stat.isFile() || stat.nlink !== 1) {
      throw new Error(`non-regular or hard-linked package member rejected: ${relativePath}`);
    }
    records.set(relativePath, {
      path: relativePath,
      mode: portableMode(stat, relativePath),
      bytes: await readFile(absolutePath)
    });
  }
}

export async function collectTree(
  root,
  { exclusions = [], overrides = new Map(), modeOverrides = new Map() } = {}
) {
  const records = new Map();
  await visit(root, "", records, new Set(exclusions));
  for (const [relativePath, bytes] of overrides) {
    if (exclusions.includes(relativePath)) continue;
    assertPortableRelativePath(relativePath);
    records.set(relativePath, {
      path: relativePath,
      mode: modeOverrides.get(relativePath) ?? records.get(relativePath)?.mode ?? "0644",
      bytes: Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes)
    });
  }
  const folded = new Map();
  for (const record of records.values()) {
    const key = asciiFold(record.path);
    const prior = folded.get(key);
    if (prior && prior !== record.path) {
      throw new Error(`ASCII case-fold path collision: ${prior} <> ${record.path}`);
    }
    folded.set(key, record.path);
  }
  return [...records.values()].sort((left, right) =>
    Buffer.compare(Buffer.from(left.path, "utf8"), Buffer.from(right.path, "utf8"))
  );
}

export async function writeFileAtomic(absolutePath, bytes, mode = 0o644) {
  await mkdir(path.dirname(absolutePath), { recursive: true });
  const temporaryPath = `${absolutePath}.tmp-${process.pid}`;
  await rm(temporaryPath, { force: true });
  const handle = await open(temporaryPath, "wx", mode);
  try {
    await handle.writeFile(bytes);
    await handle.sync();
  } finally {
    await handle.close();
  }
  await rename(temporaryPath, absolutePath);
  await chmod(absolutePath, mode);
}

export async function readJson(absolutePath) {
  return JSON.parse(await readFile(absolutePath, "utf8"));
}

export async function bytesEqual(absolutePath, expected) {
  try {
    const actual = await readFile(absolutePath);
    return actual.equals(expected);
  } catch (error) {
    if (error && error.code === "ENOENT") return false;
    throw error;
  }
}
