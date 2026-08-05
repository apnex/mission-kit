import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  MAX_TEXT_FORM_BYTES,
} from "../../../source/authoring/kernel/text-forms.mjs";
import {
  SURVEY_SOURCE_MAX_AGGREGATE_BYTES,
  SURVEY_SOURCE_MAX_ENTRY_BYTES,
} from "../../../source/authoring/survey/source-snapshot.mjs";
import {
  createLiveSurveyHarness,
} from "../profile/live-support.mjs";

function digest(character) {
  return `sha256:${character.repeat(64)}`;
}

test(
  "sealed initialization authority rejects a deterministic over-one-MiB Director projection before AT01",
  async () => {
    const sourceBytes = Buffer.alloc(
      MAX_TEXT_FORM_BYTES - 576,
      0x61,
    );
    assert.equal(
      sourceBytes.byteLength <= SURVEY_SOURCE_MAX_ENTRY_BYTES,
      true,
    );
    assert.equal(
      sourceBytes.byteLength <=
        SURVEY_SOURCE_MAX_AGGREGATE_BYTES,
      true,
    );
    const harness = await createLiveSurveyHarness({
      storeId: "survey-initialization-projection-fit-rejection",
      sourceEntries: [{
        logicalName: "large-intent.txt",
        bytes: sourceBytes,
      }],
    });
    assert.equal(
      harness.sourceSnapshot.spec.inventory[0].content.byteLength,
      sourceBytes.byteLength,
    );
    const before = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;
    const beforeBytes = canonicalize(before);
    const calls = {
      read: 0,
      execute: 0,
      machineStateDigest: 0,
    };
    const adapter = harness.createInitializationAdapter(
      {
        directorRef: "director.projection-fit",
        proposerRef: "proposer.projection-fit",
        bindingEvidence: "host-adapter:projection-fit",
      },
      (operation) => {
        if (Object.hasOwn(calls, operation)) {
          calls[operation] += 1;
        }
      },
    );

    await assert.rejects(
      adapter.advance(
        adapter.initialState,
        { status: "ready", resultDigest: digest("8") },
      ),
      (error) =>
        error.code ===
          "SURVEY_INITIALIZATION_PROJECTION_UNFIT",
    );
    const after = (
      await harness.coordinator.read(harness.storeId)
    ).snapshot;
    assert.equal(canonicalize(after), beforeBytes);
    assert.deepEqual(calls, {
      read: 1,
      execute: 0,
      machineStateDigest: 0,
    });
    assert.equal(after.commitRevision, 0);
    assert.equal(after.journal.length, 0);
    assert.equal(after.workspace.spec.authoringState, "new");
    assert.equal(after.workspace.spec.openAssignment, null);

    assert.equal(
      after.journal.some((record) =>
        record.machineEdges.some((edge) =>
          ["AT01", "T02"].includes(edge.transitionId))),
      false,
    );
  },
);
