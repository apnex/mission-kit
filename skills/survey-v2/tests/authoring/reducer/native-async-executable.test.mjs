import assert from "node:assert/strict";
import test from "node:test";
import {
  compileExecutableRegistry,
} from "../../../source/authoring/kernel/executable-registry.mjs";
import {
  assertRegistryError,
  executableDigest,
} from "./support.mjs";

test(
  "registry compilation rejects a native AsyncFunction without invoking it",
  () => {
    let calls = 0;
    async function forbiddenGuard() {
      calls += 1;
      return { status: "pass" };
    }
    assertRegistryError(
      () => compileExecutableRegistry({
        guards: [{
          id: "async-guard",
          digest: executableDigest(),
          invoke: forbiddenGuard,
        }],
        handlers: [],
        validators: [],
      }),
      "EXECUTABLE_ASYNC_FORBIDDEN",
    );
    assert.equal(calls, 0);
  },
);
