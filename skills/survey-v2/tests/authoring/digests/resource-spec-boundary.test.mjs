import assert from "node:assert/strict";
import test from "node:test";
import {
  resourceIntegrityDigest,
  resourceSemanticDigest
} from "../../../source/authoring/kernel/digests.mjs";
import { exampleResource } from "./resource-fixture.mjs";

test("a resource spec change alters both semantic and integrity identity", () => {
  const first = exampleResource();
  const changed = exampleResource({ subject: "Beta" });
  assert.notEqual(resourceSemanticDigest(first), resourceSemanticDigest(changed));
  assert.notEqual(resourceIntegrityDigest(first), resourceIntegrityDigest(changed));
});
