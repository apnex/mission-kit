import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../../source/authoring/kernel/canonical.mjs";
import {
  reduceAuthoring,
} from "../../../source/authoring/kernel/manifest-reducer.mjs";
import {
  loadReducerScenario,
  trustedReducerInputs,
} from "./support.mjs";

test(
  "repeated task selection from identical frozen inputs returns byte-identical results",
  async () => {
    const scenario = await loadReducerScenario();
    const trusted = await trustedReducerInputs();
    const command = { class: "next", inputs: {} };
    const first = canonicalize(reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      command,
      trusted,
    ));
    const second = canonicalize(reduceAuthoring(
      scenario.profile,
      scenario.protocol,
      scenario.workspace,
      command,
      trusted,
    ));
    assert.equal(second, first);
  },
);
