import assert from "node:assert/strict";
import test from "node:test";
import {
  rawEvidenceDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  buildSurveySourceSnapshot
} from "../../../source/authoring/survey/source-snapshot.mjs";
import {
  assertSourceSnapshotValid
} from "./support.mjs";

test("ordered UTF-8 intake deterministically builds one immutable SourceSnapshot", () => {
  const firstBytes = Buffer.from("Primary intent.\n", "utf8");
  const secondBytes = Buffer.from("Supporting constraint.\n", "utf8");
  const entries = [
    { logicalName: "intent/primary.txt", bytes: firstBytes },
    { logicalName: "intent/constraint.txt", bytes: secondBytes }
  ];
  const first = buildSurveySourceSnapshot(entries);
  const repeated = buildSurveySourceSnapshot(entries);

  assert.deepEqual(repeated, first);
  assert.notEqual(repeated, first);
  assert.equal(
    first.metadata.name,
    `survey-intake-${first.spec.sourceDigest.slice("sha256:".length)}`
  );
  assert.deepEqual(
    first.spec.inventory.map(({ ordinal, logicalName }) => ({
      ordinal,
      logicalName
    })),
    [
      { ordinal: 1, logicalName: "intent/primary.txt" },
      { ordinal: 2, logicalName: "intent/constraint.txt" }
    ]
  );
  assert.deepEqual(first.spec.inventory[0].content, {
    mediaType: "text/plain;charset=utf-8",
    encoding: "base64",
    byteLength: firstBytes.byteLength,
    data: firstBytes.toString("base64")
  });
  assert.equal(
    first.spec.inventory[0].rawEvidenceDigest,
    rawEvidenceDigest(firstBytes)
  );
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first.spec.inventory[0].content), true);
  assertSourceSnapshotValid(first);

  const reversed = buildSurveySourceSnapshot([...entries].reverse());
  assert.notEqual(reversed.spec.sourceDigest, first.spec.sourceDigest);
  assert.notEqual(reversed.metadata.name, first.metadata.name);

  firstBytes.fill(0x78);
  assert.equal(
    first.spec.inventory[0].content.data,
    Buffer.from("Primary intent.\n", "utf8").toString("base64")
  );
});
