import assert from "node:assert/strict";
import test from "node:test";
import {
  contractValidators,
} from "../contracts/support/contract-validation.mjs";
import {
  loadReducerScenario,
} from "../reducer/support.mjs";
import {
  configureExecutionClosure,
} from "./support.mjs";

test(
  "execution closure rejects every ambient schema field",
  async () => {
    const scenario = await loadReducerScenario();
    const closure = configureExecutionClosure(scenario);
    closure.ambient = true;
    const { byStem } = await contractValidators();
    const validate = byStem.get("authoring-profile-manifest");
    assert.equal(validate(scenario.profile), false);
    assert.equal(
      validate.errors.some(
        (error) =>
          error.instancePath === "/spec/executionClosure" &&
          error.keyword === "additionalProperties",
      ),
      true,
    );
  },
);
