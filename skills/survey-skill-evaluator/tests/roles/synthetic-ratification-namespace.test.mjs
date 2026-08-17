import assert from "node:assert/strict";
import test from "node:test";
import {
  buildRoleCapsule,
  IsolatedRoleRunner,
} from "../../source/executables/isolation/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("synthetic ratification cannot escape its disposable work-order namespace", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const runner = new IsolatedRoleRunner({
    rootPath: fixture.rootPath,
    allowTestInProcess: true,
  });
  const capsule = buildRoleCapsule({
    roleClass: "synthetic-director",
    workOrderId: "trial-session-1",
    inputProjection: { prompt: "Ratify only this trial." },
    outputSchemaId: "synthetic-director-session-result",
  });
  const accepted = await runner.run(capsule, async () => async () => ({
    syntheticRatification: true,
    namespace: "trial-session-1",
  }));
  assert.equal(accepted.content.namespace, "trial-session-1");
  await assert.rejects(
    runner.run(capsule, async () => async () => ({
      syntheticRatification: true,
      namespace: "canonical-survey",
    })),
    /escaped its disposable work-order namespace/u,
  );
});
