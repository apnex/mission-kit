import assert from "node:assert/strict";
import test from "node:test";
import {
  createEventInputScenario,
  reduceEventInputs,
} from "./support.mjs";

test(
  "an event rejects two declared input keys that alias one resource reference before callbacks",
  async () => {
    const { reference } = await createEventInputScenario();
    const { calls, result } = await reduceEventInputs(
      {
        intake: reference,
        policy: reference,
      },
      { aliasSecondInput: true },
    );
    assert.equal(result.kind, "rejected");
    assert.equal(
      result.issues[0].spec.code,
      "EVENT_INPUT_REFERENCE_ALIAS",
    );
    assert.equal(
      result.issues[0].spec.boundary,
      "kernel.authority",
    );
    assert.deepEqual(calls, []);
  },
);
