import test from "node:test";
import assert from "node:assert/strict";
import {
  readJson,
  runCompiler,
  withPackageCopy,
  writeJson,
} from "./package-fixture.mjs";

test("compiler rejects a duplicate authored metric identity", async () => {
  await withPackageCopy(async (root) => {
    const manifest = await readJson(root, "source/manifests/metrics.json");
    manifest.metrics.push(structuredClone(manifest.metrics[0]));
    await writeJson(root, "source/manifests/metrics.json", manifest);
    const result = runCompiler(root);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}\n${result.stderr}`, /duplicate metric ID/);
  });
});
