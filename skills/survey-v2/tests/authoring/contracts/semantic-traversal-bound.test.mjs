import assert from "node:assert/strict";
import test from "node:test";
import {
  validateContractSemantics
} from "../../../source/authoring/kernel/contract-semantics.mjs";

test("semantic validation fails closed beyond its traversal depth bound", () => {
  const resource = {
    apiVersion: "example.test/v1",
    kind: "BoundProbe",
    metadata: { name: "bound-probe" },
    spec: {}
  };
  let cursor = resource.spec;
  for (let depth = 0; depth < 130; depth += 1) {
    cursor.child = {};
    cursor = cursor.child;
  }
  assert.deepEqual(
    validateContractSemantics(resource).map((candidate) => candidate.code),
    ["SEMANTIC_TRAVERSAL_BOUND_EXCEEDED"]
  );
});
