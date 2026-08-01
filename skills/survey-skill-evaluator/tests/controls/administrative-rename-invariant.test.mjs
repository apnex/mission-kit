import test from "node:test";
import assert from "node:assert/strict";
import { metamorphicInvariant } from "../../source/executables/statistics/index.mjs";

test("administrative renames leave the registered semantic projection invariant", () => {
  const result = metamorphicInvariant({
    baseline: { id: "old", content: { question: "Choose pacing" } },
    variants: [
      { id: "new", content: { question: "Choose pacing" } },
      { id: "another", content: { question: "Choose pacing" } },
    ],
    projector(value) {
      return value.content;
    },
  });
  assert.equal(result.passed, true);
  assert.equal(result.projectorTrustBoundary, "registered_package_function");
});
