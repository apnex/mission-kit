import test from "node:test";
import assert from "node:assert/strict";
import { positiveControlResult } from "../../source/executables/statistics/index.mjs";

test("positive control requires its registered direction and minimum effect", () => {
  assert.equal(positiveControlResult(-0.8, "negative", 0.5).passed, true);
  assert.equal(positiveControlResult(0.8, "negative", 0.5).passed, false);
});
