import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  revisionPlanDigest
} from "../../../source/authoring/kernel/digests.mjs";

const fixturePath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../fixtures/authoring/contracts/positive/authoring-profile-manifest.json"
);

test("revision-plan identity excludes only planDigest", async () => {
  const profile = JSON.parse(await readFile(fixturePath, "utf8"));
  const plan = profile.spec.revisionUnits[0].revisionPlans[0];
  const changedSelf = structuredClone(plan);
  changedSelf.planDigest =
    "sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
  const changedAuthority = structuredClone(plan);
  changedAuthority.eventId = "ACCEPT";

  assert.equal(revisionPlanDigest(plan), plan.planDigest);
  assert.equal(revisionPlanDigest(changedSelf), plan.planDigest);
  assert.notEqual(revisionPlanDigest(changedAuthority), plan.planDigest);
});
