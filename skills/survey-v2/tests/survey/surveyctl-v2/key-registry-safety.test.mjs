import assert from "node:assert/strict";
import test from "node:test";
import {
  readdir,
  readFile,
  stat,
} from "node:fs/promises";
import {
  createSurveyctlHarness,
  initializeHarness,
  mode,
} from "./support.mjs";

test(
  "surveyctl creates an external owner-only key registry and never embeds key bytes in session state",
  async (testContext) => {
    const harness = await initializeHarness(
      await createSurveyctlHarness(testContext),
    );
    const entries = await readdir(harness.keyRoot);
    assert.equal(entries.length, 1);
    assert.equal(await mode(harness.keyRoot), 0o700);
    const keyFile = `${harness.keyRoot}/${entries[0]}`;
    assert.equal(await mode(keyFile), 0o600);
    assert.equal((await stat(keyFile)).nlink, 1);
    const key = await readFile(keyFile);
    const sessionBytes = await readFile(harness.sessionFile);
    assert.equal(key.byteLength, 32);
    assert.equal(
      sessionBytes.includes(key),
      false,
    );
    assert.equal(
      sessionBytes.toString("utf8").includes(key.toString("hex")),
      false,
    );
  },
);
