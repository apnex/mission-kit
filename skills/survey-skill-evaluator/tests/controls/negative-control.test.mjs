import test from "node:test";
import assert from "node:assert/strict";
import { negativeControlResult } from "../../source/executables/statistics/index.mjs";

test("negative control passes only inside its preregistered equivalence region", () => {
  assert.equal(negativeControlResult(0.02, 0.05).passed, true);
  assert.equal(negativeControlResult(0.08, 0.05).passed, false);
});
