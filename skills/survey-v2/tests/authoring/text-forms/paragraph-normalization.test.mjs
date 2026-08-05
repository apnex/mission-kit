import assert from "node:assert/strict";
import test from "node:test";

import {
  assertErrorCode,
  makeForm,
  paragraphField,
  parseEditedBody
} from "./support.mjs";

test("paragraphs normalize horizontal edges and enforce code-point bounds", () => {
  const normalizedForm = makeForm({
    fields: [
      paragraphField({
        constraints: {
          minLength: 1,
          maxLength: 40
        }
      })
    ]
  });
  const normalized = parseEditedBody(normalizedForm, "summary", [
    " \t",
    "alpha  ",
    "beta\t",
    "\t"
  ]);
  assert.deepEqual(normalized.normalizedValues, {
    summary: "alpha\nbeta"
  });

  const boundedForm = makeForm({
    fields: [
      paragraphField({
        constraints: {
          minLength: 2,
          maxLength: 3
        }
      })
    ]
  });
  for (const value of ["a", "abcd"]) {
    assertErrorCode(
      () => parseEditedBody(boundedForm, "summary", [value]),
      "FIELD_CONSTRAINT_VIOLATION"
    );
  }

  const scalarForm = makeForm({
    fields: [
      paragraphField({
        constraints: {
          minLength: 1,
          maxLength: 1
        }
      })
    ]
  });
  assert.deepEqual(
    parseEditedBody(scalarForm, "summary", ["😀"]).normalizedValues,
    { summary: "😀" }
  );
});
