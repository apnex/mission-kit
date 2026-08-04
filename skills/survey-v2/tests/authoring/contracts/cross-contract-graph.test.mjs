import assert from "node:assert/strict";
import test from "node:test";
import { validatePositiveGraph } from "./support/contract-validation.mjs";

test("the canonical positive fixture transaction has no contract or closure issue", async () => {
  assert.deepEqual(await validatePositiveGraph(), []);
});
