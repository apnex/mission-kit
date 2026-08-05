import assert from "node:assert/strict";
import test from "node:test";
import {
  createReducerSubmissionScenario,
  executeReducerSubmission,
  passRegistrySource,
  trustedReducerInputs,
  validBriefProduct,
} from "./support.mjs";

test(
  "the complete product group is shape-checked before any product validator runs",
  async () => {
    const scenario = await createReducerSubmissionScenario();
    let validatorCalls = 0;
    let mutationContractCalls = 0;
    const baseTrust = await trustedReducerInputs();
    const result = await executeReducerSubmission(
      scenario,
      passRegistrySource({
        handlerInvoke: () => ({
          status: "accept",
          products: [
            validBriefProduct(scenario),
            { bad: true },
          ],
        }),
        validatorInvoke: () => {
          validatorCalls += 1;
          return { status: "pass" };
        },
      }),
      {},
      {
        validateContract(candidate) {
          if (candidate?.kind === "AuthoringMutation") {
            mutationContractCalls += 1;
          }
          return baseTrust.validateContract(candidate);
        },
      },
    );
    assert.equal(result.kind, "rejected");
    assert.equal(validatorCalls, 0);
    assert.equal(mutationContractCalls, 0);
  },
);
