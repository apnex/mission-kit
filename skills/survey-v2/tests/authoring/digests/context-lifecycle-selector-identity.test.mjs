import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  contextSelectorDigest,
  sourceSnapshotDigest
} from "../../../source/authoring/kernel/digests.mjs";
async function fixture(name) {
  return JSON.parse(await readFile(
    new URL(
      `../../fixtures/authoring/contracts/positive/${name}.json`,
      import.meta.url
    ),
    "utf8"
  ));
}

test("changing lifecycle resolution authority changes selector identity without changing its source", async () => {
  const profile = await fixture("authoring-profile-manifest");
  const source = await fixture("source-snapshot");
  const selector = profile.spec.tasks[0].contextSelectors[0];
  const changed = structuredClone(selector);
  changed.lifecycleRule = {
    mode: "json-pointer-state",
    path: "/status/phase"
  };
  assert.notEqual(
    contextSelectorDigest(selector),
    contextSelectorDigest(changed)
  );
  assert.equal(sourceSnapshotDigest(source), source.spec.sourceDigest);
});
