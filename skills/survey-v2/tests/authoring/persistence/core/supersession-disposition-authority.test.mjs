import assert from "node:assert/strict";
import test from "node:test";
import {
  resourceReferenceFrom,
} from "../../../../source/authoring/kernel/digests.mjs";
import {
  createAuthoringCommitReceipt,
  deriveSupersededDescendants,
} from "../../../../source/authoring/runtime/commit-records.mjs";
import {
  applyTransitionWorkspace,
} from "../../../../source/authoring/runtime/workspace-application.mjs";
import {
  errorCode,
  makeMutation,
  makeWorkspace,
  resource,
  slot,
} from "./support.mjs";

test("Receipt supersession dispositions are derived from exact Mutation ancestry", () => {
  const prior = resource("Brief", "brief-prior");
  const descendant = resource("Note", "note-descendant");
  const replacement = resource("Brief", "brief-replacement");
  const priorReference = resourceReferenceFrom(prior);
  const descendantReference = resourceReferenceFrom(descendant);
  const replacementReference = resourceReferenceFrom(replacement);
  const workspace = makeWorkspace({
    resources: [prior, descendant],
    activeHeads: [slot("brief", prior)],
  });
  const mutation = makeMutation({
    workspace,
    createdResources: [{ slot: "brief", resource: replacement }],
    activeHeadChanges: [{
      slot: "brief",
      before: priorReference,
      after: replacementReference,
    }],
    supersededResources: [priorReference, descendantReference],
  });
  const afterWorkspace = applyTransitionWorkspace({
    workspace,
    mutation,
    handoffSlots: [],
  });
  const derived = deriveSupersededDescendants(mutation);
  const wrong = [
    { reference: priorReference, disposition: "invalidated" },
    { reference: descendantReference, disposition: "invalidated" },
  ];

  assert.deepEqual({
    derived,
    wrongReceipt: errorCode(() => createAuthoringCommitReceipt({
      mutation,
      beforeWorkspace: workspace,
      afterWorkspace,
      idempotencyKey: "event:aaaaaaaa",
      supersededDescendants: wrong,
    })),
  }, {
    derived: [
      {
        reference: priorReference,
        disposition: "superseded",
        supersededBy: replacementReference,
      },
      {
        reference: descendantReference,
        disposition: "invalidated",
      },
    ],
    wrongReceipt: "COMMIT_SUPERSESSION_MISMATCH",
  });
});
