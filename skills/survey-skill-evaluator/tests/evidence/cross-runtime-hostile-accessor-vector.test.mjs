import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize as canonicalizeRuntime,
} from "../../source/executables/engine/canonical-json.mjs";
import {
  canonicalize as canonicalizeCompiler,
} from "../../source/executables/compiler/lib/hash.mjs";

test("compiler and runtime reject executable property views without invoking them", () => {
  const serializers = [
    ["compiler", canonicalizeCompiler],
    ["runtime", canonicalizeRuntime],
  ];

  for (const [implementation, canonicalize] of serializers) {
    let getterCalls = 0;
    const accessorObject = {};
    Object.defineProperty(accessorObject, "payload", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return "attacker-controlled";
      },
    });
    assert.throws(
      () => canonicalize(accessorObject),
      /inert|accessor/u,
      `${implementation} object accessor`,
    );
    assert.equal(getterCalls, 0, `${implementation} invoked an object getter`);

    const accessorArray = ["inert"];
    Object.defineProperty(accessorArray, "0", {
      enumerable: true,
      get() {
        getterCalls += 1;
        return "attacker-controlled";
      },
    });
    assert.throws(
      () => canonicalize(accessorArray),
      /inert|accessor/u,
      `${implementation} array accessor`,
    );
    assert.equal(getterCalls, 0, `${implementation} invoked an array getter`);

    let proxyTrapCalls = 0;
    const hostileProxy = new Proxy(
      {},
      {
        get() {
          proxyTrapCalls += 1;
          return "attacker-controlled";
        },
        getOwnPropertyDescriptor() {
          proxyTrapCalls += 1;
          return undefined;
        },
        getPrototypeOf() {
          proxyTrapCalls += 1;
          return Object.prototype;
        },
        ownKeys() {
          proxyTrapCalls += 1;
          return [];
        },
      },
    );
    assert.throws(
      () => canonicalize(hostileProxy),
      /proxy|proxies/u,
      `${implementation} proxy`,
    );
    assert.equal(proxyTrapCalls, 0, `${implementation} invoked a proxy trap`);
  }
});
