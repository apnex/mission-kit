import assert from "node:assert/strict";
import test from "node:test";
import {
  sealRecommendation,
} from "../../source/executables/statistics/index.mjs";
import {
  recommendationFixture,
} from "../composition/analytical-fixtures.mjs";

test("EM14 emits decision support with visible policy evidence and no release effect", () => {
  const recommendation = sealRecommendation(recommendationFixture());
  assert.equal(recommendation.policyClauses.length > 0, true);
  assert.equal(recommendation.dimensionalResultIds.length > 0, true);
  assert.equal(recommendation.promotionAuthorized, false);
  const bytes = JSON.stringify(recommendation);
  assert.equal(bytes.includes("releaseCredential"), false);
  assert.equal(bytes.includes("promotionCommand"), false);
});
