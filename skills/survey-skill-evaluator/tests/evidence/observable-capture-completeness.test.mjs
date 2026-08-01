import assert from "node:assert/strict";
import test from "node:test";
import {
  captureObservableEvidence,
  OBSERVABLE_SECTIONS,
} from "../../source/executables/evidence/index.mjs";
import {
  canonicalBytes,
} from "../../source/executables/engine/index.mjs";

test("observable capture binds every registered section and rejects private reasoning", () => {
  const input = {
    captureId: "attempt-17",
    inputs: { promptRef: "input:1" },
    outputs: { resultRef: "output:1" },
    sessionState: { phase: "closed", revision: 12 },
    toolActions: [{ tool: "read", resultRef: "tool:1" }],
    telemetry: [{ kind: "turns", value: 3 }],
    failures: [{ class: "none", evidenceRef: "failure:none" }],
    provenance: {
      adapterDigest: "a".repeat(64),
      environmentDigest: "b".repeat(64),
    },
  };
  const captured = captureObservableEvidence(input);
  assert.deepEqual(Object.keys(captured.sections), OBSERVABLE_SECTIONS);
  for (const section of OBSERVABLE_SECTIONS) {
    assert.deepEqual(
      canonicalBytes(captured.sections[section].value),
      canonicalBytes(input[section]),
    );
    assert.match(captured.sections[section].digest, /^[a-f0-9]{64}$/u);
  }
  assert.equal(captured.privateReasoningCaptured, false);
  assert.equal(Object.isFrozen(captured), true);

  assert.throws(
    () =>
      captureObservableEvidence({
        ...input,
        outputs: {
          resultRef: "output:1",
          nested: { privateReasoning: "hidden scratchpad" },
        },
      }),
    /must not capture private reasoning/u,
  );
});
