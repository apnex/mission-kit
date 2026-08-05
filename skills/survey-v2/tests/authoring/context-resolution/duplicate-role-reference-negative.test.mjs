import test from "node:test";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertContextError,
  scenario,
  selector
} from "./support.mjs";

test("two selectors cannot emit the same role and exact source reference", () => {
  const input = scenario();
  const first = selector({
    id: "first-context",
    ordinal: 1,
    role: "shared"
  });
  const second = selector({
    id: "second-context",
    ordinal: 2,
    role: "shared"
  });

  assertContextError(
    () => resolveContextClosure({
      workspace: input.workspace,
      selectors: [first, second]
    }),
    "CONTEXT_LAYER_SOURCE_DUPLICATE",
    "/selectors/1"
  );
});
