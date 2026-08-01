import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const PACKAGE_ROOT = fileURLToPath(new URL("../../", import.meta.url));

function copyFilter(source) {
  const path = relative(PACKAGE_ROOT, source);
  if (path === "") return true;
  const first = path.split(/[\\/]/u)[0];
  return ![".git", "node_modules", ".runtime", "workspaces"].includes(first);
}

export async function withPackageCopy(operation) {
  const temporaryRoot = await mkdtemp(
    join(tmpdir(), "survey-evaluator-package-"),
  );
  const copyRoot = join(temporaryRoot, basename(PACKAGE_ROOT));
  try {
    await cp(PACKAGE_ROOT, copyRoot, {
      recursive: true,
      dereference: false,
      filter: copyFilter,
    });
    return await operation(copyRoot);
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }
}

export async function readJson(root, relativePath) {
  return JSON.parse(await readFile(join(root, relativePath), "utf8"));
}

export async function writeJson(root, relativePath, value) {
  await writeFile(
    join(root, relativePath),
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
}

export function run(root, command, args = [], options = {}) {
  return spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
    ...options,
  });
}

export function runCompiler(root, args = []) {
  return run(root, "./compile.sh", args);
}
