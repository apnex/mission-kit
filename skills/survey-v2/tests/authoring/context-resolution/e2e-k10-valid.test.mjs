import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  validateContract
} from "../contracts/support/contract-validation.mjs";
import { scenario } from "./support.mjs";

test("an end-to-end resolved closure satisfies the sealed K10 contract", async () => {
  const input = scenario();
  const closure = resolveContextClosure({
    workspace: input.workspace,
    selectors: [input.selector]
  });

  const validation = await validateContract("context-closure", closure);

  assert.equal(validation.valid, true);
  assert.deepEqual(validation.structuralErrors, []);
  assert.deepEqual(validation.semanticIssues, []);
});
