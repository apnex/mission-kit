import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoleCapsule,
  IsolatedRoleRunner,
} from "../../source/executables/isolation/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("EM06 grants full synthetic behavior only inside a non-production disposable session", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const runner = new IsolatedRoleRunner({
    rootPath: fixture.rootPath,
    allowTestInProcess: true,
  });
  const capsule = buildRoleCapsule({
    roleClass: "synthetic-director",
    workOrderId: "disposable-director-1",
    inputProjection: { privateBrief: "Correct and ratify this trial naturally." },
    outputSchemaId: "synthetic-director-session-result",
  });
  const result = await runner.run(capsule, async () => async () => ({
    response: "I changed my preference after clarification.",
    correctionIssued: true,
    syntheticRatification: true,
    namespace: "disposable-director-1",
  }));
  assert.equal(result.content.correctionIssued, true);
  assert.equal(result.visibility.productionEligible, false);
  assert.equal(result.executionBoundary, "test_only_in_process");
});
