import assert from "node:assert/strict";
import test from "node:test";

import {
  assertErrorCode,
  makeForm,
  parseEditedBody,
  stringListField
} from "./support.mjs";

test("string lists normalize items and enforce syntax, uniqueness, and bounds", () => {
  const formDefinition = makeForm({
    fields: [
      stringListField({
        constraints: {
          minItems: 2,
          maxItems: 3,
          itemMinLength: 2,
          itemMaxLength: 4,
          uniqueItems: true
        }
      })
    ]
  });

  assert.deepEqual(
    parseEditedBody(formDefinition, "items", [
      " ",
      "-  aa ",
      "- bbb\t",
      "\t"
    ]).normalizedValues,
    {
      items: ["aa", "bbb"]
    }
  );

  assertErrorCode(
    () => parseEditedBody(formDefinition, "items", ["* aa", "- bb"]),
    "FIELD_LIST_SYNTAX_INVALID"
  );
  assertErrorCode(
    () => parseEditedBody(formDefinition, "items", ["-   ", "- bb"]),
    "FIELD_LIST_ITEM_EMPTY"
  );
  assertErrorCode(
    () => parseEditedBody(formDefinition, "items", ["- aa", "-  aa "]),
    "FIELD_LIST_ITEM_DUPLICATE"
  );

  for (const body of [
    ["- a", "- bb"],
    ["- abcde", "- bb"],
    ["- aa"],
    ["- aa", "- bb", "- cc", "- dd"]
  ]) {
    assertErrorCode(
      () => parseEditedBody(formDefinition, "items", body),
      "FIELD_CONSTRAINT_VIOLATION"
    );
  }
});
