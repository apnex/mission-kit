import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("AuthoringCommitReceipt rejects revision regression", async () => {
  await assertNegativeContract("authoring-commit-receipt");
});
