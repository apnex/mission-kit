import test from "node:test";
import assert from "node:assert/strict";
import { scoreRegisteredRubric } from "../../source/executables/evidence/index.mjs";

test("scoring rejects accessor and proxy views without invoking attacker code", () => {
  let getterCalls = 0;
  const observation = {};
  Object.defineProperty(observation, "quality", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return 10;
    },
  });
  assert.throws(
    () =>
      scoreRegisteredRubric(observation, {
        rubricId: "hostile",
        dimensions: [
          {
            dimensionId: "quality",
            sourcePath: "quality",
            transform: "identity",
          },
        ],
      }),
    /accessor/,
  );
  assert.equal(getterCalls, 0);

  let proxyTraps = 0;
  const rubric = new Proxy(
    {},
    {
      get() {
        proxyTraps += 1;
        return undefined;
      },
      ownKeys() {
        proxyTraps += 1;
        return [];
      },
      getOwnPropertyDescriptor() {
        proxyTraps += 1;
        return undefined;
      },
    },
  );
  assert.throws(() => scoreRegisteredRubric({}, rubric), /proxy|proxies/);
  assert.equal(proxyTraps, 0);
});
