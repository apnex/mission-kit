import assert from "node:assert/strict";
import test from "node:test";
import {
  ValidationError,
} from "../../source/executables/engine/index.mjs";
import {
  makeCanonicalLifecycleFixture,
} from "../helpers/canonical-lifecycle-fixture.mjs";

test("EI03 deterministic coordination persists inert routed bytes and rejects action-authored future authority roots", async (t) => {
  let injectFutureAuthority = true;
  const fixture = await makeCanonicalLifecycleFixture({
    transitionIds: ["EC01"],
    actionById: {
      "apply-sealed-campaign-policy": ({ transition }) => ({
        core: injectFutureAuthority
          ? { authoritativeStateRoot: "a".repeat(64) }
          : {
              validatedInputDigest: "b".repeat(64),
              transitionId: transition.transitionId,
            },
      }),
      "commit-state-outbox": () => ({
        core: { routedWithoutInterpretation: true },
        messages: [
          {
            senderRole: "deterministic-orchestrator",
            receiverRole: "evidence-freezer",
            exactBytesDigest: "c".repeat(64),
          },
        ],
      }),
    },
  });
  t.after(fixture.cleanup);
  await fixture.seed({ transitionId: "EC01", objectId: "ei03-campaign" });
  const command = fixture.commandFor({
    transitionId: "EC01",
    objectId: "ei03-campaign",
    expectedRevision: 0,
    idempotencyKey: "ei03/validate/1",
    input: { sealedCampaignDigest: "d".repeat(64) },
  });

  await assert.rejects(fixture.engine.execute(command), ValidationError);
  let state = await fixture.load("campaign", "ei03-campaign", {
    required: true,
  });
  assert.equal(state.authoritativeStateCore.semanticState.revision, 0);

  injectFutureAuthority = false;
  await fixture.engine.execute(command);
  state = await fixture.load("campaign", "ei03-campaign", {
    required: true,
  });
  assert.equal(state.authoritativeStateCore.semanticState.revision, 1);
  assert.equal(state.authoritativeStateCore.outboxLedger.length, 1);
  assert.equal(
    state.authoritativeStateCore.outboxLedger[0].payload.receiverRole,
    "evidence-freezer",
  );
});
