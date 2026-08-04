import assert from "node:assert/strict";
import test from "node:test";
import { authoringDigest } from "../../../source/authoring/kernel/digests.mjs";
import { digestA, digestB } from "./resource-fixture.mjs";

test("ContextClosure layer order is identity-bearing", () => {
  const first = {
    order: 1,
    role: "root",
    reference: { name: "root", semanticDigest: digestA }
  };
  const second = {
    order: 2,
    role: "child",
    reference: { name: "child", semanticDigest: digestB }
  };
  assert.notEqual(
    authoringDigest("context-closure", { layers: [first, second] }),
    authoringDigest("context-closure", { layers: [second, first] })
  );
});
