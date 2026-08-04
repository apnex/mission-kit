import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("AuthoringProtocol rejects a task state without its task binding", async () => {
  await assertNegativeContract("authoring-protocol");
});
