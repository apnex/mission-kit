import test from "node:test";

import {
  assertPlannerError,
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

test("handler candidates must already follow manifest target order", async () => {
  const scenario = await taskScenario({
    mutateProfile: addAppendixTarget,
  });
  const products = [
    {
      slot: "appendix",
      resource: briefResource("appendix"),
      dependencies: [],
    },
    ...scenario.args.products,
  ];

  assertPlannerError(
    () => planScenario(scenario, { products }),
    "PRODUCT_ORDER_INVALID",
  );
});
