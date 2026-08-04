import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("ContextClosure accepts ordered role-labelled immutable layers", async () => {
  await assertPositiveContract("context-closure");
});
