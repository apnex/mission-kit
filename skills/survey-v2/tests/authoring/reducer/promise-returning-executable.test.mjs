import test from "node:test";
import {
  compileExecutableRegistry,
  invokeGuard,
} from "../../../source/authoring/kernel/executable-registry.mjs";
import {
  assertRegistryError,
  executableDigest,
} from "./support.mjs";

test(
  "a synchronous executable returning a rejected Promise is consumed and rejected deterministically",
  async () => {
    const binding = {
      id: "promise-guard",
      digest: executableDigest(),
    };
    const compiled = compileExecutableRegistry({
      guards: [{
        ...binding,
        invoke: () => Promise.reject(
          new Error("promise-executable-sentinel"),
        ),
      }],
      handlers: [],
      validators: [],
    });
    assertRegistryError(
      () => invokeGuard(compiled, binding, {}),
      "EXECUTABLE_ASYNC_FORBIDDEN",
    );
    await new Promise((resolve) => setImmediate(resolve));
  },
);
