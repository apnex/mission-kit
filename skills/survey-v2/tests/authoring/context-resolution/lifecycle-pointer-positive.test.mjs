import assert from "node:assert/strict";
import test from "node:test";
import {
  lifecycleRuleDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import { scenario } from "./support.mjs";

test("a JSON-pointer lifecycle rule emits the exact observed-state proof", () => {
  const input = scenario({
    lifecycleRule: {
      mode: "json-pointer-state",
      path: "/status/phase"
    },
    requiredLifecycleState: "ready"
  });

  const closure = resolveContextClosure({
    workspace: input.workspace,
    selectors: [input.selector]
  });

  assert.deepEqual(closure.spec.layers[0].lifecycleProof, {
    observedState: "ready",
    ruleDigest: lifecycleRuleDigest(input.selector)
  });
});
