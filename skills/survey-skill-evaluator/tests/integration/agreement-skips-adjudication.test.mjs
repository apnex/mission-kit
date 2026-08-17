import assert from "node:assert/strict";
import test from "node:test";
import {
  makeFullRoleCampaignFixture,
} from "../helpers/full-role-campaign-fixture.mjs";

test("identical independent ballots take the canonical no-adjudication branch", async (t) => {
  const fixture = await makeFullRoleCampaignFixture();
  t.after(fixture.cleanup);
  const originalFactory =
    fixture.driver.fixtureAdapterFactories["semantic-judge"];
  fixture.driver.fixtureAdapterFactories["semantic-judge"] =
    async (context) => {
      const invoke = await originalFactory(context);
      return async ({ input, ...runtimeContext }) =>
        invoke({
          ...runtimeContext,
          input: {
            ...input,
            reviewAssignment: {
              ...input.reviewAssignment,
              presentationRank: 0,
            },
          },
        });
    };

  const result = await fixture.orchestrator.advance();
  assert.equal(result.state, "EC18_CLOSED");
  assert.equal(result.adjudicationCount, 0);
  assert.equal(result.committedTransitions.includes("EC18"), true);
  assert.equal(result.committedTransitions.includes("EC17"), false);
  assert.equal(result.committedTransitions.includes("EC19"), false);
});
