import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("ResourceReference rejects a fifth identity field", async () => {
  await assertNegativeContract("resource-reference");
});
