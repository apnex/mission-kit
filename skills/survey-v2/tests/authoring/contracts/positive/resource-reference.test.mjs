import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("ResourceReference accepts exactly four identity fields", async () => {
  await assertPositiveContract("resource-reference");
});
