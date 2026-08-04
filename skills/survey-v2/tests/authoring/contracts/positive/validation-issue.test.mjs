import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("ValidationIssue accepts an actionable closed diagnostic", async () => {
  await assertPositiveContract("validation-issue");
});
