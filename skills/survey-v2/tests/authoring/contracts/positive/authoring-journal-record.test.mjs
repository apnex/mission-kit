import test from "node:test";
import { assertPositiveContract } from "../support/contract-validation.mjs";

test("AuthoringJournalRecord represents a closed evidence commit value", async () => {
  await assertPositiveContract("authoring-journal-record");
});
