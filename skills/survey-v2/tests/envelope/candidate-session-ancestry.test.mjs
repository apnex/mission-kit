import assert from "node:assert/strict";
import test from "node:test";
import {
  newRun,
  reachAwaitingRatification
} from "../fixtures/runtime-fixture.mjs";

const mutations = [
  (model) => ({ ...model, workItem: "Substituted work item." }),
  (model) => ({ ...model, outcomeAxes: ["substituted-axis"] }),
  (model) => ({
    ...model,
    methodology: { ...model.methodology, projectionDigest: "sha256:".padEnd(71, "0") }
  }),
  (model) => ({
    ...model,
    authority: { ...model.authority, directorRef: "substituted-director" }
  }),
  (model) => ({
    ...model,
    interpretations: {
      ...model.interpretations,
      round1: { ...model.interpretations.round1, composite: "Substituted interpretation." }
    }
  }),
  (model) => ({
    ...model,
    lifecycleHandoff: { ...model.lifecycleHandoff, authorityRef: "substituted-director" }
  })
];

test("candidate commit rejects drift in every session-owned envelope ancestry field", async () => {
  for (const mutateComposite of mutations) {
    const run = await newRun();
    try {
      await assert.rejects(
        reachAwaitingRatification(run, { mutateComposite }),
        (error) => error.code === "CANDIDATE_ANCESTRY"
      );
      assert.equal(run.session.phase, "composite_drafting");
      assert.equal(run.session.candidates.length, 0);
    } finally {
      await run.cleanup();
    }
  }
});
