import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import { scenario } from "./support.mjs";

test("request-reference selection resolves only the named exact request input", () => {
  const input = scenario({ selection: "request-reference" });
  const closure = resolveContextClosure({
    workspace: input.workspace,
    selectors: [input.selector],
    requestInputs: input.requestInputs
  });

  assert.equal(closure.spec.layers.length, 1);
  assert.deepEqual(
    closure.spec.layers[0].sourceReference,
    input.record.reference
  );
  assert.equal(closure.spec.layers[0].selectorId, "brief-context");
});
