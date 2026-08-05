import assert from "node:assert/strict";
import test from "node:test";
import {
  createEventInputScenario,
  reduceEventInputs,
} from "./support.mjs";

test(
  "one declared event input becomes the exact ContextClosure layer and Mutation ancestry",
  async () => {
    const { reference } = await createEventInputScenario();
    const {
      calls,
      observed,
      result,
      selector,
    } = await reduceEventInputs({ intake: reference });
    assert.equal(result.kind, "mutation");
    assert.deepEqual(calls, ["handler"]);
    assert.equal(
      observed.contextClosure.spec.layers.length,
      1,
    );
    const layer = observed.contextClosure.spec.layers[0];
    assert.equal(layer.selectorId, selector.id);
    assert.equal(layer.selectorDigest, selector.selectorDigest);
    assert.deepEqual(layer.sourceReference, reference);
    assert.deepEqual(
      layer.selectedValue.map(({ path }) => path),
      ["/spec/inventory"],
    );
    assert.deepEqual(
      result.mutation.spec.cause.inputs,
      [{
        ordinal: 1,
        role: "intake",
        reference,
        integrityDigest: layer.sourceIntegrityDigest,
      }],
    );
  },
);
