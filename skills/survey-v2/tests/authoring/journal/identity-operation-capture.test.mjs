import assert from "node:assert/strict";
import test from "node:test";
import {
  compileJournalIdentityPort,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  makeEvidenceJournalScenario,
} from "./support.mjs";

test("a compiled identity capability pins its validated operation references", () => {
  const { identity } = makeEvidenceJournalScenario();
  const identityPort = { ...identity.identityPort };
  const compiled = compileJournalIdentityPort({
    identityBinding: identity.identityBinding,
    identityScope: identity.identityScope,
    identityPort,
  });
  const occurrence = {
    machineId: "authoring-kernel",
    state: "complete",
    journalOrdinal: 2,
  };
  const expected = compiled.machineStateDigest(occurrence);
  identityPort.machineStateDigest = () =>
    `sha256:${"f".repeat(64)}`;

  assert.equal(compiled.machineStateDigest(occurrence), expected);
});
