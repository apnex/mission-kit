import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoleCapsule,
  IsolatedRoleRunner,
} from "../../source/executables/isolation/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("synthetic Director actions stay inside one disposable session and cannot carry real release authority", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const runner = new IsolatedRoleRunner({
    rootPath: fixture.rootPath,
    allowTestInProcess: true,
  });
  const capsule = buildRoleCapsule({
    roleClass: "synthetic-director",
    workOrderId: "director-session-1",
    inputProjection: {
      scopedPrincipal: {
        principalId: "synthetic-director-1",
        scope: "disposable-evaluation-session",
      },
      publicScenario: "Choose naturally within the private brief.",
    },
    outputSchemaId: "synthetic-director-session-result",
  });
  const result = await runner.run(capsule, async () => async () => ({
    response: "I prefer the concise option for this test session.",
    syntheticRatification: true,
    namespace: "director-session-1",
  }));
  assert.equal(result.content.namespace, "director-session-1");
  assert.equal(result.visibility.productionEligible, false);
  assert.equal(result.executionBoundary, "test_only_in_process");

  await assert.rejects(
    runner.run(capsule, async () => async () => ({
      response: "Promote this package.",
      promotion: { authorized: true },
    })),
    /forbidden authority field/u,
  );
  assert.throws(
    () =>
      buildRoleCapsule({
        roleClass: "synthetic-director",
        workOrderId: "director-session-escape",
        inputProjection: { releaseCredential: "host-secret" },
        outputSchemaId: "synthetic-director-session-result",
      }),
    /forbidden field/u,
  );
});
