import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("SourceSnapshot rejects an absolute inventory name", async () => {
  await assertNegativeContract("source-snapshot");
});
