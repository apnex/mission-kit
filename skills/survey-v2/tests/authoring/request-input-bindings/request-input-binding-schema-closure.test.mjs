import assert from "node:assert/strict";
import test from "node:test";
import {
  contractValidators,
} from "../contracts/support/contract-validation.mjs";
import {
  loadReducerScenario,
} from "../reducer/support.mjs";
import {
  configureActiveHeadInputBinding,
} from "./support.mjs";

test(
  "a request input binding rejects every ambient schema field",
  async () => {
    const scenario = await loadReducerScenario();
    configureActiveHeadInputBinding(scenario);
    scenario.profile.spec.tasks[0].requestInputBindings[0].ambient =
      true;
    const { byStem } = await contractValidators();
    const validate = byStem.get("authoring-profile-manifest");
    assert.equal(validate(scenario.profile), false);
    assert.equal(
      validate.errors.some(
        (error) =>
          error.instancePath ===
            "/spec/tasks/0/requestInputBindings/0" &&
          error.keyword === "additionalProperties",
      ),
      true,
    );
  },
);
