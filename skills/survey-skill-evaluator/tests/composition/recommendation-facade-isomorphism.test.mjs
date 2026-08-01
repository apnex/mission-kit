import test from "node:test";
import assert from "node:assert/strict";
import { canonicalBytes } from "../../source/executables/engine/canonical-json.mjs";
import { sealRecommendation } from "../../source/executables/statistics/index.mjs";
import { recommendationFixture } from "./analytical-fixtures.mjs";

test("recommendation facade preserves exact sealed bytes and rejects promotion authority", () => {
  const fixture = recommendationFixture();
  const sealed = sealRecommendation(fixture);
  assert.deepEqual(canonicalBytes(sealed), canonicalBytes(fixture));
  assert.equal(Object.isFrozen(sealed), true);
  assert.throws(
    () => sealRecommendation({ ...fixture, promotionAuthorized: true }),
    /violates its sealed contract/,
  );
});
