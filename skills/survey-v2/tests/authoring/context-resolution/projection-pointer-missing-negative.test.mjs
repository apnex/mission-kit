import test from "node:test";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertContextError,
  refreshSelector,
  scenario
} from "./support.mjs";

test("a missing projection pointer fails without a partial ContextClosure", () => {
  const input = scenario();
  input.selector.projection.fields = ["/spec/missing"];
  refreshSelector(input.selector);

  assertContextError(
    () => resolveContextClosure({
      workspace: input.workspace,
      selectors: [input.selector]
    }),
    "JSON_POINTER_UNRESOLVED",
    "/selectors/0/projection/fields/0"
  );
});
