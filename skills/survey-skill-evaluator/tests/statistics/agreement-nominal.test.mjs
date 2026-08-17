import test from "node:test";
import assert from "node:assert/strict";
import { krippendorffAlpha } from "../../source/executables/statistics/index.mjs";

test("nominal Krippendorff alpha is computed from independent pre-adjudication ballots", () => {
  const result = krippendorffAlpha([
    ["pass", "pass", "pass"],
    ["fail", "fail", "fail"],
    ["pass", "pass", "pass"],
  ]);
  assert.equal(result.alpha, 1);
  assert.equal(result.preAdjudication, true);
  assert.equal(result.unitCount, 3);
  assert.equal(result.ratingCount, 9);
});
