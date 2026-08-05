import assert from "node:assert/strict";
import test from "node:test";
import {
  createSurveyInitializationAdapter,
} from "../../../source/authoring/survey/initialization-adapter.mjs";
import {
  digest,
  inertInitializationBoundary,
  initializationAuthority,
} from "./initialization-adapter-support.mjs";

function terminalResult(character, code, message) {
  return {
    status: "blocked_terminal",
    resultDigest: digest(character),
    reason: { code, message },
  };
}

test(
  "terminal initialization admits only exact replay and rejects a different terminal observation",
  async () => {
    const boundary = inertInitializationBoundary(
      "terminal-observation-change",
    );
    const adapter = createSurveyInitializationAdapter(
      initializationAuthority("terminal-change"),
      boundary.ports,
    );
    const first = terminalResult(
      "d",
      "DEPENDENCY_DENIED",
      "Dependency authority denied initialization.",
    );
    const terminal = await adapter.advance(
      adapter.initialState,
      first,
    );
    const replay = await adapter.advance(
      terminal.state,
      first,
    );

    assert.deepEqual(replay, terminal);
    await assert.rejects(
      adapter.advance(
        terminal.state,
        terminalResult(
          "e",
          "DEPENDENCY_REVOKED",
          "A different terminal observation was reported.",
        ),
      ),
      (error) =>
        error?.code === "SURVEY_INITIALIZATION_TERMINAL",
    );
    assert.equal(terminal.state.evidence.length, 1);
    assert.deepEqual(boundary.calls, {
      read: 0,
      execute: 0,
      machineStateDigest: 0,
    });
  },
);
