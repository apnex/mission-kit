import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("AuthoringAssignment rejects an exact-byte length mismatch", async () => {
  await assertNegativeContract("authoring-assignment");
});
