import assert from "node:assert/strict";
import test from "node:test";
import { deriveRequestHandle } from "../../../source/authoring/kernel/assignment-dag.mjs";
import { digestWithPrefix } from "./support.mjs";

test("request-handle collisions deterministically lengthen only the new handle", () => {
  const requestDigest = digestWithPrefix("12345678abc");
  const occupied = [
    {
      handle: "12345678",
      requestDigest: digestWithPrefix("12345678f", "1")
    },
    {
      handle: "12345678a",
      requestDigest: digestWithPrefix("12345678af", "2")
    },
    {
      handle: "12345678ab",
      requestDigest: digestWithPrefix("12345678abf", "3")
    }
  ];
  const before = structuredClone(occupied);

  assert.equal(
    deriveRequestHandle({ requestDigest, occupied }),
    "12345678abc"
  );
  assert.equal(
    deriveRequestHandle({
      requestDigest,
      occupied: structuredClone(occupied)
    }),
    "12345678abc"
  );
  assert.deepEqual(occupied, before);
});
