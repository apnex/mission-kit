import { appendFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  runCompiler,
  withPackageCopy,
} from "../composition/package-fixture.mjs";

test("check mode detects a locally modified generated target", async () => {
  await withPackageCopy(async (root) => {
    const build = runCompiler(root);
    assert.equal(build.status, 0, build.stderr);
    await appendFile(join(root, "SKILL.md"), "\nunauthorized mutation\n");
    const check = runCompiler(root, ["--check"]);
    assert.notEqual(check.status, 0);
    assert.match(
      `${check.stdout}\n${check.stderr}`,
      /generated targets are stale or absent/,
    );
  });
});
