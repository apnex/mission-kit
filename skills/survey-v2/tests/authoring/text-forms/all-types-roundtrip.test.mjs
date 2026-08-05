import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  blankViewDigest,
  projectionOutputDigest
} from "../../../source/authoring/kernel/digests.mjs";
import {
  REQUEST_HANDLE,
  makeAllTypesForm,
  parseTextForm,
  renderBlank,
  renderPopulated
} from "./support.mjs";

const golden = JSON.parse(readFileSync(
  new URL(
    "../../fixtures/authoring/text-forms/k11-golden-vectors.json",
    import.meta.url
  ),
  "utf8"
)).textForm;

test("all four field types round-trip through populated canonical text", () => {
  const formDefinition = makeAllTypesForm();
  const normalizedValues = golden.values;
  const blankViewBytes = renderBlank(formDefinition);
  const submittedBytes = renderPopulated(formDefinition, normalizedValues);
  const parsed = parseTextForm({
    formDefinition,
    blankViewBytes,
    submittedBytes,
    expectedHandle: REQUEST_HANDLE
  });

  assert.equal(parsed.requestHandle, REQUEST_HANDLE);
  assert.equal(parsed.newlineNormalized, false);
  assert.deepEqual(formDefinition, golden.form);
  assert.equal(blankViewBytes.toString("utf8"), golden.blankText);
  assert.equal(submittedBytes.toString("utf8"), golden.populatedText);
  assert.equal(blankViewDigest(blankViewBytes), golden.blankViewDigest);
  assert.equal(
    projectionOutputDigest(blankViewBytes),
    golden.projectionOutputDigest
  );
  assert.deepEqual(parsed.normalizedValues, normalizedValues);
  assert.deepEqual(parsed.canonicalBytes, submittedBytes);
  assert.deepEqual(
    renderPopulated(formDefinition, parsed.normalizedValues),
    submittedBytes
  );
});
