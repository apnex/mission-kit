import test from "node:test";
import assert from "node:assert/strict";
import {
  readJson,
  runCompiler,
  withPackageCopy,
  writeJson,
} from "./package-fixture.mjs";

test("compiler rejects a source owner that is not singularly bound to a real fragment", async () => {
  await withPackageCopy(async (root) => {
    const registry = await readJson(
      root,
      "source/fragments/assurance/source-owner-registry.json",
    );
    registry.owners[0].fragmentId = "missing.fragment";
    await writeJson(
      root,
      "source/fragments/assurance/source-owner-registry.json",
      registry,
    );
    const result = runCompiler(root);
    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /not singularly bound to its requirement and fragment/,
    );
  });
});
