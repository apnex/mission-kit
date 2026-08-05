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
  "semantic-validator dispatch occurs only through the exact host-trusted validator-set binding",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    const phases = [];
    const executables = passRegistrySource({
      handlerInvoke: () => ({
        status: "accept",
        products: [validBriefProduct(scenario)],
      }),
      validatorInvoke: (input) => {
        phases.push(input.phase);
        return { status: "pass" };
      },
    });
    executables.validators[1].digest = executableDigest("f");
    const result = await executeReducerSubmission(
      scenario,
      executables,
    );
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "EXECUTABLE_DIGEST_MISMATCH",
    );
    assert.deepEqual(phases, []);
  },
);
