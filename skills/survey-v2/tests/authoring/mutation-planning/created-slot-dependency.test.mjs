import assert from "node:assert/strict";
import test from "node:test";

import {
  briefResource,
  planScenario,
  taskScenario,
} from "./support.mjs";

function addAppendixTarget(profile) {
  const target = {
    slot: "appendix",
    resourceType: {
      apiVersion: "brief.example/v1alpha1",
      kind: "Brief",
    },
    cardinality: { min: 1, max: 1 },
  };
  profile.spec.transitionBindings[0].mutationFootprint.created.push(target);
  profile.spec.revisionUnits[0].replacementTargets.push(
    structuredClone(target),
  );
}

test("a created-slot selector derives an edge from the declaring created resource", async () => {
  const scenario = await taskScenario({
    mutateProfile: addAppendixTarget,
  });
  const products = [
    scenario.args.products[0],
    {
      slot: "appendix",
      resource: briefResource("appendix"),
      dependencies: [{
        relation: "derived-from",
        selector: { mode: "created-slot", slot: "brief" },
      }],
    },
  ];

  const mutation = planScenario(scenario, { products });

  assert.deepEqual(mutation.spec.dependencyEdges.created, [{
    from: mutation.spec.createdResources[1].reference,
    to: mutation.spec.createdResources[0].reference,
    relation: "derived-from",
  }]);
});
