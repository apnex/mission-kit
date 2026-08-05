import assert from "node:assert/strict";
import test from "node:test";
import {
  canonicalize
} from "../../../source/authoring/kernel/canonical.mjs";
import {
  resolveContextClosure
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  clone,
  scenario,
  sourceResource,
  stored
} from "./support.mjs";

test("ambient resource-inventory reordering cannot change ContextClosure bytes", () => {
  const input = scenario();
  const ambient = stored(sourceResource({
    name: "ambient-source",
    title: "Ambient immutable version"
  }));
  const selectedFirst = clone(input.workspace);
  selectedFirst.spec.resourceVersions = [clone(input.record), ambient];
  const selectedLast = clone(input.workspace);
  selectedLast.spec.resourceVersions = [ambient, clone(input.record)];

  const first = resolveContextClosure({
    workspace: selectedFirst,
    selectors: [input.selector]
  });
  const second = resolveContextClosure({
    workspace: selectedLast,
    selectors: [input.selector]
  });

  assert.deepEqual(first, second);
  assert.equal(canonicalize(first), canonicalize(second));
});
