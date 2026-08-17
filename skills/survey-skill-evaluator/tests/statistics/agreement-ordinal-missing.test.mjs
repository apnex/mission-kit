import test from "node:test";
import assert from "node:assert/strict";
import { krippendorffAlpha } from "../../source/executables/statistics/index.mjs";

test("ordinal agreement applies declared rank distance and ignores only explicit missing ratings", () => {
  const result = krippendorffAlpha(
    [
      { ratings: ["low", "low", null] },
      { ratings: ["medium", "high", "medium"] },
      { ratings: ["high", null, "high"] },
    ],
    { scale: "ordinal", ordinalValues: ["low", "medium", "high"] },
  );
  assert.equal(result.distance, "squared_declared_rank");
  assert.equal(result.unitCount, 3);
  assert.equal(result.ratingCount, 7);
  assert.ok(Number.isFinite(result.alpha));
});
