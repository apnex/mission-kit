import assert from "node:assert/strict";
import test from "node:test";
import {
  sealRecommendation,
} from "../../source/executables/statistics/index.mjs";
import {
  recommendationFixture,
} from "../composition/analytical-fixtures.mjs";

test("decision artifacts can carry evidence but cannot authorize promotion", () => {
  const recommendation = sealRecommendation(recommendationFixture());
  assert.equal(recommendation.promotionAuthorized, false);
  assert.equal(recommendation.supportedClaimIds.length, 1);
  assert.throws(
    () =>
      sealRecommendation({
        ...recommendationFixture(),
        promotionAuthorized: true,
      }),
    /violates its sealed contract/u,
  );
  assert.throws(
    () =>
      sealRecommendation({
        ...recommendationFixture(),
        promotionCommand: "install candidate",
      }),
    /violates its sealed contract/u,
  );
});
