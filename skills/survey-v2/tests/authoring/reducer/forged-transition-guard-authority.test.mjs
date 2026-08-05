import test from "node:test";
import {
  evaluateTransitionGuards,
  selectNextAuthority,
} from "../../../source/authoring/kernel/manifest-selection.mjs";
import {
  assertSelectionError,
  loadReducerScenario,
  passRegistry,
} from "./support.mjs";

test(
  "guard evaluation rejects a transition body that differs from exact protocol authority",
  async () => {
    const scenario = await loadReducerScenario();
    const selected = selectNextAuthority(scenario);
    const forged = structuredClone(selected.transition);
    forged.guardIds = [];
    assertSelectionError(
      () => evaluateTransitionGuards({
        ...scenario,
        transition: forged,
        compiledExecutables: passRegistry(),
        input: { phase: "submission" },
      }),
      "AUTHORING_TRANSITION_AUTHORITY_MISMATCH",
    );
  },
);
