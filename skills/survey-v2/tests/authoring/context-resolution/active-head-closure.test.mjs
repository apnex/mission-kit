import assert from "node:assert/strict";
import test from "node:test";
import {
  contextClosureDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertDeepFrozen,
  scenario
} from "./support.mjs";

test("active-head resolution constructs one deterministic detached ContextClosure", () => {
  const input = scenario();
  const first = resolveContextClosure({
    workspace: input.workspace,
    selectors: [input.selector]
  });
  const second = resolveContextClosure({
    workspace: input.workspace,
    selectors: [input.selector]
  });

  assert.deepEqual(first, second);
  assert.equal(first.spec.closureDigest, contextClosureDigest(first));
  assert.equal(
    first.metadata.name,
    `context-${first.spec.closureDigest.slice("sha256:".length)}`
  );
  assert.deepEqual(first.spec.layers[0].selectedValue, [
    { path: "/spec/title", value: "Exact brief" },
    { path: "/status/phase", value: "ready" }
  ]);
  assertDeepFrozen(first);

  input.workspace.spec.resourceVersions[0].resource.spec.title = "changed";
  assert.equal(first.spec.layers[0].sourceSnapshot.spec.title, "Exact brief");
});
