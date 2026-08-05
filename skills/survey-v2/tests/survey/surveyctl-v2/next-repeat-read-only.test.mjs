import assert from "node:assert/strict";
import test from "node:test";
import {
  createSurveyctlHarness,
  executeCommand,
  initializeHarness,
  readSessionBytes,
} from "./support.mjs";

test(
  "repeating surveyctl next returns byte-identical pending content without another write",
  async (testContext) => {
    const harness = await initializeHarness(
      await createSurveyctlHarness(testContext),
    );
    const first = await executeCommand(
      harness,
      "next",
      { format: "text" },
    );
    const afterFirst = await readSessionBytes(harness);
    const second = await executeCommand(
      harness,
      "next",
      { format: "text" },
    );

    assert.deepEqual(second.output, first.output);
    assert.deepEqual(
      await readSessionBytes(harness),
      afterFirst,
    );
    assert.equal(first.result.kind, "assignment");
    assert.equal(
      second.result.assignment.spec.assignmentDigest,
      first.result.assignment.spec.assignmentDigest,
    );
  },
);
