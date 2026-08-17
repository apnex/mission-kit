import assert from "node:assert/strict";
import test from "node:test";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  SEALED_ROLE_CAMPAIGN_TRANSITIONS,
} from "../../source/executables/orchestrator/index.mjs";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

test("sealed fixture executes control and treatment through every isolated role and canonical campaign phase", async (t) => {
  const fixture = await makeFullRoleCampaignFixture();
  t.after(fixture.cleanup);

  const result = await fixture.orchestrator.advance();
  assert.equal(result.state, "EC18_CLOSED");
  assert.equal(result.assignmentCount, 2);
  assert.equal(result.stoppingExecutionClass, "fixed_completion");
  assert.equal(result.interimOutcomeLookCount, 0);
  assert.match(result.stoppingExecutionPlanDigest, /^[a-f0-9]{64}$/u);
  assert.equal(result.surveyExecutionCount, 2);
  assert.equal(result.downstreamExecutionCount, 2);
  assert.equal(result.independentBallotCount, 4);
  assert.ok(result.adjudicationCount >= 1);
  assert.equal(result.awarenessClosedBeforeUnmask, true);
  assert.equal(result.evidenceClass, "known_answer_protocol_integration");
  assert.equal(
    result.assuranceLevel,
    "known_answer_e0_e5_protocol_plumbing_only",
  );
  assert.equal(result.gateClaimCeiling, "E5");
  assert.deepEqual(result.excludedGateClaims, ["E6", "E7"]);
  assert.equal(
    result.candidateExecutionBoundary,
    "supplied_host_subject_adapter_fixture",
  );
  assert.equal(result.surveyEfficacyClaimed, false);
  assert.equal(result.blindPilotClaimed, false);
  assert.equal(result.promotionAuthorized, false);
  assert.equal(result.liveAuthorityClaimed, false);
  assert.equal(result.subjectExecutionCount, 2);
  assert.deepEqual(
    result.committedTransitions,
    SEALED_ROLE_CAMPAIGN_TRANSITIONS,
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
  assert.equal(analysisDetails.armSummaries.length, 2);
  assert.notEqual(
    analysisDetails.armSummaries[0].metricMeans
      .SEMANTIC_INTENT_ATOMS,
    analysisDetails.armSummaries[1].metricMeans
      .SEMANTIC_INTENT_ATOMS,
  );
  assert.equal(
    analysisDetails.armSummaries.some(
      (summary) =>
        summary.metricMeans.DOWNSTREAM_UTILITY === 1,
    ),
    true,
  );
  assert.equal(
    analysisDetails.armSummaries.some(
      (summary) =>
        summary.metricMeans.DOWNSTREAM_UTILITY === 0,
    ),
    true,
  );
  const analysisResult = JSON.parse(
    await readFile(
      join(fixture.workspaceRoot, "results", "analysis-result.json"),
      "utf8",
    ),
  );
  assert.equal(
    analysisResult.analysisResultId,
    "campaign-fixture:sealed-role-analysis",
  );
  assert.equal(analysisResult.metricResults.length, 4);
  assert.equal(analysisResult.effects.length, 2);
  assert.equal(analysisResult.missingnessResults.length, 2);
  assert.equal(
    analysisResult.multiplicityResult.strongFwerControlled,
    true,
  );
  assert.deepEqual(
    analysisResult.ranking.nonDominatedCandidateIds,
    ["candidate", "control"],
  );
  assert.equal(
    analysisResult.ranking.candidateRankResults.length,
    2,
  );
  assert.equal(
    analysisResult.ranking.totalOrderSupported,
    false,
  );
  assert.equal(analysisResult.populationViews.length, 3);
  const unmaskGrant = JSON.parse(
    await readFile(
      join(
        fixture.workspaceRoot,
        ".evaluator",
        "role-protocol",
        "awareness",
        "protected-unmask-authority.json",
      ),
      "utf8",
    ),
  );
  const unmaskDisposition = JSON.parse(
    await readFile(
      join(
        fixture.workspaceRoot,
        ".evaluator",
        "role-protocol",
        "awareness",
        "unmask-grant-dispositions",
        `${unmaskGrant.protectedUnmaskGrantId}.json`,
      ),
      "utf8",
    ),
  );
  fixture.schemaValidator.assert(
    "protected-unmask-grant-disposition",
    unmaskDisposition,
  );
  assert.equal(unmaskDisposition.disposition, "consumed");
  assert.equal(unmaskDisposition.liveAuthorityRemaining, false);
  const roleEvidenceRoot = join(
    fixture.workspaceRoot,
    "evidence",
    "roles",
  );
  const roleEvidenceFiles = (await readdir(roleEvidenceRoot))
    .filter((entry) => entry.endsWith(".json"));
  assert.ok(roleEvidenceFiles.length > 0);
  for (const file of roleEvidenceFiles) {
    const roleEvidence = JSON.parse(
      await readFile(join(roleEvidenceRoot, file), "utf8"),
    );
    assert.equal(
      roleEvidence.observableCaptureDigest,
      roleEvidence.observableCapture.captureDigest,
    );
    assert.deepEqual(
      Object.keys(roleEvidence.observableCapture.sections).sort(),
      [
        "failures",
        "inputs",
        "outputs",
        "provenance",
        "sessionState",
        "telemetry",
        "toolActions",
      ],
    );
    assert.equal(
      roleEvidence.observableCapture.sections.telemetry.value
        .modelConfiguration.availability,
      "not_reported_by_host",
    );
    assert.equal(
      roleEvidence.observableCapture.privateReasoningCaptured,
      false,
    );
  }
  const recommendation = JSON.parse(
    await readFile(
      join(fixture.workspaceRoot, "results", "recommendation.json"),
      "utf8",
    ),
  );
  assert.equal(recommendation.class, "insufficient_or_invalid_evidence");
  assert.deepEqual(recommendation.supportedClaimIds, []);
  assert.equal(recommendation.promotionAuthorized, false);
});
