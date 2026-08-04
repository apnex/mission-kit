import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("AuthoringProtocol accepts a closed, reachable neutral state machine", async () => {
  await assertPositiveContract("authoring-protocol");
});
