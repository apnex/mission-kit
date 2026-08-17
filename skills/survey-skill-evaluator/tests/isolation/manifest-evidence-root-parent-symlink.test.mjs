import assert from "node:assert/strict";
import { access, mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { packageRoot } from "../helpers/package-root.mjs";

test("manifest runner rejects an outside lexical evidence root whose parent symlink resolves into the package", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "survey-runner-root-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const linkedParent = join(root, "linked-package");
  await symlink(packageRoot, linkedParent, "dir");
  const escapedRoot = join(linkedParent, "hostile-evidence-root");

  const result = spawnSync(
    process.execPath,
    [
      "tests/run-manifest.mjs",
      "--evidence-root",
      escapedRoot,
    ],
    {
      cwd: packageRoot,
      encoding: "utf8",
      timeout: 30_000,
    },
  );

  assert.notEqual(result.status, 0);
  assert.match(
    result.stderr,
    /symlink|physical test evidence root|outside the evaluator package/iu,
  );
  await assert.rejects(access(escapedRoot));
});
