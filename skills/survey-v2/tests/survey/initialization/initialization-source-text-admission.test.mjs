import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  createLiveSurveyHarness,
} from "../profile/live-support.mjs";

function digest(character) {
  return `sha256:${character.repeat(64)}`;
}

async function rejectBeforeAt01({
  label,
  bytes,
  storeId,
}) {
  const harness = await createLiveSurveyHarness({
    storeId,
    sourceEntries: [{
      logicalName: `${label}.txt`,
      bytes,
    }],
  });
  assert.equal(
    harness.sourceSnapshot.spec.inventory[0].content.byteLength,
    bytes.byteLength,
  );
  const before = (
    await harness.coordinator.read(harness.storeId)
  ).snapshot;
  const beforeBytes = canonicalize(before);
  const calls = { read: 0, execute: 0, machineStateDigest: 0 };
  const adapter = harness.createInitializationAdapter(
    {
      directorRef: `director.${label}`,
      proposerRef: `proposer.${label}`,
      bindingEvidence: `host-adapter:${label}`,
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
      { status: "ready", resultDigest: digest("7") },
    ),
    (error) =>
      error.code ===
        "SURVEY_INITIALIZATION_SOURCE_TEXT_UNSUITABLE",
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
}

test(
  "sealed initialization authority rejects BOM and NUL SurveyFrame source text before AT01",
  async () => {
    await rejectBeforeAt01({
      label: "bom",
      bytes: Buffer.from([0xef, 0xbb, 0xbf, 0x61]),
      storeId: "survey-initialization-bom-rejection",
    });
    await rejectBeforeAt01({
      label: "nul",
      bytes: Buffer.from([0x61, 0x00, 0x62]),
      storeId: "survey-initialization-nul-rejection",
    });
  },
);
