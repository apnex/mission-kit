import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("SourceSnapshot accepts bounded exact bytes under logical names", async () => {
  await assertPositiveContract("source-snapshot");
});
