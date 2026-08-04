import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("AuthoringSubmission rejects a normalized value outside field-ID syntax", async () => {
  await assertNegativeContract("authoring-submission");
});
