import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  campaignAnalysisPlanFixture,
} from "../helpers/campaign-fixture.mjs";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

test("full-role analysis projects conformance, attention, and telemetry diagnostics without converting unresolved toil into harm", async (t) => {
  const analysisPlan = structuredClone(
    campaignAnalysisPlanFixture(),
  );
  analysisPlan.diagnosticMetricIds = [
    "ATTENTION_LEARNING",
    "ATTENTION_TOIL",
    "CONFORMANCE_PROTOCOL",
    "TELEMETRY_AVAILABILITY",
  ];
  const fixture = await makeFullRoleCampaignFixture({
    analysisPlanFixture: analysisPlan,
  });
  t.after(fixture.cleanup);

  const result = await fixture.orchestrator.advance();
  assert.equal(result.state, "EC18_CLOSED");

  const analysisResult = JSON.parse(
    await readFile(
      join(
        fixture.workspaceRoot,
        "results",
        "analysis-result.json",
      ),
      "utf8",
    ),
  );
  const analysisDetails = JSON.parse(
    await readFile(
      join(
        fixture.workspaceRoot,
        ".evaluator",
        "protected",
        "analysis-details.json",
      ),
      "utf8",
    ),
  );
  const diagnosticIds = new Set(
    analysisResult.metricResults.map(
      (metric) => metric.metricId,
    ),
  );
  for (const metricId of analysisPlan.diagnosticMetricIds) {
    assert.equal(diagnosticIds.has(metricId), true);
  }
  const toilResults = analysisResult.metricResults.filter(
    (metric) => metric.metricId === "ATTENTION_TOIL",
  );
  assert.equal(toilResults.length, 2);
  assert.equal(
    toilResults.every(
      (metric) =>
        metric.status === "not_observed" &&
        metric.value === null &&
        metric.lower === null &&
        metric.upper === null,
    ),
    true,
  );
  assert.match(
    analysisDetails.attention.ledgerDigest,
    /^[a-f0-9]{64}$/u,
  );
  assert.match(
    analysisDetails.attention.surfaceDigest,
    /^[a-f0-9]{64}$/u,
  );
  assert.equal(
    analysisResult.derivationRecordDigests.includes(
      analysisDetails.attention.ledgerDigest,
    ),
    true,
  );
  assert.equal(
    analysisResult.derivationRecordDigests.includes(
      analysisDetails.attention.surfaceDigest,
    ),
    true,
  );
  assert.ok(
    analysisResult.attention.directorJudgmentResultIds.length >
      0,
  );
  assert.equal(
    Array.isArray(
      analysisResult.attention.protectedLearningResultIds,
    ),
    true,
  );
  assert.ok(
    analysisResult.attention.unresolvedObservationIds.length >
      0,
  );
  assert.equal(
    analysisResult.attention
      .protectedLearningCanWorsenSelection,
    false,
  );
});
