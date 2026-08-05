import test from "node:test";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertContextError,
  scenario
} from "./support.mjs";

test("ambient layer or ContextClosure input cannot inject caller-owned context", () => {
  const input = scenario();

  assertContextError(
    () => resolveContextClosure({
      workspace: input.workspace,
      selectors: [input.selector],
      layers: [],
      contextClosure: {}
    }),
    "CONTEXT_RESOLUTION_INVOCATION_INVALID",
    "/contextClosure"
  );
});
