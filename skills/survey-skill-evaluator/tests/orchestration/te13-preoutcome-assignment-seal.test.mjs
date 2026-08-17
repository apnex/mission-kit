import assert from "node:assert/strict";
import test from "node:test";
import {
  ConflictError,
} from "../../source/executables/engine/index.mjs";
import {
  makeCanonicalLifecycleFixture,
} from "../helpers/canonical-lifecycle-fixture.mjs";

test("TE13 assignment and reviewer commitments seal before outcome visibility and cannot be rewritten afterward", async (t) => {
  const fixture = await makeCanonicalLifecycleFixture({
    transitionIds: ["EC04", "EC05"],
    guardByTransition: {
      EC04: ({ command, currentData }) => ({
        pass:
          command.input.outcomeVisible === false &&
          typeof command.input.assignmentRoot === "string" &&
          typeof command.input.reviewerAllocationRoot === "string" &&
          currentData.outcomeLedger.length === 0,
        checkedBeforeOutcome: true,
      }),
    },
    mutationByTransition: {
      EC04: ({ currentData, command }) => ({
        ...currentData,
        assignmentCommitment: {
          assignmentRoot: command.input.assignmentRoot,
          reviewerAllocationRoot: command.input.reviewerAllocationRoot,
          blockedAlgorithm: command.input.blockedAlgorithm,
          immutable: true,
        },
      }),
      EC05: ({ currentData }) => ({
        ...currentData,
        executionStarted: true,
      }),
    },
  });
  t.after(fixture.cleanup);
  await fixture.seed({
    transitionId: "EC04",
    objectId: "te13-campaign",
    initialData: { outcomeLedger: [] },
  });

  await assert.rejects(
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "EC04",
        objectId: "te13-campaign",
        expectedRevision: 0,
        idempotencyKey: "te13/post-outcome-rewrite",
        input: {
          outcomeVisible: true,
          assignmentRoot: "a".repeat(64),
          reviewerAllocationRoot: "b".repeat(64),
          blockedAlgorithm: "balanced_blocks_v1",
        },
      }),
    ),
    ConflictError,
  );

  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "EC04",
      objectId: "te13-campaign",
      expectedRevision: 0,
      idempotencyKey: "te13/preoutcome-seal",
      input: {
        outcomeVisible: false,
        assignmentRoot: "c".repeat(64),
        reviewerAllocationRoot: "d".repeat(64),
        blockedAlgorithm: "balanced_blocks_v1",
      },
    }),
  );
  await fixture.engine.execute(
    fixture.commandFor({
      transitionId: "EC05",
      objectId: "te13-campaign",
      expectedRevision: 1,
      idempotencyKey: "te13/begin-execution",
      input: { commitmentAcknowledged: true },
    }),
  );
  await assert.rejects(
    fixture.engine.execute(
      fixture.commandFor({
        transitionId: "EC04",
        objectId: "te13-campaign",
        expectedRevision: 2,
        idempotencyKey: "te13/rewrite-after-start",
        input: {
          outcomeVisible: false,
          assignmentRoot: "e".repeat(64),
          reviewerAllocationRoot: "f".repeat(64),
          blockedAlgorithm: "favorable_reallocation",
        },
      }),
    ),
    ConflictError,
  );

  const state = await fixture.load("campaign", "te13-campaign", {
    required: true,
  });
  assert.equal(
    state.authoritativeStateCore.semanticState.data.assignmentCommitment
      .assignmentRoot,
    "c".repeat(64),
  );
  assert.equal(
    state.authoritativeStateCore.semanticState.data.assignmentCommitment
      .reviewerAllocationRoot,
    "d".repeat(64),
  );
});
