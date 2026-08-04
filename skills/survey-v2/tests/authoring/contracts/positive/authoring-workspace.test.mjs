import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("AuthoringWorkspace accepts explicit revisions and closed resource state", async () => {
  await assertPositiveContract("authoring-workspace");
});
