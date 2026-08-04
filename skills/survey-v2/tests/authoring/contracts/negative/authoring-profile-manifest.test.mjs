import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("AuthoringProfileManifest rejects inverted target cardinality", async () => {
  await assertNegativeContract("authoring-profile-manifest");
});
