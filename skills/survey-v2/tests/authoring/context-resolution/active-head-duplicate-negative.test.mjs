import test from "node:test";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertContextError,
  clone,
  scenario
} from "./support.mjs";

test("two active heads for one slot never gain selection authority from array order", () => {
  const input = scenario();
  input.workspace.spec.activeHeads.push(
    clone(input.workspace.spec.activeHeads[0])
  );

  assertContextError(
    () => resolveContextClosure({
      workspace: input.workspace,
      selectors: [input.selector]
    }),
    "ACTIVE_HEAD_SLOT_DUPLICATE",
    "/workspace/spec/activeHeads/1"
  );
});
