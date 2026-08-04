import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("AuthoringAssignment accepts an immutable request and skeleton binding", async () => {
  await assertPositiveContract("authoring-assignment");
});
