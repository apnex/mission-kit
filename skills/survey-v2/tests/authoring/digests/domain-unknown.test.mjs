import assert from "node:assert/strict";
import test from "node:test";
import {
  authoringDigest,
  isAuthoringDigestDomain
} from "../../../source/authoring/kernel/digests.mjs";

test("unregistered digest domains fail closed", () => {
  assert.equal(isAuthoringDigestDomain("survey"), false);
  assert.throws(
    () => authoringDigest("survey", { value: "x" }),
    /unknown authoring digest domain/
  );
});
