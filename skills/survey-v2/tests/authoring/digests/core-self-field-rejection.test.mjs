import assert from "node:assert/strict";
import test from "node:test";
import { digestProjectedCore } from "../../../source/authoring/kernel/digests.mjs";
import { digestA, digestB } from "./resource-fixture.mjs";

test("explicit core projections reject inclusion of their self-digest field", () => {
  assert.throws(
    () =>
      digestProjectedCore(
        "assignment",
        { assignmentDigest: digestA, requestDigest: digestB },
        {
          include: ["assignmentDigest", "requestDigest"],
          selfDigestField: "assignmentDigest",
          label: "assignment"
        }
      ),
    /cannot include its self-digest field assignmentDigest/
  );
});
