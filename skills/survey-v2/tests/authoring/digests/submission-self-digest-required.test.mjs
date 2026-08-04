import assert from "node:assert/strict";
import test from "node:test";
import {
  projectNormalizedSubmissionCore
} from "../../../source/authoring/kernel/digests.mjs";
import { authoringSubmission } from "./resource-fixture.mjs";

test("normalized-submission projection requires its self-digest field", () => {
  const submission = authoringSubmission();
  delete submission.spec.normalizedSubmissionDigest;

  assert.throws(
    () => projectNormalizedSubmissionCore(submission),
    /missing required field normalizedSubmissionDigest/
  );
});
