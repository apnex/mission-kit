import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("ProjectionArtifact rejects non-canonical base64", async () => {
  await assertNegativeContract("projection-artifact");
});
