import test from "node:test";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertContextError,
  scenario
} from "./support.mjs";

test("a valid observed lifecycle state that differs from required state fails closed", () => {
  const input = scenario({
    phase: "draft",
    lifecycleRule: {
      mode: "json-pointer-state",
      path: "/status/phase"
    },
    requiredLifecycleState: "ready"
  });

  assertContextError(
    () => resolveContextClosure({
      workspace: input.workspace,
      selectors: [input.selector]
    }),
    "CONTEXT_LIFECYCLE_MISMATCH",
    "/selectors/0/requiredLifecycleState"
  );
});
