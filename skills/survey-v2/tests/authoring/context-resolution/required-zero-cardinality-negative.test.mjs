import test from "node:test";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertContextError,
  scenario,
  selector
} from "./support.mjs";

test("zero matches for a required selector fail its declared cardinality", () => {
  const input = scenario();
  const required = selector({
    selection: { mode: "active-head", slot: "missing" }
  });

  assertContextError(
    () => resolveContextClosure({
      workspace: input.workspace,
      selectors: [required]
    }),
    "CONTEXT_SELECTOR_CARDINALITY_MISMATCH",
    "/selectors/0/cardinality"
  );
});
