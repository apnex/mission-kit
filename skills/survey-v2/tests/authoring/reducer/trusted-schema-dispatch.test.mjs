import assert from "node:assert/strict";
import test from "node:test";
import {
  createReducerSubmissionScenario,
  executeReducerSubmission,
  executableDigest,
  passRegistrySource,
  validBriefProduct,
} from "./support.mjs";

test(
  "structural schema dispatch occurs only through the exact host-trusted schema binding",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    let validatorCalls = 0;
    const executables = passRegistrySource({
      handlerInvoke: () => ({
        status: "accept",
        products: [validBriefProduct(scenario)],
      }),
      validatorInvoke: () => {
        validatorCalls += 1;
        return { status: "pass" };
      },
    });
    executables.validators[0].digest = executableDigest("f");
    const result = await executeReducerSubmission(
      scenario,
      executables,
    );
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "EXECUTABLE_DIGEST_MISMATCH",
    );
    assert.equal(validatorCalls, 0);
  },
);
