import assert from "node:assert/strict";
import test from "node:test";
import { LifecycleRegistry } from "../../source/executables/engine/index.mjs";

test("malformed compact lifecycle tuples fail closed", () => {
  assert.throws(
    () =>
      new LifecycleRegistry({
        tupleColumns: ["transitionId", "eventType", "fromState", "toState"],
        machines: { broken: ["B01|OPEN|[*]"] },
      }),
    /tuple is invalid/u,
  );
});
