import assert from "node:assert/strict";
import test from "node:test";
import {
  createEventInputScenario,
  reduceEventInputs,
} from "./support.mjs";

test(
  "an undeclared event input rejects before ContextClosure construction and callbacks",
  async () => {
    const { reference } = await createEventInputScenario();
    const { calls, result } = await reduceEventInputs({
      intake: reference,
      ambient: reference,
    });
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "EVENT_INPUT_UNDECLARED",
    );
    assert.equal(
      result.issues[0].spec.boundary,
      "kernel.authority",
    );
    assert.deepEqual(calls, []);
  },
);
