import assert from "node:assert/strict";
import test from "node:test";
import {
  assignmentDigest,
  blankViewDigest,
  normalizedSubmissionDigest,
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  createReducerSubmissionScenario,
  executeReducerSubmission,
  passRegistrySource,
} from "./support.mjs";

function rebindSubmission(assignment, submission) {
  assignment.spec.assignmentDigest = assignmentDigest(assignment);
  submission.spec.assignment = {
    reference: resourceReferenceFrom(assignment),
    assignmentDigest: assignment.spec.assignmentDigest,
  };
  submission.spec.normalizedSubmissionDigest =
    normalizedSubmissionDigest(submission);
}

const cases = [
  {
    label: "projection ancestry",
    expectedCode: "DAG_ASSIGNMENT_ANCESTRY_MISMATCH",
    tamper(assignment) {
      assignment.spec.projectionArtifact.projectionArtifactDigest =
        `sha256:${"f".repeat(64)}`;
    },
  },
  {
    label: "blank-view skeleton",
    expectedCode: "DAG_SKELETON_MISMATCH",
    tamper(assignment) {
      const bytes = Buffer.from("Tampered assignment skeleton.\n", "utf8");
      assignment.spec.uneditedSkeleton.content = {
        mediaType: "text/plain;charset=utf-8",
        encoding: "base64",
        byteLength: bytes.length,
        data: bytes.toString("base64"),
      };
      assignment.spec.uneditedSkeleton.blankViewDigest =
        blankViewDigest(bytes);
    },
  },
  {
    label: "request handle",
    expectedCode: "DAG_HANDLE_MISMATCH",
    tamper(assignment) {
      assignment.spec.handle = "deadbeef";
    },
  },
];

test(
  "a self-consistent submission with any broken K11 DAG edge rejects before semantic callbacks",
  async () => {
    for (const current of cases) {
      const scenario = await createReducerSubmissionScenario();
      current.tamper(scenario.assignment);
      rebindSubmission(scenario.assignment, scenario.submission);

      const calls = [];
      const result = await executeReducerSubmission(
        scenario,
        passRegistrySource({
          guardInvoke() {
            calls.push("guard");
            return { status: "pass" };
          },
          handlerInvoke() {
            calls.push("handler");
            return { status: "accept", products: [] };
          },
          validatorInvoke() {
            calls.push("validator");
            return { status: "pass" };
          },
        }),
      );

      assert.equal(result.kind, "rejected", current.label);
      assert.equal(
        result.issues[0].spec.code,
        current.expectedCode,
        current.label,
      );
      assert.equal(
        result.issues[0].spec.boundary,
        "kernel.identity",
        current.label,
      );
      assert.deepEqual(calls, [], current.label);
    }
  },
);
