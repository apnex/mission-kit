import assert from "node:assert/strict";
import test from "node:test";
import { encodeExactBytes } from "../../../source/authoring/kernel/digests.mjs";

test("exact-byte encoding rejects text and filesystem paths", () => {
  assert.throws(
    () => encodeExactBytes("/tmp/evidence.txt"),
    /not text or a path/
  );
});
