import assert from "node:assert/strict";
import test from "node:test";
import {
  sha256Value,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  createSurveyInitializationAdapter,
} from "../../../source/authoring/survey/initialization-adapter.mjs";
import {
  inertInitializationBoundary,
  initializationAuthority,
} from "./initialization-adapter-support.mjs";

function blockedResult(ordinal) {
  return {
    status: "blocked_recoverable",
    resultDigest: sha256Value({
      domain:
        "mission-kit:survey-v2:test-initialization-evidence/v1",
      ordinal,
    }),
    reason: {
      code: "DEPENDENCY_PENDING",
      message: `Dependency observation ${ordinal} remains pending.`,
    },
  };
}

test(
  "initialization evidence refuses a sixty-fifth distinct wait before producing an unreplayable state",
  async () => {
    const boundary = inertInitializationBoundary(
      "initialization-evidence-limit",
    );
    const adapter = createSurveyInitializationAdapter(
      initializationAuthority("evidence-limit"),
      boundary.ports,
    );
    let state = adapter.initialState;
    let lastResult;
    for (let ordinal = 1; ordinal <= 64; ordinal += 1) {
      lastResult = blockedResult(ordinal);
      state = (
        await adapter.advance(state, lastResult)
      ).state;
    }
    assert.equal(state.evidence.length, 64);

    await assert.rejects(
      adapter.advance(state, blockedResult(65)),
      (error) =>
        error?.code ===
          "SURVEY_INITIALIZATION_EVIDENCE_LIMIT",
    );
    const replay = await adapter.advance(
      state,
      lastResult,
    );

    assert.deepEqual(replay.state, state);
    assert.equal(replay.state.evidence.length, 64);
    assert.deepEqual(boundary.calls, {
      read: 0,
      execute: 0,
      machineStateDigest: 0,
    });
  },
);
