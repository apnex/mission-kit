import test from "node:test";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertContextError,
  scenario,
  selector
} from "./support.mjs";

test("selector array order cannot override declared selector ordinals", () => {
  const input = scenario();
  const first = selector({
    id: "first-context",
    ordinal: 1,
    role: "first"
  });
  const second = selector({
    id: "second-context",
    ordinal: 2,
    role: "second"
  });

  assertContextError(
    () => resolveContextClosure({
      workspace: input.workspace,
      selectors: [second, first]
    }),
    "CONTEXT_SELECTOR_ORDER_INVALID",
    "/selectors/0/ordinal"
  );
});
