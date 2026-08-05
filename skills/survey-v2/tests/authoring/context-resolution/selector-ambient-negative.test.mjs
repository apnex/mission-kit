import test from "node:test";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertContextError,
  scenario
} from "./support.mjs";

test("an ambient selector field cannot inject context authority", () => {
  const input = scenario();
  input.selector.ambientValue = "untracked";

  assertContextError(
    () => resolveContextClosure({
      workspace: input.workspace,
      selectors: [input.selector]
    }),
    "CONTEXT_SELECTOR_INVALID",
    "/selectors/0/ambientValue"
  );
});
