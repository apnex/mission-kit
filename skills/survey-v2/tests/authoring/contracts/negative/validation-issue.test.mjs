import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("ValidationIssue rejects an undeclared next action", async () => {
  await assertNegativeContract("validation-issue");
});
