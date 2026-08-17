import assert from "node:assert/strict";
import test from "node:test";
import {
  IsolatedRoleRunner,
  buildRoleCapsule,
} from "../../source/executables/isolation/index.mjs";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("role result admission rejects hostile output views without invoking them", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);
  const runner = new IsolatedRoleRunner({
    rootPath: fixture.rootPath,
    allowTestInProcess: true,
  });
  const capsule = buildRoleCapsule({
    roleClass: "survey-executor",
    workOrderId: "hostile-output",
    inputProjection: { assignedPackageRef: "opaque-subject-1" },
    outputSchemaId: "role-result",
  });

  let getterCalls = 0;
  await assert.rejects(
    runner.run(capsule, async () => async () => {
      const output = {};
      Object.defineProperty(output, "resultId", {
        enumerable: true,
        get() {
          getterCalls += 1;
          return "attacker-controlled";
        },
      });
      return output;
    }),
    /accessor/u,
  );
  assert.equal(getterCalls, 0);

  let trapCalls = 0;
  await assert.rejects(
    runner.run(capsule, async () => () =>
      new Proxy(
        {},
        {
          get() {
            trapCalls += 1;
            return "attacker-controlled";
          },
          getOwnPropertyDescriptor() {
            trapCalls += 1;
            return undefined;
          },
          ownKeys() {
            trapCalls += 1;
            return [];
          },
        },
      )),
    /proxy|proxies/u,
  );
  assert.equal(trapCalls, 0);
});
