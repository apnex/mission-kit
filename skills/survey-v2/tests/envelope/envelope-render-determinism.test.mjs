import assert from "node:assert/strict";
import test from "node:test";
import {
  envelopeDigest,
  renderEnvelopeModel
} from "../../source/executables/runtime/lib/envelope.mjs";

test("one self-contained envelope model renders byte-identically without planning-owned sections", () => {
  const model = {
    title: "Fixture",
    methodology: { name: "Survey v2" },
    authority: { directorRef: "director" },
    lifecycleHandoff: { from: "intent-open", to: "intent-captured" },
    workItem: "Capture fixture intent.",
    outcomeAxes: ["quality"],
    instrument: [{ id: "Q1" }, { id: "Q2" }, { id: "Q3" }, { id: "Q4" }, { id: "Q5" }, { id: "Q6" }],
    responses: [{}, {}, {}, {}, {}, {}],
    interpretations: { round1: {}, round2: {} },
    contradictions: [],
    tensions: [],
    compositeIntent: "Prefer a small coherent outcome.",
    scope: ["intent"],
    antiGoals: ["implementation planning"],
    openDesignQuestions: ["Which implementation realizes this intent?"],
    dependencies: [],
    calibration: { stakeholderTimeCostMinutes: 5 },
    ratification: { authority: "director-only" }
  };
  const first = renderEnvelopeModel(model);
  assert.equal(renderEnvelopeModel(structuredClone(model)), first);
  assert.equal(envelopeDigest(model), envelopeDigest(structuredClone(model)));
  assert.doesNotMatch(first, /^## (Branch strategy|Review strategy|Implementation sequence)$/m);
});
