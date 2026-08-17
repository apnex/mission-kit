import assert from "node:assert/strict";
import test from "node:test";
import {
  makeCandidateCapture,
} from "../helpers/candidate-capture-fixture.mjs";

test("candidate capture includes hidden regular files with an empty exclusion set", async () => {
  const fixture = await makeCandidateCapture({
    sourceOptions: { hiddenText: "must-be-captured" },
  });
  try {
    assert.deepEqual(
      fixture.captured.snapshot.entries.map((entry) => entry.path),
      [".hidden", "SKILL.md"],
    );
    assert.equal(
      fixture.captured.snapshot.implicitExclusionsPermitted,
      false,
    );
  } finally {
    await fixture.cleanup();
  }
});
