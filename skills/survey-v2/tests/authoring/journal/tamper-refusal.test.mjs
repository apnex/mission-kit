import assert from "node:assert/strict";
import test from "node:test";
import {
  appendTransitionScenario,
  errorCode,
  replayScenario,
} from "./support.mjs";

test("changed historical bytes are refused before terminal replay", () => {
  const scenario = appendTransitionScenario();
  const journal = structuredClone(scenario.journal);
  journal[0].payloadDigest =
    `sha256:${"f".repeat(64)}`;
  assert.equal(errorCode(() => replayScenario(scenario, {
    journal,
  })), "JOURNAL_RECORD_DIGEST_MISMATCH");
});
