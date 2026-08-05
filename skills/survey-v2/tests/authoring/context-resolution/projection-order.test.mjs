import assert from "node:assert/strict";
import test from "node:test";
import {
  projectSelectedValue
} from "../../../source/authoring/kernel/context-resolver.mjs";
import {
  assertDeepFrozen,
  sourceResource
} from "./support.mjs";

test("selected values preserve projection order and remain arrays for one field", () => {
  const resource = sourceResource();
  const ordered = projectSelectedValue(
    resource,
    ["/status/phase", "/spec/title"]
  );
  const singular = projectSelectedValue(resource, ["/spec/title"]);

  assert.deepEqual(ordered, [
    { path: "/status/phase", value: "ready" },
    { path: "/spec/title", value: "Exact brief" }
  ]);
  assert.deepEqual(singular, [
    { path: "/spec/title", value: "Exact brief" }
  ]);
  assertDeepFrozen(ordered);
  assertDeepFrozen(singular);
});
