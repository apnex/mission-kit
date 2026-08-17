import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  foldPackageInventory,
} from "../../source/executables/engine/index.mjs";
import { packageRoot } from "../helpers/campaign-fixture.mjs";

test("package manifest and generated lock self-exclude recursive identity while binding source, runtime, compiler, and tests", async () => {
  const manifest = JSON.parse(
    await readFile(join(packageRoot, "package.manifest.json"), "utf8"),
  );
  const lock = JSON.parse(
    await readFile(join(packageRoot, "generated.lock.json"), "utf8"),
  );
  assert.deepEqual(manifest.exclusions, ["package.manifest.json"]);
  assert.deepEqual(lock.exclusions, [
    "generated.lock.json",
    "package.manifest.json",
  ]);
  assert.equal(
    lock.generatedTargets.some((entry) => lock.exclusions.includes(entry.path)),
    false,
  );
  assert.equal(
    manifest.entries.some((entry) => entry.path === "generated.lock.json"),
    true,
  );

  for (const prefix of [
    "source/",
    "source/executables/compiler/",
    "source/executables/orchestrator/",
    "tests/",
  ]) {
    assert.equal(
      manifest.entries.some((entry) => entry.path.startsWith(prefix)),
      true,
      prefix,
    );
  }

  const representativePaths = [
    "source/executables/compiler/build.mjs",
    "source/executables/orchestrator/campaign.mjs",
    "tests/schemas/closed-schema-undeclared-field.test.mjs",
    "generated.lock.json",
  ];
  const entries = await Promise.all(
    representativePaths.map(async (path) => ({
      path,
      mode: "0644",
      bytes: await readFile(join(packageRoot, path)),
    })),
  );
  const firstFold = foldPackageInventory(
    "evaluator-payload",
    entries,
    manifest.exclusions,
  );
  const secondFold = foldPackageInventory(
    "evaluator-payload",
    [...entries].reverse(),
    manifest.exclusions,
  );
  assert.equal(firstFold.root, secondFold.root);

  const changed = entries.map((entry, index) =>
    index === 0
      ? { ...entry, bytes: Buffer.concat([entry.bytes, Buffer.from("\n")]) }
      : entry,
  );
  assert.notEqual(
    foldPackageInventory("evaluator-payload", changed, manifest.exclusions)
      .root,
    firstFold.root,
  );
  assert.throws(
    () =>
      foldPackageInventory("evaluator-payload", entries, [
        "generated.lock.json",
        "package.manifest.json",
      ]),
    /exclusions are not canonical/u,
  );
});
