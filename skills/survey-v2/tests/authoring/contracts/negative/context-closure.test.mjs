import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("ContextClosure rejects a layer ordinal that differs from array order", async () => {
  await assertNegativeContract("context-closure");
});
