import assert from "node:assert/strict";
import test from "node:test";
import {
  resolveStoredResourceVersion
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertDeepFrozen,
  sourceResource,
  stored,
  workspaceWith
} from "./support.mjs";

test("exact stored-resource lookup ignores another immutable semantic version of the same logical name", () => {
  const selected = stored(sourceResource({ title: "selected" }));
  const other = stored(sourceResource({ title: "other" }));
  const workspace = workspaceWith({
    records: [other, selected]
  });

  const resolved = resolveStoredResourceVersion(
    workspace,
    selected.reference
  );

  assert.deepEqual(resolved, selected);
  assert.equal(resolved.resource.spec.title, "selected");
  assertDeepFrozen(resolved);
});
