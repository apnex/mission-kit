import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  contextSelectorDigest
} from "../../../source/authoring/kernel/digests.mjs";

const profile = JSON.parse(await readFile(
  new URL(
    "../../fixtures/authoring/contracts/positive/authoring-profile-manifest.json",
    import.meta.url
  ),
  "utf8"
));

test("context-selector identity excludes only selectorDigest", () => {
  const selector = profile.spec.tasks[0].contextSelectors[0];
  const changedSelf = structuredClone(selector);
  changedSelf.selectorDigest =
    "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  const changedAuthority = structuredClone(selector);
  changedAuthority.role = "different-role";
  assert.equal(
    contextSelectorDigest(changedSelf),
    contextSelectorDigest(selector)
  );
  assert.notEqual(
    contextSelectorDigest(changedAuthority),
    contextSelectorDigest(selector)
  );
});
