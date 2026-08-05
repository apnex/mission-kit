import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  scenario,
  selector
} from "./support.mjs";

test("two emitted layers preserve manifest selector order and distinct roles", () => {
  const input = scenario();
  const foundation = selector({
    id: "foundation-context",
    ordinal: 1,
    role: "foundation"
  });
  const guidance = selector({
    id: "guidance-context",
    ordinal: 2,
    role: "guidance"
  });

  const closure = resolveContextClosure({
    workspace: input.workspace,
    selectors: [foundation, guidance]
  });

  assert.deepEqual(
    closure.spec.layers.map(({ ordinal, role, selectorId }) => ({
      ordinal,
      role,
      selectorId
    })),
    [
      {
        ordinal: 1,
        role: "foundation",
        selectorId: "foundation-context"
      },
      {
        ordinal: 2,
        role: "guidance",
        selectorId: "guidance-context"
      }
    ]
  );
});
