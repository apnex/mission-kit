import test from "node:test";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertContextError,
  refreshSelector,
  scenario
} from "./support.mjs";

test("a selected reference outside the selector's admitted resource type fails before lookup", () => {
  const input = scenario();
  input.selector.resourceType.kind = "Other";
  refreshSelector(input.selector);

  assertContextError(
    () => resolveContextClosure({
      workspace: input.workspace,
      selectors: [input.selector]
    }),
    "CONTEXT_SELECTOR_RESOURCE_TYPE_MISMATCH",
    "/selectors/0/resourceType"
  );
});
