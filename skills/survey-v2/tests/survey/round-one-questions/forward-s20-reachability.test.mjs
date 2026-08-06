import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize,
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  buildRoundOneQuestionProducts,
} from "../../../source/authoring/survey/round-one-questions-authority.mjs";
import {
  roundOneQuestionsAuthorityInputs,
} from "./support.mjs";

const reverseTraversalRelations = Object.freeze([
  "belongs-to",
  "binds",
  "derived-from",
  "frames",
  "parent-frame",
  "governed-by",
]);

function referenceKey(reference) {
  return canonicalize(reference);
}

function dependencyEdge(from, relation, to) {
  return { from, relation, to };
}

function resolveSelector(selector, input, productsBySlot) {
  if (selector.mode === "context-layer") {
    const layer = input.contextClosure.spec.layers.find(
      ({ ordinal }) => ordinal === selector.ordinal,
    );
    assert.ok(layer, `missing ContextClosure layer ${selector.ordinal}`);
    return layer.sourceReference;
  }
  if (selector.mode === "created-slot") {
    const product = productsBySlot.get(selector.slot);
    assert.ok(product, `missing created slot ${selector.slot}`);
    return resourceReferenceFrom(product.resource);
  }
  if (selector.mode === "active-head") {
    const head = input.workspace.spec.activeHeads.find(
      ({ slot }) => slot === selector.slot,
    );
    assert.ok(head, `missing active-head slot ${selector.slot}`);
    return head.reference;
  }
  if (selector.mode === "context-closure") {
    assert.deepEqual(Object.keys(selector), ["mode"]);
    return resourceReferenceFrom(input.contextClosure);
  }
  assert.fail(`unadmitted dependency selector ${selector.mode}`);
}

function reverseReachable(seedReferences, dependencyEdges) {
  const admittedRelations = new Set(reverseTraversalRelations);
  const reached = new Set(seedReferences.map(referenceKey));
  let changed = true;
  while (changed) {
    changed = false;
    for (const edge of dependencyEdges) {
      assert.ok(
        admittedRelations.has(edge.relation),
        `unadmitted reverse-traversal relation ${edge.relation}`,
      );
      if (
        reached.has(referenceKey(edge.to)) &&
        !reached.has(referenceKey(edge.from))
      ) {
        reached.add(referenceKey(edge.from));
        changed = true;
      }
    }
  }
  return reached;
}

function slotsReached(products, reached) {
  return products
    .filter(({ resource }) =>
      reached.has(referenceKey(resourceReferenceFrom(resource)))
    )
    .map(({ slot }) => slot);
}

function partitionHandoffsByInvalidation(handoffs, invalidatedReferences) {
  const invalidatedKeys = new Set(invalidatedReferences.map(referenceKey));
  return {
    identified: handoffs.filter(({ reference }) =>
      invalidatedKeys.has(referenceKey(reference))
    ),
    retained: handoffs.filter(({ reference }) =>
      !invalidatedKeys.has(referenceKey(reference))
    ),
  };
}

test("R12 dependency graph proves forward S20 reverse reachability without claiming revision execution", () => {
  const input = roundOneQuestionsAuthorityInputs();
  const products = buildRoundOneQuestionProducts(input);
  const productsBySlot = new Map(
    products.map((product) => [product.slot, product]),
  );
  const referencesBySlot = new Map(
    products.map(({ slot, resource }) => [
      slot,
      resourceReferenceFrom(resource),
    ]),
  );
  const questionReferences = [1, 2, 3].map((ordinal) =>
    referencesBySlot.get(`round-1-question-${ordinal}`)
  );
  const bindingReferences = [1, 2, 3].map((ordinal) =>
    referencesBySlot.get(`round-1-question-binding-${ordinal}`)
  );
  const instrumentReference = referencesBySlot.get("round-1-instrument");

  const expectedFrozenAncestry = [
    dependencyEdge(
      input.references.roundFrame,
      "derived-from",
      input.references.surveyFrame,
    ),
    dependencyEdge(
      input.references.round,
      "belongs-to",
      input.references.survey,
    ),
    dependencyEdge(
      input.references.round,
      "frames",
      input.references.roundFrame,
    ),
    dependencyEdge(
      input.references.round,
      "parent-frame",
      input.references.surveyFrame,
    ),
    ...input.references.questionFrames.map((reference) =>
      dependencyEdge(reference, "derived-from", input.references.roundFrame)
    ),
    dependencyEdge(
      input.references.frameSet,
      "belongs-to",
      input.references.round,
    ),
    ...input.references.questionFrames.map((reference) =>
      dependencyEdge(input.references.frameSet, "frames", reference)
    ),
    dependencyEdge(
      input.references.frameSet,
      "parent-frame",
      input.references.roundFrame,
    ),
  ];
  assert.equal(expectedFrozenAncestry.length, 12);
  assert.deepEqual(
    input.workspace.spec.dependencyEdges,
    expectedFrozenAncestry,
  );

  const resolvedRoundOneEdges = products.flatMap((product) => {
    const from = resourceReferenceFrom(product.resource);
    return product.dependencies.map(({ relation, selector }) =>
      dependencyEdge(
        from,
        relation,
        resolveSelector(selector, input, productsBySlot),
      )
    );
  });
  const instrumentBindTargets = [
    input.references.frameSet,
    ...questionReferences,
    ...bindingReferences,
  ].sort((left, right) =>
    Buffer.compare(
      Buffer.from(canonicalize(left), "utf8"),
      Buffer.from(canonicalize(right), "utf8"),
    )
  );
  const expectedRoundOneEdges = [
    ...questionReferences.map((reference, index) =>
      dependencyEdge(
        reference,
        "derived-from",
        input.references.questionFrames[index],
      )
    ),
    ...bindingReferences.flatMap((reference, index) => [
      dependencyEdge(reference, "belongs-to", input.references.frameSet),
      dependencyEdge(reference, "binds", questionReferences[index]),
      dependencyEdge(
        reference,
        "derived-from",
        input.references.questionFrames[index],
      ),
    ]),
    dependencyEdge(
      instrumentReference,
      "belongs-to",
      input.references.round,
    ),
    ...instrumentBindTargets.map((reference) =>
      dependencyEdge(instrumentReference, "binds", reference)
    ),
    dependencyEdge(
      instrumentReference,
      "derived-from",
      input.references.contextClosure,
    ),
    dependencyEdge(
      instrumentReference,
      "governed-by",
      input.references.policy,
    ),
  ];
  assert.equal(expectedRoundOneEdges.length, 22);
  assert.deepEqual(resolvedRoundOneEdges, expectedRoundOneEdges);

  const instrumentUnitSlots = products.map(({ slot }) => slot);
  const instrumentUnitKeys = new Set(
    products.map(({ resource }) =>
      referenceKey(resourceReferenceFrom(resource))
    ),
  );
  assert.equal(instrumentUnitKeys.size, 7);
  assert.equal(
    resolvedRoundOneEdges.every(({ from }) =>
      instrumentUnitKeys.has(referenceKey(from))
    ),
    true,
  );
  assert.deepEqual(
    Object.fromEntries(
      ["belongs-to", "binds", "derived-from", "governed-by"].map(
        (relation) => [
          relation,
          resolvedRoundOneEdges.filter((edge) =>
            edge.relation === relation
          ).length,
        ],
      ),
    ),
    {
      "belongs-to": 4,
      binds: 10,
      "derived-from": 7,
      "governed-by": 1,
    },
  );

  const completeGraph = [
    ...expectedFrozenAncestry,
    ...resolvedRoundOneEdges,
  ];
  assert.equal(completeGraph.length, 34);
  assert.equal(
    new Set(completeGraph.map(canonicalize)).size,
    completeGraph.length,
  );
  assert.deepEqual(
    [...new Set(completeGraph.map(({ relation }) => relation))].sort(),
    [...reverseTraversalRelations].sort(),
  );

  const questionFrameSetUnit = [
    ...input.references.questionFrames,
    input.references.frameSet,
  ];
  assert.equal(questionFrameSetUnit.length, 4);
  assert.deepEqual(
    slotsReached(
      products,
      reverseReachable(questionFrameSetUnit, completeGraph),
    ),
    instrumentUnitSlots,
  );

  const roundFrameUnit = [
    input.references.roundFrame,
    input.references.round,
  ];
  assert.deepEqual(
    slotsReached(
      products,
      reverseReachable(roundFrameUnit, completeGraph),
    ),
    instrumentUnitSlots,
  );

  const surveyFrameUnit = [
    input.references.surveyFrame,
    input.references.survey,
  ];
  assert.deepEqual(
    slotsReached(
      products,
      reverseReachable(surveyFrameUnit, completeGraph),
    ),
    instrumentUnitSlots,
  );

  const handoffs = [{
    slot: "round-1-instrument",
    reference: instrumentReference,
  }];
  const instrumentInvalidation = reverseReachable(
    [instrumentReference],
    completeGraph,
  );
  const invalidatedActiveHeads = products
    .map(({ resource }) => resourceReferenceFrom(resource))
    .filter((reference) =>
      instrumentInvalidation.has(referenceKey(reference))
    );
  const partition = partitionHandoffsByInvalidation(
    handoffs,
    invalidatedActiveHeads,
  );
  assert.deepEqual(partition.identified, handoffs);
  assert.deepEqual(partition.retained, []);
});
