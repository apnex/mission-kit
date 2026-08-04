import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("AuthoringMutation rejects an empty active-head change", async () => {
  await assertNegativeContract("authoring-mutation");
});
