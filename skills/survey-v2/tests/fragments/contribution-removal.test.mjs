import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { surveyRoot } from "../fixtures/root.mjs";

test("capability removal proves every included fragment contribution", async () => {
  const packageManifest = JSON.parse(
    await readFile(`${surveyRoot}/survey-v2.package.json`, "utf8")
  );
  const descriptorPaths = packageManifest.members
    .map((member) => member.path)
    .filter((memberPath) => memberPath.endsWith(".fragment.json"));
  const fragments = await Promise.all(descriptorPaths.map(async (descriptorPath) => JSON.parse(
    await readFile(`${surveyRoot}/${descriptorPath}`, "utf8")
  )));
  const allCapabilities = fragments.flatMap((fragment) => fragment.composition.provides);
  assert.equal(new Set(allCapabilities).size, allCapabilities.length);
  for (const removed of fragments) {
    assert.ok(removed.composition.provides.length > 0, removed.id);
    assert.ok(removed.contribution.obligations.length > 0, removed.id);
    const remainingCapabilities = new Set(
      fragments
        .filter((fragment) => fragment.id !== removed.id)
        .flatMap((fragment) => fragment.composition.provides)
    );
    for (const capability of removed.composition.provides) {
      assert.equal(remainingCapabilities.has(capability), false, `${removed.id}: ${capability}`);
    }
  }
});
