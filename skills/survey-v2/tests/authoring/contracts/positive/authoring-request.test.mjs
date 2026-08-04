import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("AuthoringRequest accepts task, target, closure, contract, and executable pins", async () => {
  await assertPositiveContract("authoring-request");
});
