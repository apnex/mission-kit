import assert from "node:assert/strict";
import test from "node:test";
import {
  projectResourceReference,
  resourceReferenceDigest,
  resourceReferenceFrom,
  resourceSemanticDigest
} from "../../../source/authoring/kernel/digests.mjs";
import { exampleResource } from "./resource-fixture.mjs";

test("resource references bind metadata.name separately from semantic identity", () => {
  const first = exampleResource();
  const renamed = exampleResource({ name: "frame.beta" });
  const firstReference = resourceReferenceFrom(first);
  const renamedReference = resourceReferenceFrom(renamed);
  assert.equal(firstReference.semanticDigest, renamedReference.semanticDigest);
  assert.notEqual(
    resourceReferenceDigest(firstReference),
    resourceReferenceDigest(renamedReference)
  );
  assert.deepEqual(projectResourceReference(firstReference), {
    apiVersion: first.apiVersion,
    kind: first.kind,
    name: "frame.alpha",
    semanticDigest: resourceSemanticDigest(first)
  });
});
