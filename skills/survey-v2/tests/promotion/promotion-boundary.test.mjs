import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { surveyRoot } from "../fixtures/root.mjs";

test("staging fixes name survey while promotion remains an external no-rewrite gate", async () => {
  const packageManifest = JSON.parse(await readFile(`${surveyRoot}/survey-v2.package.json`, "utf8"));
  const boundary = await readFile(
    `${surveyRoot}/source/fragments/assurance/promotion-boundary.md`,
    "utf8"
  );
  assert.equal(packageManifest.publicSkillName, "survey");
  assert.match(boundary, /separate reviewed authority/i);
  assert.match(boundary, /atomic no-rewrite replacement/i);
  assert.doesNotMatch(boundary, /automatically promote/i);
});
