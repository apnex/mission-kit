import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("AuthoringFormDefinition accepts the closed text grammar", async () => {
  await assertPositiveContract("authoring-form-definition");
});
