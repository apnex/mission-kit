import assert from "node:assert/strict";
import test from "node:test";
import { resourceIntegrityDigest } from "../../../source/authoring/kernel/digests.mjs";
import { exampleResource } from "./resource-fixture.mjs";

test("a resource cannot contain its own top-level integrity digest", () => {
  assert.throws(
    () =>
      resourceIntegrityDigest({
        ...exampleResource(),
        integrityDigest: "sha256:deadbeef"
      }),
    /cannot contain its own integrityDigest/
  );
});
