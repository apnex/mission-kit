import assert from "node:assert/strict";
import test from "node:test";
import {
  createSurveyInitializationAdapter,
} from "../../../source/authoring/survey/initialization-adapter.mjs";
import {
  digest,
  inertInitializationBoundary,
} from "./initialization-adapter-support.mjs";

test(
  "valid opaque authority is preserved byte-for-byte in immutable state and evidence",
  async () => {
    const authority = {
      directorRef: "  Director/α?ref = exact  ",
      proposerRef: "Proposer::opaque#[v1]",
      bindingEvidence: " host-adapter:opaque proof ",
    };
    const harness = inertInitializationBoundary(
      "opaque-authority-initialization",
    );
    const adapter = createSurveyInitializationAdapter(
      authority,
      harness.ports,
    );

    assert.deepEqual(adapter.initialState.authority, authority);
    const result = await adapter.advance(
      adapter.initialState,
      {
        status: "blocked_recoverable",
        resultDigest: digest("e"),
        reason: {
          code: "DEPENDENCY_PENDING",
          message: "Await the exact governed dependency result.",
        },
      },
    );

    assert.deepEqual(result.authority, authority);
    assert.deepEqual(result.state.authority, authority);
    assert.deepEqual(result.evidence.authority, authority);
    assert.equal(
      result.authority.directorRef,
      authority.directorRef,
    );
    assert.equal(
      result.authority.proposerRef,
      authority.proposerRef,
    );
    assert.equal(
      result.authority.bindingEvidence,
      authority.bindingEvidence,
    );
    assert.deepEqual(harness.calls, {
      read: 0,
      execute: 0,
      machineStateDigest: 0,
    });
    assert.equal(Object.isFrozen(result.authority), true);
    assert.equal(Object.isFrozen(result.evidence.authority), true);
  },
);
