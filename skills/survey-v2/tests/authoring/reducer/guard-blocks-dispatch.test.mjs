import assert from "node:assert/strict";
import test from "node:test";
import {
  createReducerSubmissionScenario,
  executeReducerSubmission,
  passRegistrySource,
} from "./support.mjs";

test(
  "a failed manifest guard prevents its guarded task or transition from dispatching",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    let handlerCalls = 0;
    const executables = passRegistrySource({
      guardInvoke: () => ({
        status: "reject",
        issues: [{
          code: "PAYLOAD_REJECTED",
          field: "/spec/summary",
          reason: "The summary is not admitted.",
          correction: "Supply an admitted summary.",
        }],
      }),
      handlerInvoke: () => {
        handlerCalls += 1;
        return { status: "accept", products: [] };
      },
    });
    const result = await executeReducerSubmission(
      scenario,
      executables,
    );
    assert.equal(result.kind, "rejected");
    assert.equal(result.issues[0].spec.code, "PAYLOAD_REJECTED");
    assert.equal(result.issues[0].spec.boundary, "profile.guard");
    assert.equal(handlerCalls, 0);
  },
);
