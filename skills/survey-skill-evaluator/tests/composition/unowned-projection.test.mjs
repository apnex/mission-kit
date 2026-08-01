import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import {
  runCompiler,
  withPackageCopy,
} from "./package-fixture.mjs";

test("compiler rejects an unowned file inside a generated projection directory", async () => {
  await withPackageCopy(async (root) => {
    await writeFile(join(root, "references", "unowned.md"), "unowned\n");
    const result = runCompiler(root);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /unowned generated target/);
  });
});
