import assert from "node:assert/strict";
import test from "node:test";
import { makeRuntimeFixture } from "../helpers/runtime-fixture.mjs";

test("lifecycle admission rejects hostile command views without invoking them", async (t) => {
  const fixture = await makeRuntimeFixture();
  t.after(fixture.cleanup);

  let getterCalls = 0;
  const accessorCommand = fixture.command();
  Object.defineProperty(accessorCommand, "objectId", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "attacker-controlled";
    },
  });
  await assert.rejects(fixture.engine.execute(accessorCommand), /accessor/u);
  assert.equal(getterCalls, 0);

  let trapCalls = 0;
  const proxyCommand = new Proxy(
    fixture.command(),
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
  );
  await assert.rejects(
    fixture.engine.execute(proxyCommand),
    /proxy|proxies/u,
  );
  assert.equal(trapCalls, 0);
});
