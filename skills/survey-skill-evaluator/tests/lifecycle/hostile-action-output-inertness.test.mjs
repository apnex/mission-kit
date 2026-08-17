import assert from "node:assert/strict";
import test from "node:test";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("lifecycle action admission rejects hostile output views without invoking them", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);

  let getterCalls = 0;
  fixture.engine.registerAction("emit", () => {
    const output = {};
    Object.defineProperty(output, "core", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return { attackerControlled: true };
      },
    });
    return output;
  });
  await assert.rejects(fixture.engine.execute(fixture.command()), /accessor/u);
  assert.equal(getterCalls, 0);

  let trapCalls = 0;
  fixture.engine.registerAction(
    "emit",
    () =>
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
      ),
  );
  await assert.rejects(
    fixture.engine.execute(
      fixture.command({
        objectId: "sample-proxy-output",
        idempotencyKey: "sample/proxy-output/1",
      }),
    ),
    /proxy|proxies/u,
  );
  assert.equal(trapCalls, 0);
});
