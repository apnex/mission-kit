import test from "node:test";
import {
  assertPositiveContract,
} from "../support/contract-validation.mjs";

test("WorkspaceEffect represents one closed journal-owned persistence value", async () => {
  await assertPositiveContract("authoring-workspace-effect");
});
