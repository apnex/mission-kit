import assert from "node:assert/strict";
import test from "node:test";
import { normalizedSubmissionDigest } from "../../../source/authoring/kernel/digests.mjs";
import { authoringSubmission } from "./resource-fixture.mjs";

test("a normalized semantic value change changes normalized-submission identity", () => {
  const base = authoringSubmission();
  assert.notEqual(
    normalizedSubmissionDigest(base),
    normalizedSubmissionDigest(
      authoringSubmission({ normalizedValues: { purpose: "Beta" } })
    )
  );
});
