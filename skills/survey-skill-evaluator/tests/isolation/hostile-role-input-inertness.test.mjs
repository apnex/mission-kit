import assert from "node:assert/strict";
import test from "node:test";
import { buildRoleCapsule } from "../../source/executables/isolation/index.mjs";

test("role capsule admission rejects hostile input views without invoking them", () => {
  let getterCalls = 0;
  const accessorProjection = {};
  Object.defineProperty(accessorProjection, "sourceRoot", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return "a".repeat(64);
    },
  });
  assert.throws(
    () =>
      buildRoleCapsule({
        roleClass: "survey-executor",
        workOrderId: "hostile-accessor",
        inputProjection: accessorProjection,
        outputSchemaId: "role-result",
      }),
    /accessor/u,
  );
  assert.equal(getterCalls, 0);

  let trapCalls = 0;
  const proxyProjection = new Proxy(
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
  );
  assert.throws(
    () =>
      buildRoleCapsule({
        roleClass: "survey-executor",
        workOrderId: "hostile-proxy",
        inputProjection: proxyProjection,
        outputSchemaId: "role-result",
      }),
    /proxy|proxies/u,
  );
  assert.equal(trapCalls, 0);
});
