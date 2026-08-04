import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("AuthoringFormDefinition rejects inverted field bounds", async () => {
  await assertNegativeContract("authoring-form-definition");
});
