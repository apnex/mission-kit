import assert from "node:assert/strict";
import test from "node:test";
import {
  createReducerSubmissionScenario,
  executeReducerSubmission,
  passRegistrySource,
} from "./support.mjs";

test(
  "callback exceptions cannot expose their message through reducer diagnostics",
  async () => {
    const secret = "sentinel-secret-never-return";
    const scenario = await createReducerSubmissionScenario();
    const result = await executeReducerSubmission(
      scenario,
      passRegistrySource({
        guardInvoke: () => {
          throw new Error(secret);
        },
      }),
    );
    assert.equal(result.kind, "rejected");
    assert.equal(result.issues[0].spec.code, "EXECUTABLE_THROWN");
    assert.equal(JSON.stringify(result).includes(secret), false);
  },
);
