import assert from "node:assert/strict";
import test from "node:test";
import { canonicalize } from "../../../source/authoring/kernel/canonical.mjs";
import {
  buildRoundOneQuestionFrameProducts,
} from "../../../source/authoring/survey/round-one-question-frames-authority.mjs";
import {
  roundOneQuestionFramesAuthorityInputs,
} from "./support.mjs";

test("Round 1 QuestionFrame authority creates the exact immutable four-product unit with derived evidence and canonical edges", () => {
  const input = roundOneQuestionFramesAuthorityInputs();
  input.normalizedValues["q1-subject"] = "Decision authority vector 0";
  const before = structuredClone(input);
  const first = buildRoundOneQuestionFrameProducts(input);
  const second = buildRoundOneQuestionFrameProducts(input);
  assert.deepEqual(input, before);
  assert.deepEqual(second, first);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(Object.isFrozen(first[3].resource.spec.slots[0]), true);
  assert.deepEqual(
    first.map(({ slot }) => slot),
    [
      "round-1-question-frame-1",
      "round-1-question-frame-2",
      "round-1-question-frame-3",
      "round-1-question-frame-set",
    ],
  );
  const set = first[3].resource;
  assert.equal(set.spec.roundOrdinal, 1);
  assert.deepEqual(set.spec.roundRef, input.references.round);
  assert.deepEqual(
    set.spec.parentFrameRef,
    input.references.roundFrame,
  );
  assert.deepEqual(
    set.spec.slots.map(({ questionOrdinal }) => questionOrdinal),
    [1, 2, 3],
  );
  const evidence = input.contextClosure.spec.layers.map(
    (layer) => layer.sourceReference,
  );
  set.spec.slots.forEach((slot) => {
    assert.deepEqual(slot.sourceEvidenceRefs, evidence);
    assert.equal(Object.hasOwn(slot, "round1Relation"), false);
    assert.equal(typeof slot.scopeRelation, "string");
    assert.match(slot.containmentRationale, /\S/u);
    assert.match(slot.intentDimension, /\S/u);
    assert.ok(slot.outcomeAxisAnchors.length > 0);
  });
  const frameDependencies = first[3].dependencies
    .filter(({ relation }) => relation === "frames");
  const dependencyReferences = frameDependencies.map(({ selector }) =>
    first.find(({ slot }) => slot === selector.slot).resource
  ).map((resource) => ({
    apiVersion: resource.apiVersion,
    kind: resource.kind,
    name: resource.metadata.name,
    semanticDigest:
      first.find(({ resource: candidate }) => candidate === resource)
        .resource.metadata.name.split("-").at(-1),
  }));
  const canonical = frameDependencies.map(({ selector }) => {
    const resource =
      first.find(({ slot }) => slot === selector.slot).resource;
    return canonicalize({
      apiVersion: resource.apiVersion,
      kind: resource.kind,
      name: resource.metadata.name,
      semanticDigest: `sha256:${resource.metadata.name.split("-").at(-1)}`,
    });
  });
  assert.deepEqual(
    canonical,
    [...canonical].sort((left, right) =>
      Buffer.compare(
        Buffer.from(left, "utf8"),
        Buffer.from(right, "utf8"),
      )),
  );
  assert.notDeepEqual(
    frameDependencies.map(({ selector }) => selector.slot),
    [
      "round-1-question-frame-1",
      "round-1-question-frame-2",
      "round-1-question-frame-3",
    ],
  );
  assert.equal(dependencyReferences.length, 3);
});
