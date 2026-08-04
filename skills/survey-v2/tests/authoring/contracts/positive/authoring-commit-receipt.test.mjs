import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("AuthoringCommitReceipt schema represents a monotonic commit result", async () => {
  await assertPositiveContract("authoring-commit-receipt");
});
