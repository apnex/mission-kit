import assert from "node:assert/strict";
import test from "node:test";
import { projectResourceSemantics } from "../../../source/authoring/kernel/digests.mjs";

test("resource semantic projection fails closed when spec is absent", () => {
  assert.throws(
    () => projectResourceSemantics({ apiVersion: "v1", kind: "MissingSpec" }),
    /missing required field spec/
  );
});
