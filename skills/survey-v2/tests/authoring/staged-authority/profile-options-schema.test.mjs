import assert from "node:assert/strict";
import test from "node:test";
import {
  validateContractSemantics,
} from "../../../source/authoring/kernel/contract-semantics.mjs";
import {
  contractValidators,
} from "../contracts/support/contract-validation.mjs";
import {
  configureActiveHeadInputBinding,
} from "../request-input-bindings/support.mjs";
import {
  loadReducerScenario,
} from "../reducer/support.mjs";
import {
  configureExecutionClosure,
} from "./support.mjs";

test(
  "the profile schema admits closed execution closure and request input binding options",
  async () => {
    const scenario = await loadReducerScenario();
    configureExecutionClosure(scenario);
    configureActiveHeadInputBinding(scenario);
    const { byStem } = await contractValidators();
    const validate = byStem.get("authoring-profile-manifest");
    assert.equal(validate(scenario.profile), true, validate.errors);
    assert.deepEqual(
      validateContractSemantics(scenario.profile),
      [],
    );
  },
);
