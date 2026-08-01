import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { surveyRoot } from "../fixtures/root.mjs";

test("forward fixtures cannot substitute for the separately authorized Director canary", async () => {
  const packageManifest = JSON.parse(
    await readFile(`${surveyRoot}/survey-v2.package.json`, "utf8")
  );
  const gates = await readFile(
    `${surveyRoot}/source/fragments/assurance/verification-gates.md`,
    "utf8"
  );
  const boundary = await readFile(
    `${surveyRoot}/source/fragments/assurance/promotion-boundary.md`,
    "utf8"
  );
  for (let gate = 0; gate <= 6; gate += 1) {
    assert.match(gates, new RegExp(`\\bG${gate}\\b`));
  }
  assert.match(gates, /G7 remains the separately authorized live canary/);
  assert.match(boundary, /Do not run a live Director canary under implementation authority/);
  assert.match(boundary, /separately\s+authorized canary may copy/);
  assert.equal(
    packageManifest.members.some(({ path }) => (
      (path.startsWith("scripts/") || path.startsWith("source/executables/")) &&
      /(?:canary|promot)/i.test(path)
    )),
    false
  );
});
