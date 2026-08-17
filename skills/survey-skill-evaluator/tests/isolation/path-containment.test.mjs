import test from "node:test";
import assert from "node:assert/strict";
import { resolveContained, ValidationError } from "../../source/executables/engine/index.mjs";

test("authority-root containment accepts children and rejects traversal", () => {
  assert.equal(resolveContained("/tmp/root", "a", "b"), "/tmp/root/a/b");
  assert.throws(
    () => resolveContained("/tmp/root", "..", "escape"),
    (error) => error instanceof ValidationError,
  );
});
