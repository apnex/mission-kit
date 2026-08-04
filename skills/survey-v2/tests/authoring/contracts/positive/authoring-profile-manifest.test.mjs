import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("AuthoringProfileManifest accepts coherent pinned bindings", async () => {
  await assertPositiveContract("authoring-profile-manifest");
});
