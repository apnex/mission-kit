import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

test("prestart external-authority rejection leaves no assignment activation or failure-envelope claim", async (t) => {
  const fixture = await makeFullRoleCampaignFixture();
  t.after(fixture.cleanup);
  fixture.driver.scenarioMaterialProvider = async () => {
    throw new Error("external scenario authority unavailable");
  };

  await assert.rejects(
    fixture.orchestrator.advance(),
    /external scenario authority unavailable/u,
  );
  const state = await fixture.orchestrator.stateStore.load(
    "campaign",
    "campaign-fixture",
    { required: true },
  );
  assert.equal(
    state.authoritativeStateCore.semanticState.state ??
      state.authoritativeStateCore.semanticState.semantic?.state,
    "EC0_DRAFT",
  );
  assert.equal(
    state.authoritativeStateCore.eventLedger.length,
    0,
  );
  assert.equal(fixture.invocations.length, 0);
  await assert.rejects(
    access(
      join(
        fixture.workspaceRoot,
        ".evaluator",
        "protected",
        "assignment-map.json",
      ),
    ),
  );
  await assert.rejects(
    access(
      join(
        fixture.workspaceRoot,
        "results",
        "campaign-failure-envelope.json",
      ),
    ),
  );
});
