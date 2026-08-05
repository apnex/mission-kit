import assert from "node:assert/strict";
import test from "node:test";
import { resourceReferenceFrom } from "../../../../source/authoring/kernel/digests.mjs";
import {
  applyTransitionWorkspace,
} from "../../../../source/authoring/runtime/workspace-application.mjs";
import {
  makeMutation,
  makeWorkspace,
  resource,
} from "./support.mjs";

test("dependency post-image removes and adds only the declared exact edges", () => {
  const [one, two, three] = [
    resource("Node", "node-one"),
    resource("Node", "node-two"),
    resource("Node", "node-three"),
  ];
  const edge = (from, to, relation) => ({
    from: resourceReferenceFrom(from),
    to: resourceReferenceFrom(to),
    relation,
  });
  const retained = edge(one, two, "retained-by");
  const removed = edge(two, three, "superseded-by");
  const added = edge(three, one, "derived-from");
  const workspace = makeWorkspace({
    resources: [one, two, three],
    dependencyEdges: [retained, removed],
  });
  const mutation = makeMutation({
    workspace,
    dependencyEdges: {
      created: [added],
      superseded: [removed],
    },
  });
  assert.deepEqual(applyTransitionWorkspace({
    workspace,
    mutation,
    handoffSlots: [],
  }).spec.dependencyEdges, [retained, added]);
});
