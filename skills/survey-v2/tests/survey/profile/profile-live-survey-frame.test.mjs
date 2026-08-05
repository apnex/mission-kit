import assert from "node:assert/strict";
import test from "node:test";
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  beginSurveyAuthoring,
  createLiveSurveyHarness,
  createSurveyFrameSubmission,
  issueSurveyFrameAssignment,
  submitSurveyFrame,
  surveyAuthoringMachineId,
} from "./live-support.mjs";

test(
  "the live Survey AT02 path commits its ContextFrame, Survey, and one replay-stable GenerationRecord",
  async () => {
    const harness = await createLiveSurveyHarness({
      storeId: "survey-v2-profile-live-at02",
    });
    await beginSurveyAuthoring(harness);
    const issued =
      await issueSurveyFrameAssignment(harness);
    assert.equal(issued.kind, "assignment");
    assert.deepEqual(
      Object.keys(issued.request.spec.operation.inputs),
      ["intake", "policy"],
    );
    assert.deepEqual(
      issued.contextClosure.spec.layers.map(
        (layer) => [layer.ordinal, layer.role],
      ),
      [
        [1, "intake"],
        [2, "policy"],
      ],
    );
    assert.match(
      issued.viewBytes.toString("utf8"),
      /Design a precise context-framed Survey authoring workflow\./u,
    );

    const submission = createSurveyFrameSubmission(
      harness,
      issued,
    );
    const { command, result } = await submitSurveyFrame(
      harness,
      issued,
      submission,
    );
    assert.equal(result.kind, "committed");
    assert.equal(result.sidecars.length, 1);
    assert.equal(result.sidecars[0].kind, "GenerationRecord");
    const generationRecord = result.sidecars[0];
    assert.deepEqual(
      result.receipt.spec.createdResources.map(
        (reference) => reference.kind,
      ),
      ["ContextFrame", "Survey"],
    );
    assert.deepEqual(
      generationRecord.spec.result.createdResourceRefs,
      result.receipt.spec.createdResources,
    );
    assert.deepEqual(
      generationRecord.spec.requestRef,
      resourceReferenceFrom(issued.request),
    );
    assert.deepEqual(
      generationRecord.spec.assignmentRef,
      resourceReferenceFrom(issued.assignment),
    );
    assert.deepEqual(
      generationRecord.spec.submissionRef,
      resourceReferenceFrom(submission),
    );
    assert.deepEqual(
      generationRecord.spec.contextClosureRef,
      resourceReferenceFrom(issued.contextClosure),
    );
    assert.deepEqual(
      generationRecord.spec.result.commitReceiptRef,
      resourceReferenceFrom(result.receipt),
    );
    assert.deepEqual(
      generationRecord.spec.ancestry.inputResourceRefs,
      Object.keys(issued.request.spec.operation.inputs)
        .sort()
        .map((key) =>
          issued.request.spec.operation.inputs[key]),
    );
    assert.deepEqual(
      generationRecord.evidence.producer,
      submission.evidence.producerProvenance.generation,
    );

    const firstRead = await harness.coordinator.read(
      harness.storeId,
    );
    assert.equal(firstRead.snapshot.commitRevision, 3);
    assert.equal(
      firstRead.snapshot.workspace.spec.authoringState,
      "round_1_frame_required",
    );
    assert.equal(
      firstRead.snapshot.workspace.spec.semanticRevision,
      2,
    );
    assert.equal(
      firstRead.snapshot.workspace.spec.evidenceRevision,
      3,
    );
    assert.equal(
      firstRead.snapshot.workspace.spec.openAssignment,
      null,
    );
    assert.deepEqual(
      firstRead.snapshot.workspace.spec.activeHeads.map(
        (head) => head.slot,
      ),
      ["intake", "policy", "survey-frame", "survey"],
    );
    assert.deepEqual(
      firstRead.snapshot.journal[2].machineEdges.map(
        (edge) => [edge.machineId, edge.transitionId],
      ),
      [[surveyAuthoringMachineId, "AT02"]],
    );
    assert.deepEqual(
      firstRead.snapshot.journal.map(
        (record) => record.commitKind,
      ),
      ["transition", "evidence", "transition"],
    );
    assert.equal(
      firstRead.snapshot.workspace.spec.resourceVersions
        .filter(({ resource }) =>
          resource.kind === "GenerationRecord")
        .length,
      1,
    );

    const replayed = await harness.coordinator.execute(
      harness.storeId,
      command,
    );
    const replayRead = await harness.coordinator.read(
      harness.storeId,
    );
    assert.deepEqual(replayed, result);
    assert.deepEqual(replayRead.snapshot, firstRead.snapshot);
  },
);
