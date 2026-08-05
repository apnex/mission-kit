import assert from "node:assert/strict";
import test from "node:test";
import {
  compileExecutableRegistry,
  invokeGuard,
  resolveExecutable,
} from "../../../source/authoring/kernel/executable-registry.mjs";
import {
  assertRegistryError,
  executableDigest,
} from "./support.mjs";

test(
  "a compiled executable registry is an opaque branded capability that cannot be mutated or forged",
  () => {
    const calls = [];
    const registry = {
      guards: [{
        id: "payload-guard",
        digest: executableDigest(),
        invoke() {
          calls.push("original");
          return { status: "pass" };
        },
      }],
      handlers: [],
      validators: [],
    };
    const compiled = compileExecutableRegistry(registry);
    const binding = {
      id: "payload-guard",
      digest: executableDigest(),
    };

    assert.equal(Object.isFrozen(compiled), true);
    assert.deepEqual(Reflect.ownKeys(compiled), []);
    assert.throws(() => {
      compiled.guards = new Map();
    }, TypeError);

    registry.guards[0].invoke = () => {
      calls.push("replacement");
      return { status: "reject", issues: [] };
    };
    assert.deepEqual(invokeGuard(compiled, binding, {}), {
      status: "pass",
    });
    assert.deepEqual(calls, ["original"]);

    const forged = {
      guards: new Map([[
        binding.id,
        {
          ...binding,
          invoke: () => ({ status: "pass" }),
        },
      ]]),
      handlers: new Map(),
      validators: new Map(),
    };
    assertRegistryError(
      () => resolveExecutable(forged, "guards", binding),
      "EXECUTABLE_REGISTRY_INVALID",
    );

    const widened = {
      guards: [],
      handlers: [],
      validators: [],
    };
    widened.guards.undeclared = true;
    assertRegistryError(
      () => compileExecutableRegistry(widened),
      "EXECUTABLE_REGISTRY_INVALID",
    );
  },
);
