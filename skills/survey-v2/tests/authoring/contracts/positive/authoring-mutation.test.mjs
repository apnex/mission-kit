import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("AuthoringMutation accepts the canonical bounded state-change fixture", async () => {
  await assertPositiveContract("authoring-mutation");
});
