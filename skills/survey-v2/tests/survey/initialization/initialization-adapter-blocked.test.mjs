import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  createSurveyInitializationAdapter,
} from "../../../source/authoring/survey/initialization-adapter.mjs";
import {
  digest,
  inertInitializationBoundary,
  initializationAuthority,
} from "./initialization-adapter-support.mjs";

test(
  "recoverable dependency returns an exact new-state wait without a capability call or store mutation",
  async () => {
    const harness = inertInitializationBoundary(
      "recoverable-initialization",
    );
    const before = canonicalize(harness.store);
    const adapter = createSurveyInitializationAdapter(
      initializationAuthority("recoverable"),
      harness.ports,
    );
    const dependencyResult = {
      status: "blocked_recoverable",
      resultDigest: digest("a"),
      reason: {
        code: "SOURCE_UNAVAILABLE",
        message: "The governed dependency is not available yet.",
      },
    };

    const first = await adapter.advance(
      adapter.initialState,
      dependencyResult,
    );
    const replay = await adapter.advance(
      first.state,
      dependencyResult,
    );

    assert.equal(first.kind, "wait");
    assert.deepEqual(first.authoringResult, {
      kind: "wait",
      state: {
        id: "new",
        label: "New",
        class: "wait",
      },
    });
    assert.equal(first.runtimeStatus, "blocked_recoverable");
    assert.equal(first.retry.allowed, true);
    assert.deepEqual(
      first.evidence.dependencyResult,
      dependencyResult,
    );
    assert.deepEqual(replay, first);
    assert.equal(canonicalize(harness.store), before);
    assert.deepEqual(harness.calls, {
      read: 0,
      execute: 0,
      machineStateDigest: 0,
    });
    assert.equal(harness.store.commitRevision, 0);
    assert.equal(harness.store.journal.length, 0);
    assert.equal(
      harness.store.workspace.spec.authoringState,
      "new",
    );
    assert.equal(
      harness.store.workspace.spec.openAssignment,
      null,
    );
    assert.equal(
      harness.store.workspace.spec.resourceVersions.some(
        (stored) =>
          stored?.reference?.kind === "AuthoringAssignment",
      ),
      false,
    );
    assert.equal(Object.isFrozen(first.state), true);
    assert.equal(Object.isFrozen(first.evidence), true);
  },
);
