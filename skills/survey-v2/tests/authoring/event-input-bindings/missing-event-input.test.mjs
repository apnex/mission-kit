import assert from "node:assert/strict";
import test from "node:test";
import {
  reduceEventInputs,
} from "./support.mjs";

test(
  "a missing required event input rejects before every semantic callback",
  async () => {
    const { calls, result } = await reduceEventInputs({});
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "CONTEXT_SELECTOR_CARDINALITY_MISMATCH",
    );
    assert.deepEqual(calls, []);
  },
);
