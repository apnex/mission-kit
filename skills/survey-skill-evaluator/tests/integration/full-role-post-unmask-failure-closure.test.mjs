import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  campaignAnalysisPlanFixture,
} from "../helpers/campaign-fixture.mjs";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("post-unmask analysis failure consumes the sole grant and closes through ECF04m without recommendation or handoff", async (t) => {
  const analysisPlan = structuredClone(
    campaignAnalysisPlanFixture(),
  );
  analysisPlan.diagnosticMetricIds = ["UNIMPLEMENTED_FIXTURE_METRIC"];
  const fixture = await makeFullRoleCampaignFixture({
    analysisPlanFixture: analysisPlan,
  });
  t.after(fixture.cleanup);

  const result = await fixture.orchestrator.advance();
  assert.equal(result.state, "EC_FAILED_CLOSED");
  assert.deepEqual(result.committedTransitions, ["ECF04m"]);
  assert.equal(result.grantDispositionCount, 1);
  assert.equal(result.protectedUnmaskGrantDisposition, "consumed");
  assert.equal(result.promotionAuthorized, false);

  const envelope = await readJson(
    join(
      fixture.workspaceRoot,
      "results",
      "campaign-failure-envelope.json",
    ),
  );
  assert.equal(envelope.sourcePhase, "EC15_ANALYZING");
  assert.equal(envelope.admissible, false);
  assert.equal(
    envelope.issuedOrRetirementPendingGrantsRemaining,
    false,
  );
  const grant = await readJson(
    join(
      fixture.workspaceRoot,
      ".evaluator",
      "role-protocol",
      "awareness",
      "protected-unmask-authority.json",
    ),
  );
  const disposition = await readJson(
    join(
      fixture.workspaceRoot,
      ".evaluator",
      "role-protocol",
      "awareness",
      "unmask-grant-dispositions",
      `${grant.protectedUnmaskGrantId}.json`,
    ),
  );
  fixture.schemaValidator.assert(
    "protected-unmask-grant-disposition",
    disposition,
  );
  assert.equal(disposition.disposition, "consumed");
  assert.equal(disposition.failurePreparationRoot, null);
  const state = await readJson(
    join(
      fixture.workspaceRoot,
      ".evaluator",
      "state",
      "objects",
      "campaign",
      "campaign-fixture.json",
    ),
  );
  const unmaskEvent =
    state.authoritativeStateCore.eventLedger.find(
      (event) => event.core.transitionId === "EC20",
    );
  assert.ok(unmaskEvent);
  assert.equal(disposition.campaignEventRoot, unmaskEvent.eventRoot);
  assert.equal(
    envelope.readableSourceRoots.includes(
      disposition.dispositionReceiptRoot,
    ),
    true,
  );
  await access(
    join(
      fixture.workspaceRoot,
      "results",
      "campaign-evidence-envelope.json",
    ),
  );
  await assert.rejects(
    access(
      join(fixture.workspaceRoot, "results", "analysis-result.json"),
    ),
  );
  await assert.rejects(
    access(
      join(fixture.workspaceRoot, "results", "recommendation.json"),
    ),
  );
  await assert.rejects(
    access(
      join(
        fixture.workspaceRoot,
        "results",
        "campaign-lineage-disclosure.json",
      ),
    ),
  );
});
