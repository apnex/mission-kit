import assert from "node:assert/strict";
import test from "node:test";
import {
  newRun,
  reachAwaitingRatification
} from "../fixtures/runtime-fixture.mjs";

test("candidate commit rejects dependency evidence that differs from the sealed resolution", async () => {
  const run = await newRun();
  try {
    await assert.rejects(
      reachAwaitingRatification(run, {
        mutateComposite: (model) => ({
          ...model,
          dependencies: model.dependencies.map((dependency) => ({
            ...dependency,
            repository: "substituted/repository"
          }))
        })
      }),
      (error) => error.code === "DEPENDENCY_MAPPING_INCOMPLETE"
    );
    assert.equal(run.session.phase, "composite_drafting");
    assert.equal(run.session.candidates.length, 0);
  } finally {
    await run.cleanup();
  }
});
