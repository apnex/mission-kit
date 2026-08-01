import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateById } from "../../generated/validators.mjs";
import {
  envelopeModel,
  newRun,
  reachAwaitingRatification
} from "../fixtures/runtime-fixture.mjs";
import { surveyRoot } from "../fixtures/root.mjs";

test("the envelope model has no mandatory planning-owned fields", async () => {
  const schema = JSON.parse(
    await readFile(`${surveyRoot}/schemas/v1/envelope-model.schema.json`, "utf8")
  );
  const planningOwned = [
    "branchStrategy",
    "reviewStrategy",
    "implementationSequence",
    "compressedTimeline"
  ];
  for (const field of planningOwned) {
    assert.equal(schema.required.includes(field), false);
    assert.equal(Object.hasOwn(schema.properties, field), false);
  }

  const run = await newRun();
  try {
    await reachAwaitingRatification(run);
    const validate = (value) => validateById(
      "urn:mission-kit:survey-v2:schema:envelope-model:v1",
      value
    );
    const model = envelopeModel(run.session);
    assert.equal(validate(model).valid, true);
    for (const field of planningOwned) {
      assert.equal(validate({ ...model, [field]: "not intent-owned" }).valid, false, field);
    }
  } finally {
    await run.cleanup();
  }
});
