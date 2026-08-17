import assert from "node:assert/strict";
import test from "node:test";
import {
  CampaignOrchestrator,
  DeterministicNoProviderCampaignDriver,
} from "../../source/executables/orchestrator/index.mjs";
import {
  makeCampaignFixture,
  packageRoot,
} from "../helpers/campaign-fixture.mjs";

test("cold resume continues after an injected post-commit crash without duplicate events", async () => {
  const crashingDriver = new DeterministicNoProviderCampaignDriver({
    crashAfterTransitionId: "EC09",
  });
  const fixture = await makeCampaignFixture({
    executionDriver: crashingDriver,
  });
  try {
    await assert.rejects(
      fixture.orchestrator.advance(),
      /Injected crash after durable campaign commit/u,
    );
    const before = await fixture.orchestrator.status();
    assert.equal(before.phase, "EC6_PRIMARY_EVIDENCE_FROZEN");

    const recovered = await CampaignOrchestrator.open({
      packageRoot,
      workspaceRoot: fixture.workspaceRoot,
      executionDriver: new DeterministicNoProviderCampaignDriver({
        authorityTrustRoot: fixture.authority.trustRoot,
        authorityReceiptProvider: fixture.authority.provider,
      }),
      authorityTrustRoot: fixture.authority.trustRoot,
      authorityReceiptProvider: fixture.authority.provider,
    });
    const result = await recovered.advance({ resume: true });
    assert.equal(result.state, "EC18_CLOSED");
    const state = await recovered.stateStore.load(
      "campaign",
      "campaign-fixture",
      { required: true },
    );
    const transitionIds = state.authoritativeStateCore.eventLedger.map(
      (event) => event.core.transitionId,
    );
    assert.equal(new Set(transitionIds).size, transitionIds.length);
    assert.equal(transitionIds.filter((id) => id === "EC09").length, 1);
  } finally {
    await fixture.cleanup();
  }
});
