import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  scenario,
  selector
} from "./support.mjs";

test("an absent optional selector is omitted and emitted layer ordinals stay compact", () => {
  const input = scenario();
  const optional = selector({
    id: "optional-context",
    ordinal: 1,
    role: "optional",
    cardinality: { min: 0, max: 1 },
    selection: { mode: "active-head", slot: "absent" }
  });
  const selected = selector({
    id: "selected-context",
    ordinal: 2,
    role: "selected"
  });

  const closure = resolveContextClosure({
    workspace: input.workspace,
    selectors: [optional, selected]
  });

  assert.equal(closure.spec.layers.length, 1);
  assert.equal(closure.spec.layers[0].ordinal, 1);
  assert.equal(closure.spec.layers[0].selectorId, "selected-context");
});
