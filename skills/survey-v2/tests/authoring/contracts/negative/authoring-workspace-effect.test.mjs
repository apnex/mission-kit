import test from "node:test";
import {
  assertNegativeContract,
} from "../support/contract-validation.mjs";

test("WorkspaceEffect rejects an ambient field outside its exact value contract", async () => {
  await assertNegativeContract("authoring-workspace-effect");
});
