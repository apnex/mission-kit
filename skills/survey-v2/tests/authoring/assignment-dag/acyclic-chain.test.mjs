import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  resourceReferenceFrom
} from "../../../source/authoring/kernel/digests.mjs";
import { issueK10TextAssignment } from "./support.mjs";

const golden = JSON.parse(readFileSync(
  new URL(
    "../../fixtures/authoring/text-forms/k11-golden-vectors.json",
    import.meta.url
  ),
  "utf8"
)).assignmentDag;

function topologicalOrder(nodes, edges) {
  const remaining = new Set(nodes);
  const result = [];
  while (remaining.size > 0) {
    const next = [...remaining].find((candidate) => (
      edges.every(([from, to]) => (
        to !== candidate || !remaining.has(from)
      ))
    ));
    if (next === undefined) return null;
    result.push(next);
    remaining.delete(next);
  }
  return result;
}

function referencedResourceNames(value, names = new Set()) {
  if (Array.isArray(value)) {
    for (const item of value) referencedResourceNames(item, names);
    return names;
  }
  if (value === null || typeof value !== "object") return names;
  if (
    typeof value.apiVersion === "string" &&
    typeof value.kind === "string" &&
    typeof value.name === "string" &&
    typeof value.semanticDigest === "string"
  ) {
    names.add(value.name);
  }
  for (const child of Object.values(value)) {
    referencedResourceNames(child, names);
  }
  return names;
}

test("issuance forms an explicit acyclic request-to-projection-to-assignment chain", async () => {
  const {
    assignment,
    contextClosure,
    formDefinition,
    handle,
    projectionArtifact,
    request
  } = await issueK10TextAssignment();
  const requestName = request.metadata.name;
  const projectionName = projectionArtifact.metadata.name;
  const assignmentName = assignment.metadata.name;

  assert.deepEqual(
    projectionArtifact.spec.sources[0].reference,
    resourceReferenceFrom(request)
  );
  assert.deepEqual(
    assignment.spec.request.reference,
    resourceReferenceFrom(request)
  );
  assert.deepEqual(
    assignment.spec.projectionArtifact.reference,
    resourceReferenceFrom(projectionArtifact)
  );

  const edges = [
    [requestName, projectionName],
    [projectionName, assignmentName]
  ];
  assert.deepEqual(
    topologicalOrder(
      [requestName, projectionName, assignmentName],
      edges
    ),
    [requestName, projectionName, assignmentName]
  );
  assert.equal(referencedResourceNames(request).has(assignmentName), false);
  assert.equal(referencedResourceNames(request).has(projectionName), false);
  assert.equal(
    referencedResourceNames(projectionArtifact).has(assignmentName),
    false
  );
  assert.deepEqual(
    {
      requestDigest: request.spec.requestDigest,
      contextClosureDigest: contextClosure.spec.closureDigest,
      formDigest: formDefinition.spec.formDigest,
      handle,
      projectionArtifactDigest:
        projectionArtifact.spec.projectionArtifactDigest,
      projectionOutputDigest: projectionArtifact.spec.output.outputDigest,
      blankViewDigest: assignment.spec.uneditedSkeleton.blankViewDigest,
      assignmentDigest: assignment.spec.assignmentDigest
    },
    golden
  );
});
