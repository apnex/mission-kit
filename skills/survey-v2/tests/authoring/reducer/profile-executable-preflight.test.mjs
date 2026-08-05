import assert from "node:assert/strict";
import test from "node:test";
import {
  createReducerSubmissionScenario,
  executableDigest,
  executeReducerSubmission,
  passRegistrySource,
} from "./support.mjs";

test(
  "all profile-owned executable bindings preflight before any callback",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    const cases = [
      ["guard", (registry) => registry.guards[0]],
      ["unselected handler", (registry) => registry.handlers[1]],
      ["structural schema", (registry) => registry.validators[0]],
      ["semantic validator", (registry) => registry.validators[1]],
    ];
    for (const [label, select] of cases) {
      const calls = [];
      const registry = passRegistrySource({
        guardInvoke: () => {
          calls.push("guard");
          return { status: "pass" };
        },
        handlerInvoke: () => {
          calls.push("handler");
          return { status: "accept", products: [] };
        },
        validatorInvoke: () => {
          calls.push("validator");
          return { status: "pass" };
        },
      });
      select(registry).digest = executableDigest("f");
      const result = await executeReducerSubmission(scenario, registry);
      assert.equal(result.kind, "rejected", label);
      assert.equal(
        result.issues[0].spec.code,
        "EXECUTABLE_DIGEST_MISMATCH",
        label,
      );
      assert.deepEqual(calls, [], label);
    }
  },
);
