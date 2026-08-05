import assert from "node:assert/strict";
import test from "node:test";
import {
  SURVEY_SOURCE_MAX_ENTRIES,
  SURVEY_SOURCE_MAX_ENTRY_BYTES,
  buildSurveySourceSnapshot
} from "../../../source/authoring/survey/source-snapshot.mjs";

function entry(logicalName = "intent.txt", bytes = Buffer.from("intent\n")) {
  return { logicalName, bytes };
}

test("Survey source admission rejects ambient, unsafe, ambiguous, non-UTF-8, and over-bound input", () => {
  const ambientArray = [entry()];
  ambientArray.injected = true;
  const aggregateOverflow = Array.from(
    { length: 17 },
    (_, index) => entry(
      `part-${index + 1}.txt`,
      Buffer.alloc(SURVEY_SOURCE_MAX_ENTRY_BYTES, 0x61)
    )
  );
  let accessorReads = 0;
  const accessorEntry = {
    bytes: Buffer.from("intent\n"),
    get logicalName() {
      accessorReads += 1;
      return "intent.txt";
    }
  };
  const rejected = [
    [],
    Array.from(
      { length: SURVEY_SOURCE_MAX_ENTRIES + 1 },
      (_, index) => entry(`part-${index + 1}.txt`)
    ),
    [{ ...entry(), ordinal: 1 }],
    ambientArray,
    [entry("/absolute.txt")],
    [entry("../escape.txt")],
    [entry("bad\\name.txt")],
    [entry("same.txt"), entry("same.txt")],
    [entry("invalid.txt", Buffer.from([0xc3, 0x28]))],
    [{ logicalName: "not-bytes.txt", bytes: "intent" }],
    [entry(
      "oversized.txt",
      Buffer.alloc(SURVEY_SOURCE_MAX_ENTRY_BYTES + 1, 0x61)
    )],
    aggregateOverflow,
    [accessorEntry]
  ];

  for (const candidate of rejected) {
    assert.throws(() => buildSurveySourceSnapshot(candidate));
  }
  assert.equal(accessorReads, 0);
});
