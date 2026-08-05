import assert from "node:assert/strict";
import test from "node:test";
import {
  createReducerSubmissionScenario,
  executeReducerSubmission,
  executableDigest,
  passRegistrySource,
} from "./support.mjs";

test(
  "semantic-product handler dispatch occurs only through the exact host-trusted stable ID and executable digest",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    let calls = 0;
    const executables = passRegistrySource({
      handlerInvoke: () => {
        calls += 1;
        return { status: "accept", products: [] };
      },
    });
    executables.handlers[0].digest = executableDigest("f");
    const result = await executeReducerSubmission(
      scenario,
      executables,
    );
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "EXECUTABLE_DIGEST_MISMATCH",
    );
    assert.equal(calls, 0);
  },
);
