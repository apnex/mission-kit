import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  lifecycleRuleDigest,
  projectLifecycleRuleCore
} from "../../../source/authoring/kernel/digests.mjs";
async function profileFixture() {
  return JSON.parse(await readFile(
    new URL(
      "../../fixtures/authoring/contracts/positive/authoring-profile-manifest.json",
      import.meta.url
    ),
    "utf8"
  ));
}

test("lifecycle-rule identity covers both expected state and evidence mechanism", async () => {
  const profile = await profileFixture();
  const selector = profile.spec.tasks[0].contextSelectors[0];
  const changedExpectation = structuredClone(selector);
  changedExpectation.requiredLifecycleState = "sealed";
  assert.deepEqual(projectLifecycleRuleCore(selector), {
    requiredLifecycleState: "frozen",
    lifecycleRule: { mode: "workspace-resource-version" }
  });
  assert.notEqual(
    lifecycleRuleDigest(selector),
    lifecycleRuleDigest(changedExpectation)
  );
});
