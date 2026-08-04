import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("AuthoringWorkspace rejects duplicate active-head slots", async () => {
  await assertNegativeContract("authoring-workspace");
});
