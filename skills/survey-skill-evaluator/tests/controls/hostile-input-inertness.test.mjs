import test from "node:test";
import assert from "node:assert/strict";
import {
  empiricalDistribution,
  labelSwapControl,
} from "../../source/executables/statistics/index.mjs";

test("statistics and controls reject hostile property views without invoking them", () => {
  let getterCalls = 0;
  const values = [1];
  Object.defineProperty(values, "0", {
    enumerable: true,
    get() {
      getterCalls += 1;
      return 99;
    },
  });
  assert.throws(() => empiricalDistribution(values), /accessor/);
  assert.equal(getterCalls, 0);

  let proxyTraps = 0;
  const options = new Proxy(
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
  assert.throws(() => labelSwapControl([], options), /proxy/);
  assert.equal(proxyTraps, 0);
});
