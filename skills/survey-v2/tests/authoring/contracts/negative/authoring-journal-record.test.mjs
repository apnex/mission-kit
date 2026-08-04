import test from "node:test";
import { assertNegativeContract } from "../support/contract-validation.mjs";

test("AuthoringJournalRecord rejects a transition with no machine edge", async () => {
  await assertNegativeContract("authoring-journal-record");
});
