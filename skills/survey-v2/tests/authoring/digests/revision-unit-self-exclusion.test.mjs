import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  revisionUnitDigest
} from "../../../source/authoring/kernel/digests.mjs";

const fixturePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../fixtures/authoring/contracts/positive/authoring-profile-manifest.json"
);

test("revision-unit identity excludes only unitDigest", async () => {
  const profile = JSON.parse(await readFile(fixturePath, "utf8"));
  const unit = profile.spec.revisionUnits[0];
  const changedSelf = structuredClone(unit);
  changedSelf.unitDigest =
    "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  const changedAuthority = structuredClone(unit);
  changedAuthority.normalPostcondition = "complete";

  assert.equal(revisionUnitDigest(unit), unit.unitDigest);
  assert.equal(revisionUnitDigest(changedSelf), unit.unitDigest);
  assert.notEqual(revisionUnitDigest(changedAuthority), unit.unitDigest);
});
