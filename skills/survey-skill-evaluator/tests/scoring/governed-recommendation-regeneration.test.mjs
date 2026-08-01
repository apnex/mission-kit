import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
  canonicalBytes,
} from "../../source/executables/engine/index.mjs";
import {
  sealRecommendation,
} from "../../source/executables/statistics/index.mjs";
import { makeCampaignFixture } from "../helpers/campaign-fixture.mjs";

test("sealed evidence regenerates the same governed recommendation without promotion authority", async (t) => {
  const first = await makeCampaignFixture();
  const second = await makeCampaignFixture();
  t.after(first.cleanup);
  t.after(second.cleanup);
  await first.orchestrator.advance();
  await second.orchestrator.advance();
  const firstRecommendation = JSON.parse(
    await readFile(
      join(first.workspaceRoot, "results", "recommendation.json"),
      "utf8",
    ),
  );
  const secondRecommendation = JSON.parse(
    await readFile(
      join(second.workspaceRoot, "results", "recommendation.json"),
      "utf8",
    ),
  );
  assert.deepEqual(
    canonicalBytes(firstRecommendation),
    canonicalBytes(secondRecommendation),
  );
  assert.equal(firstRecommendation.class, "insufficient_or_invalid_evidence");
  assert.deepEqual(firstRecommendation.supportedClaimIds, []);
  assert.equal(firstRecommendation.promotionAuthorized, false);
  assert.throws(
    () =>
      sealRecommendation({
        ...firstRecommendation,
        promotionAuthorized: true,
      }),
    /violates its sealed contract/u,
  );
});
