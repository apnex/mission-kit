import assert from "node:assert/strict";
import test from "node:test";
import {
  resourceIntegrityDigest,
  resourceSemanticDigest
} from "../../../source/authoring/kernel/digests.mjs";
import { exampleResource } from "./resource-fixture.mjs";

test("metadata and status alter integrity but do not alter resource semantic identity", () => {
  const first = exampleResource();
  const changedEvidence = exampleResource({
    name: "frame.beta",
    labels: { owner: "beta" },
    status: { lifecycle: "superseded" }
  });
  assert.equal(resourceSemanticDigest(first), resourceSemanticDigest(changedEvidence));
  assert.notEqual(resourceIntegrityDigest(first), resourceIntegrityDigest(changedEvidence));
});
