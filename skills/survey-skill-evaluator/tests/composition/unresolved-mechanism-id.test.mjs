import test from "node:test";
import assert from "node:assert/strict";
import {
  readJson,
  runCompiler,
  withPackageCopy,
  writeJson,
} from "./package-fixture.mjs";

test("compiler rejects a requirement that references an unresolved mechanism identity", async () => {
  await withPackageCopy(async (root) => {
    const manifest = await readJson(root, "source/manifests/requirements.json");
    manifest.requirements[0].mechanismIds[0] = "EM99";
    await writeJson(root, "source/manifests/requirements.json", manifest);
    const result = runCompiler(root);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /references unknown EM99/);
  });
});
