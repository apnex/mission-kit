import assert from "node:assert/strict";
import test from "node:test";

import {
  REQUEST_HANDLE,
  canonicalizeAuthoringTextInput,
  makeForm,
  parseTextForm,
  renderBlank,
  renderPopulated
} from "./support.mjs";

function mixCrLfAndCr(bytes) {
  let lineBreak = 0;
  return Buffer.from(
    bytes.toString("utf8").replace(/\n/gu, () => {
      lineBreak += 1;
      return lineBreak % 2 === 0 ? "\r" : "\r\n";
    }),
    "utf8"
  );
}

test("CRLF and CR input normalize to canonical LF bytes", () => {
  assert.equal(
    canonicalizeAuthoringTextInput(
      Buffer.from("alpha\r\nbeta\rgamma\n", "utf8")
    ).toString("utf8"),
    "alpha\nbeta\ngamma\n"
  );

  const formDefinition = makeForm();
  const canonicalBlank = renderBlank(formDefinition);
  const canonicalSubmission = renderPopulated(formDefinition, {
    summary: "first line\nsecond line"
  });
  const parsed = parseTextForm({
    formDefinition,
    blankViewBytes: mixCrLfAndCr(canonicalBlank),
    submittedBytes: mixCrLfAndCr(canonicalSubmission),
    expectedHandle: REQUEST_HANDLE
  });

  assert.deepEqual(parsed.normalizedValues, {
    summary: "first line\nsecond line"
  });
  assert.deepEqual(parsed.canonicalBytes, canonicalSubmission);
  assert.equal(parsed.newlineNormalized, true);
});
