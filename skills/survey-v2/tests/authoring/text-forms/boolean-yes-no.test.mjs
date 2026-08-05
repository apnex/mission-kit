import assert from "node:assert/strict";
import test from "node:test";

import {
  assertErrorCode,
  booleanField,
  makeForm,
  parseEditedBody
} from "./support.mjs";

test("boolean fields map only exact yes and no literals", () => {
  const formDefinition = makeForm({
    fields: [booleanField()]
  });

  assert.deepEqual(
    parseEditedBody(formDefinition, "approved", [" \tyes\t "])
      .normalizedValues,
    { approved: true }
  );
  assert.deepEqual(
    parseEditedBody(formDefinition, "approved", [" no "]).normalizedValues,
    { approved: false }
  );
  for (const value of ["Yes", "true", "1"]) {
    assertErrorCode(
      () => parseEditedBody(formDefinition, "approved", [value]),
      "FIELD_BOOLEAN_INVALID"
    );
  }
});
