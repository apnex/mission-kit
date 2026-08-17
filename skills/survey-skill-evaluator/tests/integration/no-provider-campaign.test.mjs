import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { makeCampaignFixture } from "../helpers/campaign-fixture.mjs";
import {
  NO_PROVIDER_CAMPAIGN_TRANSITIONS,
} from "../../source/executables/orchestrator/index.mjs";

test("sealed no-provider campaign completes through canonical lifecycle transitions", async () => {
  const fixture = await makeCampaignFixture();
  try {
    const result = await fixture.orchestrator.advance();
    assert.equal(result.state, "EC18_CLOSED");
    assert.equal(result.assuranceLevel, "provisional_synthetic_only");
    assert.equal(result.liveAuthorityClaimed, false);
    assert.equal(result.promotionAuthorized, false);
    assert.deepEqual(
      result.committedTransitions,
      NO_PROVIDER_CAMPAIGN_TRANSITIONS,
    );

    const recommendation = JSON.parse(
      await readFile(
        join(fixture.workspaceRoot, "results", "recommendation.json"),
        "utf8",
      ),
    );
    assert.equal(
      recommendation.class,
      "insufficient_or_invalid_evidence",
    );
    assert.equal(recommendation.promotionAuthorized, false);
  } finally {
    await fixture.cleanup();
  }
});
