import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("AuthoringSubmission accepts raw evidence and normalized values with provenance", async () => {
  await assertPositiveContract("authoring-submission");
});
