import assert from "node:assert/strict";
import test from "node:test";
import {
  beginSurveyAuthoring,
  createLiveSurveyHarness,
  surveyAuthoringMachineId,
  surveyPhaseMachineId,
} from "./live-support.mjs";

test(
  "the live Survey initialization event atomically commits AT01 with its exact phase T02 coupling",
  async () => {
    const harness = await createLiveSurveyHarness();
    const {
      adapter,
      command,
      dependencyResult,
      result,
    } =
      await beginSurveyAuthoring(harness);
    assert.equal(result.kind, "initialized");
    assert.equal(result.runtimeStatus, "active");
    assert.deepEqual(result.state.accepted.command, command);

    const firstRead = await harness.coordinator.read(
      harness.storeId,
    );
    assert.equal(firstRead.snapshot.commitRevision, 1);
    assert.equal(
      firstRead.snapshot.workspace.spec.authoringState,
      "survey_frame_required",
    );
    assert.equal(
      firstRead.snapshot.workspace.spec.semanticRevision,
      1,
    );
    assert.equal(
      firstRead.snapshot.workspace.spec.evidenceRevision,
      1,
    );
    assert.deepEqual(
      firstRead.snapshot.journal[0].machineEdges.map(
        (edge) => [
          edge.machineId,
          edge.transitionId,
          edge.fromState,
          edge.toState,
        ],
      ),
      [
        [
          surveyAuthoringMachineId,
          "AT01",
          "new",
          "survey_frame_required",
        ],
        [
          surveyPhaseMachineId,
          "T02",
          "initialized",
          "round_1_drafting",
        ],
      ],
    );
    assert.deepEqual(
      firstRead.snapshot.workspace.spec.activeHeads.map(
        (head) => head.slot,
      ),
      ["intake", "policy"],
    );

    const replayed = await adapter.advance(
      result.state,
      dependencyResult,
    );
    const replayRead = await harness.coordinator.read(
      harness.storeId,
    );
    assert.deepEqual(replayed, result);
    assert.deepEqual(replayRead.snapshot, firstRead.snapshot);
  },
);
