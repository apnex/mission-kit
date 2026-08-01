import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBytes } from "../../source/executables/engine/canonical-json.mjs";
import { sealReviewAggregation } from "../../source/executables/statistics/index.mjs";
import { reviewAggregationFixture } from "./analytical-fixtures.mjs";

test("review-aggregation facade preserves exact sealed bytes and rejects unknown fields", () => {
  const fixture = reviewAggregationFixture();
  const sealed = sealReviewAggregation(fixture);
  assert.deepEqual(canonicalBytes(sealed), canonicalBytes(fixture));
  assert.equal(Object.isFrozen(sealed), true);
  assert.throws(
    () => sealReviewAggregation({ ...fixture, armIdentity: "treatment" }),
    /violates its sealed contract/,
  );
});
