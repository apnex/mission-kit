import test from "node:test";
import assert from "node:assert/strict";
import {
  readJson,
  runCompiler,
  withPackageCopy,
  writeJson,
} from "./package-fixture.mjs";

test("compiler rejects a test mechanism that is not traced by its requirement", async () => {
  await withPackageCopy(async (root) => {
    const requirements = await readJson(
      root,
      "source/manifests/requirements.json",
    );
    const manifest = await readJson(root, "source/manifests/tests.json");
    let descriptorPath = null;
    let descriptor = null;
    for (const candidatePath of manifest.descriptorPaths) {
      const candidate = await readJson(root, candidatePath);
      if (
        candidate.obligationId ===
        requirements.requirements[0].requirementId
      ) {
        descriptorPath = candidatePath;
        descriptor = candidate;
        break;
      }
    }
    assert.notEqual(descriptorPath, null);
    assert.notEqual(descriptor, null);
    const allowed = new Set(requirements.requirements[0].mechanismIds);
    descriptor.mechanismId = Array.from(
      { length: 20 },
      (_, index) => `EM${String(index + 1).padStart(2, "0")}`,
    ).find((mechanismId) => !allowed.has(mechanismId));
    await writeJson(root, descriptorPath, descriptor);
    const result = runCompiler(root);
    assert.notEqual(result.status, 0);
    assert.match(
      `${result.stdout}\n${result.stderr}`,
      /mechanism is not traced by its requirement/,
    );
  });
});
