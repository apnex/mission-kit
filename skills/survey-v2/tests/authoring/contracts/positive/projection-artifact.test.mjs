import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("ProjectionArtifact accepts ordered sources and exact visible bytes", async () => {
  await assertPositiveContract("projection-artifact");
});
