import test from "node:test";
import assert from "node:assert/strict";
import { scoreObligationRegistry } from "../../source/executables/evidence/index.mjs";

test("an observed semantic finding without cited evidence is rejected", () => {
  assert.throws(
    () =>
      scoreObligationRegistry({
        registryId: "semantic-key-1",
        obligations: [{ obligationId: "intent", kind: "intent_atom" }],
        findings: [{ obligationId: "intent", status: "preserved", evidenceCitations: [] }],
      }),
    /requires a citation/,
  );
});
