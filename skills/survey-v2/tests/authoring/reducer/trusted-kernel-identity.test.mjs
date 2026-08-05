import assert from "node:assert/strict";
import test from "node:test";
import {
  createReducerSubmissionScenario,
  executableDigest,
  executeReducerSubmission,
  passRegistrySource,
  rehashAuthority,
} from "./support.mjs";

test(
  "a rehashed profile cannot replace the exact host-trusted kernel identity",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    scenario.profile.spec.kernel.digest = executableDigest("f");
    rehashAuthority(scenario);
    let calls = 0;
    const result = await executeReducerSubmission(
      scenario,
      passRegistrySource({
        guardInvoke: () => {
          calls += 1;
          return { status: "pass" };
        },
      }),
    );
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "HOST_KERNEL_IDENTITY_MISMATCH",
    );
    assert.equal(calls, 0);
  },
);
