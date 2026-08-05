import assert from "node:assert/strict";
import test from "node:test";
import { deriveRequestHandle } from "../../../source/authoring/kernel/assignment-dag.mjs";
import { digestWithPrefix } from "./support.mjs";

test("the same request digest reuses its handle independently of registry order", () => {
  const requestDigest = digestWithPrefix("deadbeef1a", "4");
  const occupied = [
    {
      handle: "deadbeef",
      requestDigest: digestWithPrefix("deadbeef9", "5")
    },
    {
      handle: "deadbeef1",
      requestDigest
    },
    {
      handle: "cafebabe",
      requestDigest: digestWithPrefix("cafebabe", "6")
    }
  ];

  const forward = deriveRequestHandle({ requestDigest, occupied });
  const reverse = deriveRequestHandle({
    requestDigest,
    occupied: [...occupied].reverse()
  });

  assert.equal(forward, "deadbeef1");
  assert.equal(reverse, forward);
});
