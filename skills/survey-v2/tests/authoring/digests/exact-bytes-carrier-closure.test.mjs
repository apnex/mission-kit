import assert from "node:assert/strict";
import test from "node:test";
import { decodeExactBytes } from "../../../source/authoring/kernel/digests.mjs";

test("exact-byte decoding rejects non-canonical and widened carriers", () => {
  assert.throws(
    () => decodeExactBytes({ encoding: "base64", data: "Zg" }),
    /canonical-base64/
  );
  assert.throws(
    () =>
      decodeExactBytes({
        encoding: "base64",
        data: "Zg==",
        path: "/tmp/evidence.txt"
      }),
    /must be exactly/
  );
});
