import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("AuthoringRequest rejects later view identity", async () => {
  await assertNegativeContract("authoring-request");
});
