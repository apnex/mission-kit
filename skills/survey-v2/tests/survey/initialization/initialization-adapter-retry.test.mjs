import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  createLiveSurveyHarness,
  surveyAuthoringMachineId,
  surveyPhaseMachineId,
} from "../profile/live-support.mjs";

function digest(character) {
  return `sha256:${character.repeat(64)}`;
}

test(
  "recoverable dependency retry commits exactly AT01 plus T02 once and derives active only from that postimage",
  async () => {
    const harness = await createLiveSurveyHarness({
      storeId: "survey-initialization-adapter-retry",
    });
    const calls = { read: 0, execute: 0 };
    const adapter = harness.createInitializationAdapter(
      {
        directorRef: "director.retry",
        proposerRef: "proposer.retry",
        bindingEvidence: "host-adapter:retry-test",
      },
      (operation) => {
        if (Object.hasOwn(calls, operation)) {
          calls[operation] += 1;
        }
      },
    );
    const before = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;
    const beforeBytes = canonicalize(before);
    const blockedDependency = {
      status: "blocked_recoverable",
      resultDigest: digest("7"),
      reason: {
        code: "DEPENDENCY_PENDING",
        message: "The dependency can be retried.",
      },
    };
    const blocked = await adapter.advance(
      adapter.initialState,
      blockedDependency,
    );
    const afterBlocked = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;

    assert.equal(blocked.kind, "wait");
    assert.equal(blocked.runtimeStatus, "blocked_recoverable");
    assert.equal(canonicalize(afterBlocked), beforeBytes);
    assert.deepEqual(calls, { read: 0, execute: 0 });
    assert.equal(afterBlocked.workspace.spec.openAssignment, null);

    const readyDependency = {
      status: "ready",
      resultDigest: digest("8"),
    };
    const active = await adapter.advance(
      blocked.state,
      readyDependency,
    );
    const committed = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;

    assert.equal(active.kind, "initialized");
    assert.equal(active.runtimeStatus, "active");
    assert.equal(active.state.runtimeStatus, "active");
    assert.equal(committed.commitRevision, 1);
    assert.equal(committed.journal.length, 1);
    assert.equal(
      committed.workspace.spec.authoringState,
      "survey_frame_required",
    );
    assert.equal(committed.workspace.spec.openAssignment, null);
    assert.deepEqual(
      committed.journal[0].machineEdges.map((edge) => [
        edge.machineId,
        edge.transitionId,
        edge.fromState,
        edge.eventId,
        edge.toState,
      ]),
      [
        [
          surveyAuthoringMachineId,
          "AT01",
          "new",
          "BEGIN_AUTHORING",
          "survey_frame_required",
        ],
        [
          surveyPhaseMachineId,
          "T02",
          "initialized",
          "BEGIN_R1_DESIGN",
          "round_1_drafting",
        ],
      ],
    );
    assert.equal(
      committed.journal[0].machineEdges.some(
        (edge) => edge.machineId === "runtime",
      ),
      false,
    );
    assert.equal(
      committed.workspace.spec.resourceVersions.some(
        (stored) =>
          stored.reference.kind === "AuthoringAssignment",
      ),
      false,
    );
    assert.equal(active.state.evidence.length, 2);
    assert.deepEqual(
      active.state.evidence.map(
        ({ disposition, runtimeStatus }) => [
          disposition,
          runtimeStatus,
        ],
      ),
      [
        ["wait", "blocked_recoverable"],
        ["activated", "active"],
      ],
    );

    const committedBytes = canonicalize(committed);
    const replay = await adapter.advance(
      active.state,
      readyDependency,
    );
    const afterReplay = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;

    assert.deepEqual(replay, active);
    assert.equal(canonicalize(afterReplay), committedBytes);
    assert.equal(afterReplay.commitRevision, 1);
    assert.equal(afterReplay.journal.length, 1);
    assert.deepEqual(calls, { read: 4, execute: 2 });
  },
);
