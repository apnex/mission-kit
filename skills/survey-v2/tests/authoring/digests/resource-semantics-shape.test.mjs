import assert from "node:assert/strict";
import test from "node:test";
import { projectResourceSemantics } from "../../../source/authoring/kernel/digests.mjs";
import { exampleResource } from "./resource-fixture.mjs";

test("resource semantic projection is exactly apiVersion, kind, and spec", () => {
  const value = exampleResource();
  assert.deepEqual(projectResourceSemantics(value), {
    apiVersion: value.apiVersion,
    kind: value.kind,
    spec: value.spec
  });
  assert.deepEqual(Object.keys(projectResourceSemantics(value)), [
    "apiVersion",
    "kind",
    "spec"
  ]);
});
