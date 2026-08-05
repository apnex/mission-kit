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

test(
  "terminal dependency state rejects ready before any capability call",
  async () => {
    const harness = inertInitializationBoundary(
      "terminal-irreversible-initialization",
    );
    const adapter = createSurveyInitializationAdapter(
      initializationAuthority("terminal-irreversible"),
      harness.ports,
    );
    const terminal = await adapter.advance(
      adapter.initialState,
      {
        status: "blocked_terminal",
        resultDigest: digest("c"),
        reason: {
          code: "DEPENDENCY_TERMINAL",
          message: "This dependency cannot be retried.",
        },
      },
    );

    await assert.rejects(
      adapter.advance(terminal.state, {
        status: "ready",
        resultDigest: digest("d"),
      }),
      (error) =>
        error.code === "SURVEY_INITIALIZATION_TERMINAL",
    );
    assert.deepEqual(harness.calls, {
      read: 0,
      execute: 0,
      machineStateDigest: 0,
    });
    assert.equal(harness.store.commitRevision, 0);
    assert.equal(harness.store.journal.length, 0);
  },
);
